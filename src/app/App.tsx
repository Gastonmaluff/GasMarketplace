import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { LoadingState } from '../components/ui/LoadingState';
import { DemoLayout } from '../demo/layouts/DemoLayout';
import { ComponentsDemoPage } from '../demo/pages/ComponentsDemoPage';
import { DemoPage } from '../demo/pages/DemoPage';
import { PublicLayout } from '../layouts/PublicLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// El área administrativa (y con ella el SDK de Firebase) se carga bajo demanda
// para no engordar el bundle público de la tienda.
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

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState label="Cargando" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
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
