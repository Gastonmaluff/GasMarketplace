import { Link } from 'react-router';

import { Icon, type IconName } from '../../../components/ui/Icon';

const PROMOS: ReadonlyArray<{ icon: IconName; label: string }> = [
  { icon: 'truck', label: 'Envíos a todo el país' },
  { icon: 'wallet', label: 'Pagás al recibir' },
  { icon: 'refresh', label: 'Devoluciones fáciles hasta 7 días' },
];

/** Barra angosta superior con beneficios y un enlace a ofertas. */
export function TopPromoBar() {
  return (
    <div className="promo-bar">
      <div className="promo-bar__inner">
        <ul className="promo-bar__items">
          {PROMOS.map((promo) => (
            <li className="promo-bar__item" key={promo.label}>
              <Icon name={promo.icon} size={16} />
              <span>{promo.label}</span>
            </li>
          ))}
        </ul>
        <Link className="promo-bar__cta" to="/catalogo?destacados=1">
          Ofertas exclusivas por tiempo limitado <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
