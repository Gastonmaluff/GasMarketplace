import { Link } from 'react-router-dom';

interface Brand48Props {
  storeName: string;
  /** 'header' muestra nombre + tagline; 'compact' solo la marca. */
  variant?: 'header' | 'compact';
  tagline?: string;
}

/** Marca "48" de Mercado 48: mark tipográfico + wordmark + tagline. */
export function Brand48({ storeName, tagline, variant = 'header' }: Brand48Props) {
  return (
    <Link aria-label={`${storeName}, inicio`} className={`brand48 brand48--${variant}`} to="/">
      <svg
        aria-hidden="true"
        className="brand48__mark"
        fill="none"
        viewBox="0 0 62 54"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.4">
          <path d="M25 6 7 33h24" />
          <path d="M25 6v42" />
          <circle cx="45" cy="16" r="8.6" />
          <circle cx="45" cy="37.5" r="11.6" />
        </g>
      </svg>
      {variant === 'header' ? (
        <span className="brand48__lockup">
          <span className="brand48__name">{storeName}</span>
          {tagline ? <span className="brand48__tagline">{tagline}</span> : null}
        </span>
      ) : null}
    </Link>
  );
}
