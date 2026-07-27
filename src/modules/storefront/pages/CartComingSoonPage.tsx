import { Link } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

/**
 * Placeholder del carrito. La lógica real llega en la Fase 4; esta ruta existe
 * para que el botón del header tenga destino sin inventar funcionalidad.
 */
export function CartComingSoonPage() {
  useDocumentMeta({ title: `Carrito | ${appConfig.name}`, noindex: true });

  return (
    <div className="store-comingsoon">
      <p className="eyebrow">Próximamente</p>
      <h1>El carrito está en camino</h1>
      <p>
        Estamos preparando la compra en línea. Por ahora podés explorar el catálogo y consultarnos
        por WhatsApp desde cada producto.
      </p>
      <Link className="button button--primary" to="/catalogo">
        Ver catálogo
      </Link>
    </div>
  );
}
