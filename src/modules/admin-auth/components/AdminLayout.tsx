import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router';

import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Sidebar, type SidebarNavigationItem } from '../../../components/shell/Sidebar';
import { Topbar } from '../../../components/shell/Topbar';
import { useAdminSession } from '../hooks/useAdminSession';
import { getAdminAuthService } from '../services/admin-auth.service';

const SIDEBAR_PREFERENCE_KEY = 'gasmarket:admin-sidebar:v1';

const adminNavigation = [
  { icon: 'dashboard', label: 'Inicio', to: '/admin', end: true },
  { icon: 'box', label: 'Productos', to: '/admin/productos' },
  { icon: 'refresh', label: 'Stock', to: '/admin/stock' },
  { icon: 'tag', label: 'Categorías', to: '/admin/categorias' },
  { icon: 'cart', label: 'Pedidos', to: '/admin/pedidos' },
  { icon: 'user', label: 'Clientes', to: '/admin/clientes' },
  { icon: 'truck', label: 'Proveedores', to: '/admin/proveedores' },
  { icon: 'settings', label: 'Configuración', to: '/admin/configuracion' },
] satisfies readonly SidebarNavigationItem[];

function readSidebarPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

function saveSidebarPreference(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, collapsed ? 'collapsed' : 'expanded');
  } catch {
    // La interfaz sigue funcionando aunque el navegador bloquee el almacenamiento.
  }
}

/** Carcasa del panel administrativo: sidebar de navegación y topbar de sesión. */
export function AdminLayout() {
  const session = useAdminSession();
  const [collapsed, setCollapsed] = useState(readSidebarPreference);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const email = session.status === 'admin' ? session.email : null;

  return (
    <div className={`internal-shell ${collapsed ? 'internal-shell--collapsed' : ''}`}>
      <a className="skip-link" href="#internal-content">
        Saltar al contenido
      </a>
      <Sidebar
        collapsed={collapsed}
        environmentLabel="Panel administrativo"
        items={adminNavigation}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
        onToggle={() =>
          setCollapsed((current) => {
            saveSidebarPreference(!current);
            return !current;
          })
        }
        sectionLabel="Administración"
      />
      <div className="internal-main">
        <Topbar
          actions={
            <>
              <Link
                aria-label="Ver sitio público"
                className="header-icon-link"
                title="Ver sitio público"
                to="/"
              >
                <Icon name="storefront" size={20} />
              </Link>
              <Button
                onClick={() => void getAdminAuthService()?.signOut()}
                size="small"
                variant="ghost"
              >
                Cerrar sesión
              </Button>
            </>
          }
          context="GasMarketplace"
          onOpenMenu={() => setMobileOpen(true)}
          sectionLabel="Administración"
          systemStatus={email ?? undefined}
        />
        <main id="internal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
