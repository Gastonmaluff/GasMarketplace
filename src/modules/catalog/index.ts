export { AdminCategoriesPage } from './categories/pages/AdminCategoriesPage';
export { AdminCategoryFormPage } from './categories/pages/AdminCategoryFormPage';
export { CategoryQuickCreateModal } from './categories/components/CategoryQuickCreateModal';
export { AdminProductsPage } from './products/pages/AdminProductsPage';
export { AdminProductFormPage } from './products/pages/AdminProductFormPage';
export { listCategories } from './categories/category.service';
export { listProducts } from './products/product.service';
export type { Category } from './categories/category.types';
export type { Product, ProductImage } from './products/product.types';

// API pública del storefront (consultas con active == true).
export {
  DEFAULT_PAGE_SIZE,
  getActiveCategoryBySlug,
  getActiveProductBySlug,
  listActiveCategories,
  listActiveProducts,
  listRelatedProducts,
  searchActiveProducts,
  type ProductPage,
  type ProductQueryOptions,
  type ProductSort,
} from './public/public-catalog.service';
