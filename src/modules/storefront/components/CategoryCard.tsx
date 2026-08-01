import { Link } from 'react-router';

import type { Category } from '../../catalog';
import { ProductImage } from './ProductImage';

interface CategoryCardProps {
  category: Category;
  highlighted?: boolean;
}

/** Tarjeta de categoría para la fila de la home: thumbnail + nombre + acción. */
export function CategoryCard({ category, highlighted = false }: CategoryCardProps) {
  return (
    <Link
      className={`category-card ${highlighted ? 'category-card--active' : ''}`}
      to={`/categoria/${category.slug}`}
    >
      <span className="category-card__thumb">
        <ProductImage alt={category.name} loading="lazy" src={category.imageUrl} />
      </span>
      <span className="category-card__body">
        <span className="category-card__name">{category.name}</span>
        <span className="category-card__link">
          Ver productos <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  );
}
