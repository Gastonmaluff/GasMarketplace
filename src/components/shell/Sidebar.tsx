import { NavLink } from 'react-router';

import { appConfig } from '../../config/app.config';
import { Icon, type IconName } from '../ui/Icon';

export interface SidebarNavigationItem {
  icon: IconName;
  label: string;
  to?: string;
  end?: boolean;
  disabled?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  items: readonly SidebarNavigationItem[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: () => void;
  onToggle: () => void;
  environmentLabel?: string;
  sectionLabel?: string;
}

export function Sidebar({
  collapsed,
  environmentLabel,
  items,
  mobileOpen,
  onCloseMobile,
  onNavigate,
  onToggle,
  sectionLabel,
}: SidebarProps) {
  return (
    <>
      <aside
        aria-label="Navegación interna"
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--open' : ''}`}
      >
        <div className="sidebar__brand-row">
          <NavLink
            aria-label={`${appConfig.name}, inicio`}
            className="sidebar-brand"
            onClick={onNavigate}
            to="/"
          >
            <img
              alt=""
              height="36"
              src={collapsed ? appConfig.branding.logoCompact : appConfig.branding.logoFull}
              width="36"
            />
            <span className="sidebar-brand__text">{appConfig.name}</span>
          </NavLink>
          <button
            aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="icon-button sidebar__toggle"
            onClick={onToggle}
            type="button"
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} />
          </button>
          <button
            aria-label="Cerrar menú"
            className="icon-button sidebar__mobile-close"
            onClick={onCloseMobile}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav>
          {sectionLabel ? <p className="sidebar__section-label">{sectionLabel}</p> : null}
          {items.map((item) => {
            if (item.disabled || !item.to) {
              return (
                <span
                  aria-disabled="true"
                  className="sidebar__nav-link sidebar__nav-link--disabled"
                  key={item.label}
                >
                  <Icon name={item.icon} />
                  <span className="sidebar__nav-label">{item.label}</span>
                </span>
              );
            }
            const tooltipId = `sidebar-tooltip-${item.to.replaceAll('/', '-')}`;
            return (
              <NavLink
                aria-describedby={collapsed ? tooltipId : undefined}
                aria-label={item.label}
                className="sidebar__nav-link"
                end={item.end}
                key={item.to}
                onClick={onNavigate}
                to={item.to}
              >
                <Icon name={item.icon} />
                <span className="sidebar__nav-label">{item.label}</span>
                <span className="sidebar__tooltip" id={tooltipId} role="tooltip">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
        {environmentLabel ? (
          <div className="sidebar__footer">
            <span className="status-dot" />
            <span className="sidebar__nav-label">{environmentLabel}</span>
          </div>
        ) : null}
      </aside>
      {mobileOpen ? (
        <button
          aria-label="Cerrar menú lateral"
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          type="button"
        />
      ) : null}
    </>
  );
}
