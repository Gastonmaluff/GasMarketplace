import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';

import { Sidebar } from '../../components/shell/Sidebar';
import { Topbar } from '../../components/shell/Topbar';
import { demoNavigation, demoShellLabels, demoUser } from '../demo.config';

const SIDEBAR_PREFERENCE_KEY = 'gasmarket:sidebar:v1';

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

export function DemoLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readSidebarPreference);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isComponentsPage = location.pathname.startsWith('/demo/componentes');

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

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      saveSidebarPreference(next);
      return next;
    });
  };

  return (
    <div className={`internal-shell ${collapsed ? 'internal-shell--collapsed' : ''}`}>
      <a className="skip-link" href="#internal-content">
        Saltar al contenido
      </a>
      <Sidebar
        collapsed={collapsed}
        environmentLabel={demoShellLabels.environment}
        items={demoNavigation}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
        onToggle={toggleSidebar}
        sectionLabel={demoShellLabels.sidebarSection}
      />
      <div className="internal-main">
        <Topbar
          context={isComponentsPage ? 'Componentes' : 'Resumen'}
          onOpenMenu={() => setMobileOpen(true)}
          sectionLabel={demoShellLabels.section}
          systemStatus={demoShellLabels.systemStatus}
          user={demoUser}
        />
        <main id="internal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
