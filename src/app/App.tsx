import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { LoadingState } from '../components/ui/LoadingState';
import { DemoLayout } from '../demo/layouts/DemoLayout';
import { ComponentsDemoPage } from '../demo/pages/ComponentsDemoPage';
import { DemoPage } from '../demo/pages/DemoPage';

// Storefront público (incluye Firebase para las consultas del catálogo).
const StorefrontLayout = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.StorefrontLayout })),
);
const HomePage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.HomePage })),
);
const CatalogPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.CatalogPage })),
);
const CategoryPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.CategoryPage })),
);
const SearchPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.SearchPage })),
);
const FaqPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.FaqPage })),
);
const ProductDetailPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.ProductDetailPage })),
);
const CartPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.CartPage })),
);
const CheckoutPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.CheckoutPage })),
);
const OrderConfirmationPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.OrderConfirmationPage })),
);
const StoreNotFoundPage = lazy(() =>
  import('../modules/storefront').then((module) => ({ default: module.StoreNotFoundPage })),
);

// Área administrativa.
const AdminGuard = lazy(() =>
  import('../modules/admin-auth').then((module) => ({ default: module.AdminGuard })),
);
const AdminLayout = lazy(() =>
  import('../modules/admin-auth').then((module) => ({ default: module.AdminLayout })),
);
const AdminHomePage = lazy(() =>
  import('../modules/admin-auth').then((module) => ({ default: module.AdminHomePage })),
);
const AdminLoginPage = lazy(() =>
  import('../modules/admin-auth').then((module) => ({ default: module.AdminLoginPage })),
);
const AdminSettingsPage = lazy(() =>
  import('../modules/store-settings').then((module) => ({ default: module.AdminSettingsPage })),
);
const AdminCategoriesPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminCategoriesPage })),
);
const AdminCategoryFormPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminCategoryFormPage })),
);
const AdminSuppliersPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminSuppliersPage })),
);
const AdminSupplierFormPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminSupplierFormPage })),
);
const AdminProductsPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminProductsPage })),
);
const AdminProductFormPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminProductFormPage })),
);
const AdminStockPage = lazy(() =>
  import('../modules/catalog').then((module) => ({ default: module.AdminStockPage })),
);
const AdminOrdersPage = lazy(() =>
  import('../modules/orders').then((module) => ({ default: module.AdminOrdersPage })),
);
const AdminOrderDetailPage = lazy(() =>
  import('../modules/orders').then((module) => ({ default: module.AdminOrderDetailPage })),
);
const AdminCustomersPage = lazy(() =>
  import('../modules/customers').then((module) => ({ default: module.AdminCustomersPage })),
);
const AdminCustomerDetailPage = lazy(() =>
  import('../modules/customers').then((module) => ({ default: module.AdminCustomerDetailPage })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState label="Cargando" />}>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="preguntas-frecuentes" element={<FaqPage />} />
          <Route path="producto/:slug" element={<ProductDetailPage />} />
          <Route path="carrito" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedido/:number/gracias" element={<OrderConfirmationPage />} />
          <Route path="*" element={<StoreNotFoundPage />} />
        </Route>
        <Route element={<DemoLayout />}>
          <Route path="demo" element={<DemoPage />} />
          <Route path="demo/componentes" element={<ComponentsDemoPage />} />
        </Route>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminHomePage />} />
            <Route path="admin/configuracion" element={<AdminSettingsPage />} />
            <Route path="admin/categorias" element={<AdminCategoriesPage />} />
            <Route path="admin/categorias/nueva" element={<AdminCategoryFormPage />} />
            <Route path="admin/categorias/:id" element={<AdminCategoryFormPage />} />
            <Route path="admin/proveedores" element={<AdminSuppliersPage />} />
            <Route path="admin/proveedores/nuevo" element={<AdminSupplierFormPage />} />
            <Route path="admin/proveedores/:id" element={<AdminSupplierFormPage />} />
            <Route path="admin/productos" element={<AdminProductsPage />} />
            <Route path="admin/productos/nuevo" element={<AdminProductFormPage />} />
            <Route path="admin/productos/:id" element={<AdminProductFormPage />} />
            <Route path="admin/stock" element={<AdminStockPage />} />
            <Route path="admin/pedidos" element={<AdminOrdersPage />} />
            <Route path="admin/pedidos/:id" element={<AdminOrderDetailPage />} />
            <Route path="admin/clientes" element={<AdminCustomersPage />} />
            <Route path="admin/clientes/:id" element={<AdminCustomerDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
