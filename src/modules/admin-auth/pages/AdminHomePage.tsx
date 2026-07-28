import { Link } from 'react-router-dom';

import { Icon } from '../../../components/ui/Icon';
import { PageHeader } from '../../../components/ui/PageHeader';

/**
 * Página inicial del panel. El resumen operativo (pedidos pendientes, stock
 * bajo) llega con las fases de pedidos e inventario del roadmap.
 */
export function AdminHomePage() {
  return (
    <div className="admin-page">
      <PageHeader
        description="Administrá la configuración, las categorías y los productos de la tienda."
        eyebrow="Panel administrativo"
        title="Inicio"
      />
      <div className="admin-shortcuts" aria-label="Accesos principales">
        <Link className="admin-shortcut" to="/admin/productos">
          <span className="admin-shortcut__icon">
            <Icon name="box" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Productos</strong>
            <span>Cargar mercadería, precios, imágenes y stock.</span>
          </span>
        </Link>
        <Link className="admin-shortcut" to="/admin/categorias">
          <span className="admin-shortcut__icon">
            <Icon name="tag" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Categorías</strong>
            <span>Organizar el catálogo en secciones.</span>
          </span>
        </Link>
        <Link className="admin-shortcut" to="/admin/configuracion">
          <span className="admin-shortcut__icon">
            <Icon name="settings" />
          </span>
          <span className="admin-shortcut__copy">
            <strong>Configuración</strong>
            <span>Datos de la tienda, entrega y medios de pago.</span>
          </span>
        </Link>
      </div>
      <p className="admin-page__note">
        Los pedidos, clientes y el resumen operativo se habilitarán en las próximas fases del
        roadmap.
      </p>
    </div>
  );
}
