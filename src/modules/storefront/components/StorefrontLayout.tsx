import { Outlet } from 'react-router-dom';

import { LoadingState } from '../../../components/ui/LoadingState';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { StorefrontDataContext } from '../hooks/storefront-context';
import { StorefrontFooter } from './StorefrontFooter';
import { StorefrontHeader } from './StorefrontHeader';

/**
 * Carcasa pública del storefront: header con buscador y categorías, y footer
 * con datos de la tienda. Carga settings/public y categorías activas una vez y
 * las comparte con las páginas vía contexto.
 */
export function StorefrontLayout() {
  const data = useStorefrontData();

  if (data.status === 'loading') {
    return (
      <div className="store-shell">
        <main className="store-main" id="main-content">
          <LoadingState label="Cargando tienda" />
        </main>
      </div>
    );
  }

  return (
    <StorefrontDataContext.Provider value={data}>
      <div className="store-shell">
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <StorefrontHeader categories={data.categories} settings={data.settings} />
        <main className="store-main" id="main-content">
          <Outlet />
        </main>
        <StorefrontFooter settings={data.settings} />
      </div>
    </StorefrontDataContext.Provider>
  );
}
