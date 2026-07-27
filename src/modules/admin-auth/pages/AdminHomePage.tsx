import { Link } from 'react-router-dom';

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
      <div className="admin-shortcuts">
        <Link className="admin-shortcut" to="/admin/productos">
          <strong>Productos</strong>
          <span>Cargar mercadería, precios, imágenes y stock.</span>
        </Link>
        <Link className="admin-shortcut" to="/admin/categorias">
          <strong>Categorías</strong>
          <span>Organizar el catálogo en secciones.</span>
        </Link>
        <Link className="admin-shortcut" to="/admin/configuracion">
          <strong>Configuración</strong>
          <span>Datos de la tienda, entrega y medios de pago.</span>
        </Link>
      </div>
      <p className="admin-page__note">
        Los pedidos, clientes y el resumen operativo se habilitarán en las próximas fases del
        roadmap.
      </p>
    </div>
  );
}
