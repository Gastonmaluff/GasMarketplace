import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '../ui/Icon';

export interface TopbarUser {
  detail: string;
  exitLabel: string;
  exitTo: string;
  initials: string;
  menuDescription: string;
  menuTitle: string;
  name: string;
}

interface TopbarProps {
  context: string;
  onOpenMenu: () => void;
  actions?: ReactNode;
  sectionLabel?: string;
  systemStatus?: string;
  user?: TopbarUser;
}

export function Topbar({
  actions,
  context,
  onOpenMenu,
  sectionLabel,
  systemStatus,
  user,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar__leading">
        <button
          aria-label="Abrir menú"
          className="icon-button topbar__mobile-menu"
          onClick={onOpenMenu}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <div className="topbar__context">
          {sectionLabel ? <span>{sectionLabel}</span> : null}
          <strong>{context}</strong>
        </div>
      </div>
      <div className="topbar__actions">
        {systemStatus ? (
          <span className="system-status">
            <span className="status-dot" /> {systemStatus}
          </span>
        ) : null}
        {actions}
        {user ? (
          <details className="user-menu">
            <summary aria-label="Abrir menú de usuario">
              <span className="user-menu__avatar">{user.initials}</span>
              <span className="user-menu__copy">
                <strong>{user.name}</strong>
                <small>{user.detail}</small>
              </span>
              <Icon name="chevron" size={16} />
            </summary>
            <div className="user-menu__popover">
              <p>
                <strong>{user.menuTitle}</strong>
                <small>{user.menuDescription}</small>
              </p>
              <Link to={user.exitTo}>{user.exitLabel}</Link>
            </div>
          </details>
        ) : null}
      </div>
    </header>
  );
}
