import { Link } from 'react-router-dom';

interface Brand48Props {
  storeName: string;
  /** 'header' shows the complete lockup; 'compact' keeps the same asset smaller. */
  variant?: 'header' | 'compact';
}

const LOGO_WIDTH = 720;
const LOGO_HEIGHT = 611;

export function Brand48({ storeName, variant = 'header' }: Brand48Props) {
  return (
    <Link aria-label={`${storeName}, inicio`} className={`brand48 brand48--${variant}`} to="/">
      <img
        alt="Mercado 48"
        className="brand48__image"
        decoding="async"
        height={LOGO_HEIGHT}
        src="/brand/mercado48-logo-header.webp"
        width={LOGO_WIDTH}
      />
    </Link>
  );
}
