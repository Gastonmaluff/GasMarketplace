import type { Product } from '../../catalog';
import { useStorefrontContext } from '../hooks/storefront-context';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: readonly Product[];
}

/** Grilla fluida de tarjetas de producto con nombre de categoría resuelto. */
export function ProductGrid({ products }: ProductGridProps) {
  const { categories } = useStorefrontContext();
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="product-grid">
      {products.map((product) => {
        const categoryId = product.primaryCategoryId ?? product.categoryIds[0];
        const categoryName = categoryId ? categoryNames.get(categoryId) : undefined;
        return <ProductCard categoryName={categoryName} key={product.id} product={product} />;
      })}
    </div>
  );
}
