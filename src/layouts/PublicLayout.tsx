import { NavLink, Outlet } from 'react-router-dom';

import { appConfig } from '../config/app.config';

export function PublicLayout() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="public-header">
        <NavLink className="brand" to="/" aria-label={`${appConfig.name}, inicio`}>
          <img src={appConfig.branding.logoCompact} alt="" width="34" height="34" />
          <span>{appConfig.name}</span>
        </NavLink>
        <nav aria-label="Navegación principal">
          <NavLink to="/">Inicio</NavLink>
          <NavLink className="button button--small" to="/demo">
            Ver área interna
          </NavLink>
        </nav>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="public-footer">
        <span>{appConfig.name}</span>
        <span>React · TypeScript · Vite</span>
      </footer>
    </div>
  );
}
