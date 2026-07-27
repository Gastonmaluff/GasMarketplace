import { Link } from 'react-router-dom';

import { Badge } from '../../../components/ui/Badge';
import type { Product } from '../../catalog';
import { getAvailability } from '../utils/availability';
import { formatPrice, savingsPercent } from '../utils/format';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

/** Tarjeta pública de producto. No muestra costo, stock exacto ni datos internos. */
export function ProductCard({ product, categoryName }: ProductCardProps) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;
  const availability = getAvailability(product);
  const savings = savingsPercent(product.price, product.compareAtPrice);

  return (
    <article className="product-card">
      <Link className="product-card__link" to={`/producto/${product.slug}`}>
        <div className="product-card__media">
          <ProductImage
            alt={primaryImage?.alt || product.name}
            className="product-card__image"
            loading="lazy"
            src={primaryImage?.url}
          />
          <div className="product-card__badges">
            {product.featured ? <Badge tone="info">Destacado</Badge> : null}
            {savings !== null ? <Badge tone="danger">-{savings}%</Badge> : null}
          </div>
        </div>
        <div className="product-card__body">
          {categoryName ? <p className="product-card__category">{categoryName}</p> : null}
          <h3 className="product-card__name">{product.name}</h3>
          <div className="product-card__pricing">
            <span className="product-card__price">{formatPrice(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="product-card__compare">{formatPrice(product.compareAtPrice)}</span>
            ) : null}
          </div>
          <span
            className={`availability availability--${availability.status}`}
            data-testid="availability"
          >
            {availability.label}
          </span>
        </div>
      </Link>
    </article>
  );
}
