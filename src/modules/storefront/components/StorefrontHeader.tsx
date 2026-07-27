import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Icon } from '../../../components/ui/Icon';
import type { Category } from '../../catalog';
import type { PublicStoreSettings } from '../../store-settings';
import { buildWhatsappLink } from '../utils/whatsapp';

interface StorefrontHeaderProps {
  settings: PublicStoreSettings;
  categories: Category[];
}

export function StorefrontHeader({ categories, settings }: StorefrontHeaderProps) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const whatsappLink = buildWhatsappLink(settings.whatsappNumberNormalized);
  const storeName = settings.storeName || appConfig.name;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    if (trimmed === '') return;
    setMenuOpen(false);
    navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="store-header">
      <div className="store-header__bar">
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="icon-button store-header__menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>

        <Link aria-label={`${storeName}, inicio`} className="store-header__brand" to="/">
          <img alt="" height="34" src={appConfig.branding.logoCompact} width="34" />
          <span>{storeName}</span>
        </Link>

        <form className="store-header__search" onSubmit={submitSearch} role="search">
          <label className="sr-only" htmlFor="store-search">
            Buscar productos
          </label>
          <input
            autoComplete="off"
            id="store-search"
            name="q"
            onChange={(event) => setTerm(event.currentTarget.value)}
            placeholder="Buscar productos"
            type="search"
            value={term}
          />
          <button aria-label="Buscar" className="icon-button" type="submit">
            <Icon name="search" />
          </button>
        </form>

        <div className="store-header__actions">
          <Link className="store-header__cart" to="/carrito">
            <Icon name="box" />
            <span className="store-header__cart-label">Carrito</span>
            <span aria-label="0 productos en el carrito" className="store-header__cart-count">
              0
            </span>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Categorías"
        className={`store-header__nav ${menuOpen ? 'store-header__nav--open' : ''}`}
        ref={menuRef}
      >
        <NavLink className="store-header__nav-link" end onClick={() => setMenuOpen(false)} to="/">
          Inicio
        </NavLink>
        <NavLink
          className="store-header__nav-link"
          onClick={() => setMenuOpen(false)}
          to="/catalogo"
        >
          Catálogo
        </NavLink>
        {categories.slice(0, 8).map((category) => (
          <NavLink
            className="store-header__nav-link"
            key={category.id}
            onClick={() => setMenuOpen(false)}
            to={`/categoria/${category.slug}`}
          >
            {category.name}
          </NavLink>
        ))}
        {whatsappLink ? (
          <a
            className="store-header__nav-link store-header__nav-link--whatsapp"
            href={whatsappLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            WhatsApp
          </a>
        ) : null}
      </nav>
    </header>
  );
}
