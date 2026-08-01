import { Fragment } from 'react';
import { Link } from 'react-router';

interface Crumb {
  label: string;
  href?: string;
}

interface StoreBreadcrumbsProps {
  items: Crumb[];
}

/** Migas de pan del storefront. El último ítem es la página actual. */
export function StoreBreadcrumbs({ items }: StoreBreadcrumbsProps) {
  return (
    <nav aria-label="Migas de pan" className="store-breadcrumbs">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {item.href ? (
            <Link to={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
          {index < items.length - 1 ? <span aria-hidden="true">/</span> : null}
        </Fragment>
      ))}
    </nav>
  );
}
