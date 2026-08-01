import { Link, useLocation, useParams } from 'react-router-dom';

import { Icon } from '../../../components/ui/Icon';
import { appConfig } from '../../../config/app.config';
import type { CheckoutResult } from '../../checkout';
import { PAYMENT_METHOD_LABELS } from '../../store-settings';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatPrice } from '../utils/format';

/**
 * Confirmación tras `createOrder`. Muestra el resumen que devolvió el
 * servidor (recibido por `location.state`, nunca lee `orders` desde
 * Firestore: el invitado no tiene acceso a esa colección).
 */
export function OrderConfirmationPage() {
  const { number } = useParams<{ number: string }>();
  const location = useLocation();
  const result = (location.state as { result?: CheckoutResult } | null)?.result;

  useDocumentMeta({ title: `Pedido ${number ?? ''} | ${appConfig.name}`, noindex: true });

  if (!result) {
    return (
      <div className="store-listing">
        <StoreBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Pedido' }]} />
        <div className="cart-empty">
          <span className="cart-empty__icon" aria-hidden="true">
            <Icon name="check" size={40} />
          </span>
          <h1>¡Pedido {number} recibido!</h1>
          <p>Ya no tenemos el detalle a mano en esta pantalla, pero tu pedido quedó registrado.</p>
          <Link className="button button--primary" to="/catalogo">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-listing">
      <StoreBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Pedido' }]} />
      <div className="cart-empty">
        <span className="cart-empty__icon" aria-hidden="true">
          <Icon name="check" size={40} />
        </span>
        <h1>¡Gracias, {result.customer.name.split(' ')[0]}!</h1>
        <p>
          Tu pedido <strong>{result.number}</strong> quedó registrado. Te contactamos por WhatsApp
          al <strong>{result.customer.phoneDisplay}</strong> para coordinar
          {result.deliveryMethod === 'delivery' ? ' la entrega' : ' el retiro'}.
        </p>
      </div>

      <div className="order-confirmation__summary">
        <section className="checkout-section" aria-labelledby="order-summary">
          <h2 id="order-summary">Resumen del pedido</h2>
          <ul className="checkout-items">
            {result.items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <span>{formatPrice(result.totals.itemsSubtotal)}</span>
          </div>
          <div className="cart-summary__row">
            <span>Envío</span>
            <span>{formatPrice(result.totals.deliveryCost)}</span>
          </div>
          <div className="cart-summary__row">
            <span>Total</span>
            <strong>{formatPrice(result.totals.total)}</strong>
          </div>
          <p className="cart-summary__note">
            Medio de pago: {PAYMENT_METHOD_LABELS[result.paymentMethod]}.
          </p>
        </section>
      </div>

      <div className="order-confirmation__actions">
        <Link className="button button--secondary" to="/catalogo">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
