import { Outlet } from 'react-router-dom';

import { LoadingState } from '../../../components/ui/LoadingState';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { StorefrontDataContext } from '../hooks/storefront-context';
import { buildWhatsappLink } from '../utils/whatsapp';
import { StorefrontFooter } from './StorefrontFooter';
import { StorefrontHeader } from './StorefrontHeader';
import { TopPromoBar } from './TopPromoBar';
import { WhatsappFab } from './WhatsappFab';

/**
 * Carcasa pública del storefront: barra promocional, header con buscador y
 * navegación de categorías, footer y botón flotante de WhatsApp. Carga
 * settings/public y categorías activas una vez y las comparte por contexto.
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

  const whatsappLink = buildWhatsappLink(data.settings.whatsappNumberNormalized);

  return (
    <StorefrontDataContext.Provider value={data}>
      <div className="store-shell">
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <TopPromoBar />
        <StorefrontHeader categories={data.categories} settings={data.settings} />
        <main className="store-main" id="main-content">
          <Outlet />
        </main>
        <StorefrontFooter settings={data.settings} />
        {whatsappLink ? <WhatsappFab href={whatsappLink} /> : null}
      </div>
    </StorefrontDataContext.Provider>
  );
}
