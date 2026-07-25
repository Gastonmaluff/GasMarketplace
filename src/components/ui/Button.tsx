import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium';
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  'aria-label': ariaLabel,
  children,
  className = '',
  disabled,
  loading = false,
  loadingLabel = 'Cargando',
  size = 'medium',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      aria-label={loading ? loadingLabel : ariaLabel}
      className={`button button--${variant} button--${size} ${className}`.trim()}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      <span className={`button__content ${loading ? 'button__content--hidden' : ''}`}>
        {children}
      </span>
      {loading ? (
        <span className="button__loader" role="status">
          <span aria-hidden="true" className="button-spinner" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      ) : null}
    </button>
  );
}
