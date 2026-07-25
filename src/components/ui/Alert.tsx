import type { ReactNode } from 'react';

import { Icon } from './Icon';

interface AlertProps {
  children: ReactNode;
  title: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  onDismiss?: () => void;
}

export function Alert({ children, onDismiss, title, tone = 'info' }: AlertProps) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={tone === 'success' ? 'check' : 'alert'} />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      {onDismiss ? (
        <button
          aria-label="Cerrar mensaje"
          className="icon-button"
          onClick={onDismiss}
          type="button"
        >
          <Icon name="close" />
        </button>
      ) : null}
    </div>
  );
}
