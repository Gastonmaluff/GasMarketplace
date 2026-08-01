export { AdminCategoriesPage } from './categories/pages/AdminCategoriesPage';
export { AdminCategoryFormPage } from './categories/pages/AdminCategoryFormPage';
export { CategoryQuickCreateModal } from './categories/components/CategoryQuickCreateModal';
export { AdminSuppliersPage } from './suppliers/pages/AdminSuppliersPage';
export { AdminSupplierFormPage } from './suppliers/pages/AdminSupplierFormPage';
export { AdminProductsPage } from './products/pages/AdminProductsPage';
export { AdminProductFormPage } from './products/pages/AdminProductFormPage';
export { AdminStockPage } from './products/pages/AdminStockPage';
export { listCategories } from './categories/category.service';
export { listSuppliers } from './suppliers/supplier.service';
export { listAllStockMovements, listProducts } from './products/product.service';
export type { Category } from './categories/category.types';
export type { Supplier } from './suppliers/supplier.types';
export type {
  Product,
  ProductImage,
  StockMovement,
  StockMovementType,
} from './products/product.types';

// API pública del storefront (consultas con active == true).
export {
  DEFAULT_PAGE_SIZE,
  getActiveCategoryBySlug,
  getActiveProductById,
  getActiveProductBySlug,
  listActiveCategories,
  listActiveProducts,
  listRelatedProducts,
  searchActiveProducts,
  type ProductPage,
  type ProductQueryOptions,
  type ProductSort,
} from './public/public-catalog.service';
