import { Link } from 'react-router-dom';

import type { Category } from '../../catalog';
import { ProductImage } from './ProductImage';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link className="category-card" to={`/categoria/${category.slug}`}>
      <ProductImage
        alt={category.name}
        className="category-card__image"
        loading="lazy"
        src={category.imageUrl}
      />
      <span className="category-card__name">{category.name}</span>
    </Link>
  );
}
