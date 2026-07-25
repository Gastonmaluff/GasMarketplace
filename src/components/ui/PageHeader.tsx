import type { ReactNode } from 'react';

interface PageBreadcrumb {
  href?: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: PageBreadcrumb[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  breadcrumbs,
  children,
  description,
  eyebrow,
  primaryAction,
  secondaryActions,
  title,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      {breadcrumbs?.length ? (
        <nav aria-label="Migas de pan" className="breadcrumbs">
          <ol>
            {breadcrumbs.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.href ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="page-header__row">
        <div className="page-header__copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p className="page-header__description">{description}</p> : null}
        </div>
        {primaryAction || secondaryActions ? (
          <div className="page-header__actions">
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>
      {children ? <div className="page-header__extra">{children}</div> : null}
    </header>
  );
}
