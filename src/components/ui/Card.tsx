import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Card({ actions, children, className = '', description, title }: CardProps) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {title || description || actions ? (
        <header className="ui-card__header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="ui-card__content">{children}</div>
    </section>
  );
}
