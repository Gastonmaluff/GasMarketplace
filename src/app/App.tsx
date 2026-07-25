import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { DemoLayout } from '../demo/layouts/DemoLayout';
import { ComponentsDemoPage } from '../demo/pages/ComponentsDemoPage';
import { DemoPage } from '../demo/pages/DemoPage';
import { PublicLayout } from '../layouts/PublicLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<DemoLayout />}>
        <Route path="demo" element={<DemoPage />} />
        <Route path="demo/componentes" element={<ComponentsDemoPage />} />
      </Route>
    </Routes>
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
