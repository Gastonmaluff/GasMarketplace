import { Link } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Icon } from '../../../components/ui/Icon';
import { useCart } from '../../cart';
import { ProductImage } from '../components/ProductImage';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatPrice } from '../utils/format';
import { buildWhatsappLink } from '../utils/whatsapp';

function buildOrderMessage(items: ReturnType<typeof useCart>['items'], subtotal: number): string {
  const lines = items.map(
    (item) => `• ${item.quantity} × ${item.name} — ${formatPrice(item.price * item.quantity)}`,
  );
  return [
    'Hola, quiero hacer este pedido:',
    '',
    ...lines,
    '',
    `Subtotal: ${formatPrice(subtotal)}`,
    '(El envío se coordina según la zona.)',
  ].join('\n');
}

export function CartPage() {
  const { settings } = useStorefrontContext();
  const { items, totals, setItemQuantity, removeProduct, clear } = useCart();

  useDocumentMeta({ title: `Carrito | ${appConfig.name}`, noindex: true });

  const whatsappOrderLink =
    items.length > 0
      ? buildWhatsappLink(
          settings.whatsappNumberNormalized,
          buildOrderMessage(items, totals.subtotal),
        )
      : null;

  if (items.length === 0) {
    return (
      <div className="store-listing">
        <StoreBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito' }]} />
        <div className="cart-empty">
          <span className="cart-empty__icon" aria-hidden="true">
            <Icon name="cart" size={40} />
          </span>
          <h1>Tu carrito está vacío</h1>
          <p>Agregá productos desde el catálogo y aparecerán acá.</p>
          <Link className="button button--primary" to="/catalogo">
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-listing">
      <StoreBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito' }]} />
      <div className="store-listing__head">
        <h1 className="store-listing__title">Tu carrito</h1>
        <p className="store-listing__subtitle">
          {totals.count} {totals.count === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      <div className="cart-layout">
        <ul className="cart-items">
          {items.map((item) => (
            <li className="cart-line" key={item.productId}>
              <Link className="cart-line__media" to={`/producto/${item.slug}`}>
                <ProductImage alt={item.name} loading="lazy" src={item.image} />
              </Link>
              <div className="cart-line__info">
                <Link className="cart-line__name" to={`/producto/${item.slug}`}>
                  {item.name}
                </Link>
                <span className="cart-line__unit">{formatPrice(item.price)} c/u</span>
                <button
                  className="cart-line__remove"
                  onClick={() => removeProduct(item.productId)}
                  type="button"
                >
                  Quitar
                </button>
              </div>
              <div className="cart-qty" role="group" aria-label={`Cantidad de ${item.name}`}>
                <button
                  aria-label="Restar uno"
                  className="cart-qty__btn"
                  onClick={() => setItemQuantity(item.productId, item.quantity - 1)}
                  type="button"
                >
                  −
                </button>
                <input
                  aria-label={`Cantidad de ${item.name}`}
                  className="cart-qty__input"
                  inputMode="numeric"
                  onChange={(event) => {
                    const next = Number.parseInt(event.currentTarget.value, 10);
                    if (Number.isFinite(next)) setItemQuantity(item.productId, next);
                  }}
                  value={item.quantity}
                />
                <button
                  aria-label="Sumar uno"
                  className="cart-qty__btn"
                  disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                  onClick={() => setItemQuantity(item.productId, item.quantity + 1)}
                  type="button"
                >
                  +
                </button>
              </div>
              <div className="cart-line__subtotal">{formatPrice(item.price * item.quantity)}</div>
            </li>
          ))}
        </ul>

        <aside className="cart-summary" aria-label="Resumen del pedido">
          <h2>Resumen</h2>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <strong>{formatPrice(totals.subtotal)}</strong>
          </div>
          <p className="cart-summary__note">El costo de envío se coordina según tu zona.</p>
          {whatsappOrderLink ? (
            <a
              className="button button--primary cart-summary__cta"
              href={whatsappOrderLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              Finalizar pedido por WhatsApp
            </a>
          ) : null}
          <button
            className="button button--ghost"
            disabled
            title="Disponible próximamente"
            type="button"
          >
            Checkout online (próximamente)
          </button>
          <div className="cart-summary__actions">
            <Link to="/catalogo">Seguir comprando</Link>
            <button className="cart-summary__clear" onClick={clear} type="button">
              Vaciar carrito
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
