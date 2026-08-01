import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { ParaguayPhoneInput } from '../../../components/ui/inputs/ParaguayPhoneInput';
import { TextField } from '../../../components/ui/TextField';
import { appConfig } from '../../../config/app.config';
import { useCart } from '../../cart';
import { getActiveProductById, type Product } from '../../catalog';
import {
  buildRevalidationOutcome,
  CheckoutError,
  submitOrder,
  validateCheckoutForm,
  type CheckoutFormState,
  type RevalidationIssue,
} from '../../checkout';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '../../store-settings';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatPrice } from '../utils/format';

const emptyForm: CheckoutFormState = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  deliveryMethod: 'pickup',
  deliveryZoneId: '',
  paymentMethod: '',
  notes: '',
};

function issueMessage(issue: RevalidationIssue): string {
  switch (issue.kind) {
    case 'removed':
      return `"${issue.name}" ya no está disponible y se quitó del carrito.`;
    case 'price-changed':
      return `El precio de "${issue.name}" cambió a ${formatPrice(issue.nextPrice ?? 0)}.`;
    case 'stock-reduced':
      return `Solo quedan ${issue.availableQuantity} unidades de "${issue.name}"; ajustamos la cantidad.`;
  }
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { settings } = useStorefrontContext();
  const { items, setItemQuantity, removeProduct, clear } = useCart();
  const notesId = useId();
  const addressId = useId();

  useDocumentMeta({ title: `Finalizar compra | ${appConfig.name}`, noindex: true });

  const [form, setForm] = useState<CheckoutFormState>(emptyForm);
  const [revalidating, setRevalidating] = useState(() => items.length > 0);
  const [validatedProducts, setValidatedProducts] = useState<Map<string, Product>>(new Map());
  const [issues, setIssues] = useState<RevalidationIssue[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<CheckoutFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  useEffect(() => {
    if (items.length === 0) return undefined;
    let cancelled = false;
    Promise.all(items.map((item) => getActiveProductById(item.productId))).then((products) => {
      if (cancelled) return;
      const byId = new Map<string, Product | null>();
      items.forEach((item, index) => byId.set(item.productId, products[index] ?? null));
      const outcome = buildRevalidationOutcome(items, byId);

      for (const productId of outcome.removals) removeProduct(productId);
      for (const [productId, quantity] of outcome.quantityUpdates) {
        setItemQuantity(productId, quantity);
      }

      const survivors = new Map<string, Product>();
      for (const [productId, product] of byId) {
        if (product && !outcome.removals.has(productId)) survivors.set(productId, product);
      }
      setValidatedProducts(survivors);
      setIssues(outcome.issues);
      setRevalidating(false);
    });
    return () => {
      cancelled = true;
    };
    // Solo al entrar al checkout; no re-revalidar en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeZones = useMemo(
    () =>
      [...settings.deliveryZones]
        .filter((zone) => zone.active)
        .sort((first, second) => first.order - second.order),
    [settings.deliveryZones],
  );

  const itemsSubtotal = items.reduce(
    (sum, item) =>
      sum + (validatedProducts.get(item.productId)?.price ?? item.price) * item.quantity,
    0,
  );
  const selectedZone = activeZones.find((zone) => zone.id === form.deliveryZoneId);
  const deliveryCost = form.deliveryMethod === 'delivery' ? (selectedZone?.cost ?? 0) : 0;
  const total = itemsSubtotal + deliveryCost;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || revalidating || items.length === 0) return;

    const validationErrors = validateCheckoutForm(form, {
      pickupEnabled: settings.pickupEnabled,
      deliveryEnabled: settings.deliveryEnabled,
      acceptedPaymentMethods: settings.acceptedPaymentMethods,
    });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSubmitting(true);
    try {
      const result = await submitOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        customer: {
          name: form.customerName,
          phone: form.customerPhone,
          ...(form.customerEmail ? { email: form.customerEmail } : {}),
          ...(form.customerAddress ? { address: form.customerAddress } : {}),
        },
        deliveryMethod: form.deliveryMethod,
        ...(form.deliveryMethod === 'delivery' ? { deliveryZoneId: form.deliveryZoneId } : {}),
        paymentMethod: form.paymentMethod as PaymentMethod,
        ...(form.notes ? { notes: form.notes } : {}),
      });
      clear();
      navigate(`/pedido/${result.number}/gracias`, { state: { result } });
    } catch (cause) {
      setErrors([
        cause instanceof CheckoutError
          ? cause.message
          : 'No se pudo crear el pedido. Intentá nuevamente.',
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  if (revalidating) {
    return (
      <div className="store-listing">
        <StoreBreadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Carrito', href: '/carrito' },
            { label: 'Checkout' },
          ]}
        />
        <p className="admin-page__note">Revisando disponibilidad de tu pedido…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="store-listing">
        <StoreBreadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Carrito', href: '/carrito' },
            { label: 'Checkout' },
          ]}
        />
        <div className="cart-empty">
          <span className="cart-empty__icon" aria-hidden="true">
            <Icon name="cart" size={40} />
          </span>
          <h1>Tu carrito está vacío</h1>
          {issues.length > 0 ? (
            <p>Algunos productos ya no estaban disponibles y se quitaron del carrito.</p>
          ) : null}
          <Link className="button button--primary" to="/catalogo">
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-listing">
      <StoreBreadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Carrito', href: '/carrito' },
          { label: 'Checkout' },
        ]}
      />
      <div className="store-listing__head">
        <h1 className="store-listing__title">Finalizar compra</h1>
      </div>

      {issues.length > 0 ? (
        <Alert title="Actualizamos tu carrito" tone="warning">
          {issues.map((issue) => issueMessage(issue)).join(' ')}
        </Alert>
      ) : null}

      {errors.length > 0 ? (
        <Alert onDismiss={() => setErrors([])} title="Revisá estos puntos" tone="danger">
          {errors.join(' ')}
        </Alert>
      ) : null}

      <form className="cart-layout" onSubmit={handleSubmit}>
        <div className="checkout-form">
          <section className="checkout-section" aria-labelledby="checkout-contact">
            <h2 id="checkout-contact">Tus datos</h2>
            <div className="form-grid">
              <TextField
                label="Nombre y apellido"
                onChange={(event) => update({ customerName: event.currentTarget.value })}
                required
                value={form.customerName}
              />
              <ParaguayPhoneInput
                helpText="Te contactamos por acá para coordinar la entrega."
                label="WhatsApp"
                mode="mobile"
                onValueChange={(value) => update({ customerPhone: value.displayValue })}
                required
                value={form.customerPhone}
              />
              <TextField
                helpText="Opcional."
                label="Correo electrónico"
                onChange={(event) => update({ customerEmail: event.currentTarget.value })}
                type="email"
                value={form.customerEmail}
              />
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="checkout-delivery">
            <h2 id="checkout-delivery">Entrega</h2>
            <div className="admin-section__toggles">
              {settings.pickupEnabled ? (
                <label className="checkbox-field">
                  <input
                    checked={form.deliveryMethod === 'pickup'}
                    name="deliveryMethod"
                    onChange={() => update({ deliveryMethod: 'pickup', deliveryZoneId: '' })}
                    type="radio"
                  />
                  <span>
                    Retiro en local<small>Coordinamos el horario por WhatsApp.</small>
                  </span>
                </label>
              ) : null}
              {settings.deliveryEnabled ? (
                <label className="checkbox-field">
                  <input
                    checked={form.deliveryMethod === 'delivery'}
                    name="deliveryMethod"
                    onChange={() => update({ deliveryMethod: 'delivery' })}
                    type="radio"
                  />
                  <span>
                    Delivery<small>Elegí tu zona para ver el costo de envío.</small>
                  </span>
                </label>
              ) : null}
            </div>

            {form.deliveryMethod === 'delivery' ? (
              <>
                <div className="text-field">
                  <label htmlFor="checkout-zone">Zona de entrega</label>
                  <select
                    className="text-field__input"
                    id="checkout-zone"
                    onChange={(event) => update({ deliveryZoneId: event.currentTarget.value })}
                    required
                    value={form.deliveryZoneId}
                  >
                    <option value="">Elegí una zona</option>
                    {activeZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} — {formatPrice(zone.cost)}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField
                  helpText="Calle, número y alguna referencia."
                  id={addressId}
                  label="Dirección (opcional)"
                  onChange={(event) => update({ customerAddress: event.currentTarget.value })}
                  value={form.customerAddress}
                />
              </>
            ) : null}
          </section>

          <section className="checkout-section" aria-labelledby="checkout-payment">
            <h2 id="checkout-payment">Medio de pago</h2>
            <div className="admin-section__toggles">
              {settings.acceptedPaymentMethods.map((method) => (
                <label className="checkbox-field" key={method}>
                  <input
                    checked={form.paymentMethod === method}
                    name="paymentMethod"
                    onChange={() => update({ paymentMethod: method })}
                    type="radio"
                  />
                  <span>{PAYMENT_METHOD_LABELS[method]}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="checkout-notes">
            <h2 id="checkout-notes">Notas (opcional)</h2>
            <div className="text-field">
              <label htmlFor={notesId}>Algo que debamos saber sobre tu pedido</label>
              <textarea
                className="text-field__input"
                id={notesId}
                onChange={(event) => update({ notes: event.currentTarget.value })}
                rows={3}
                value={form.notes}
              />
            </div>
          </section>
        </div>

        <aside className="cart-summary" aria-label="Resumen del pedido">
          <h2>Resumen</h2>
          <ul className="checkout-items">
            {items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>
                  {formatPrice(
                    (validatedProducts.get(item.productId)?.price ?? item.price) * item.quantity,
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <span>{formatPrice(itemsSubtotal)}</span>
          </div>
          <div className="cart-summary__row">
            <span>Envío</span>
            <span>
              {form.deliveryMethod === 'delivery' && !selectedZone
                ? '—'
                : formatPrice(deliveryCost)}
            </span>
          </div>
          <div className="cart-summary__row">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Button
            className="cart-summary__cta"
            loading={submitting}
            loadingLabel="Enviando"
            type="submit"
          >
            Confirmar pedido
          </Button>
          <p className="cart-summary__note">
            Vas a pagar al recibir o coordinar por WhatsApp según el medio elegido.
          </p>
          <div className="cart-summary__actions">
            <Link to="/carrito">Modificar carrito</Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
