import { Link } from 'react-router';

import { Icon } from '../../../components/ui/Icon';
import { AddToCartButton } from '../../cart';
import type { Product } from '../../catalog';
import { getAvailability } from '../utils/availability';
import { formatPrice, savingsPercent } from '../utils/format';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

/** Tarjeta de producto retail. No muestra costo, stock exacto ni datos internos. */
export function ProductCard({ product, categoryName }: ProductCardProps) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;
  const availability = getAvailability(product);
  const savings = savingsPercent(product.price, product.compareAtPrice);
  const productPath = `/producto/${product.slug}`;

  return (
    <article className="product-card">
      {savings !== null ? <span className="product-card__discount">-{savings}%</span> : null}
      <button
        aria-label={`Agregar ${product.name} a favoritos`}
        className="product-card__wish"
        type="button"
      >
        <Icon name="heart" size={20} />
      </button>

      <Link className="product-card__link" to={productPath}>
        <span className="product-card__media">
          <ProductImage
            alt={primaryImage?.alt || product.name}
            className="product-card__image"
            loading="lazy"
            src={primaryImage?.url}
          />
        </span>
        <span className="product-card__body">
          {product.featured ? <span className="product-card__flag">Destacado</span> : null}
          {categoryName ? <span className="product-card__category">{categoryName}</span> : null}
          <h3 className="product-card__name">{product.name}</h3>
          <span
            className={`availability availability--${availability.status}`}
            data-testid="availability"
          >
            {availability.label}
          </span>
          <span className="product-card__pricing">
            {product.compareAtPrice ? (
              <span className="product-card__compare">{formatPrice(product.compareAtPrice)}</span>
            ) : null}
            <span className="product-card__price">{formatPrice(product.price)}</span>
          </span>
        </span>
      </Link>

      <AddToCartButton
        className="product-card__buy"
        label="Comprar"
        product={product}
        sublabel="Pagás al recibir"
      />
    </article>
  );
}
