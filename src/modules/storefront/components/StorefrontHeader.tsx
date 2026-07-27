import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Icon } from '../../../components/ui/Icon';
import type { Category } from '../../catalog';
import type { PublicStoreSettings } from '../../store-settings';
import { Brand48 } from './Brand48';

interface StorefrontHeaderProps {
  settings: PublicStoreSettings;
  categories: Category[];
}

const BRAND_TAGLINE = 'Lo pedís hoy, lo tenés en 48 horas.';

export function StorefrontHeader({ categories, settings }: StorefrontHeaderProps) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const storeName = settings.storeName || appConfig.name;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    setMenuOpen(false);
    if (trimmed !== '') {
      navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
    } else if (scope !== '') {
      navigate(`/categoria/${scope}`);
    } else {
      navigate('/catalogo');
    }
  }

  return (
    <header className="store-header">
      <div className="store-header__main">
        <div className="store-header__inner">
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="icon-button store-header__menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>

          <Brand48 storeName={storeName} tagline={BRAND_TAGLINE} />

          <form className="store-search" onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor="store-search-input">
              Buscar productos
            </label>
            <input
              autoComplete="off"
              className="store-search__input"
              id="store-search-input"
              name="q"
              onChange={(event) => setTerm(event.currentTarget.value)}
              placeholder="Buscar productos, categorías o marcas…"
              type="search"
              value={term}
            />
            <div className="store-search__scope">
              <label className="sr-only" htmlFor="store-search-scope">
                Categoría
              </label>
              <select
                className="store-search__select"
                id="store-search-scope"
                onChange={(event) => setScope(event.currentTarget.value)}
                value={scope}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={16} />
            </div>
            <button aria-label="Buscar" className="store-search__submit" type="submit">
              <Icon name="search" size={22} />
            </button>
          </form>

          <div className="store-header__actions">
            <Link className="store-account" to="/admin/login">
              <Icon name="user" size={24} />
              <span className="store-account__text">
                <span className="store-account__hi">Hola</span>
                <span className="store-account__label">Mi cuenta</span>
              </span>
              <Icon name="chevron-down" size={16} />
            </Link>
            <Link className="store-cart" to="/carrito">
              <span className="store-cart__icon">
                <Icon name="cart" size={26} />
                <span aria-label="0 productos en el carrito" className="store-cart__count">
                  0
                </span>
              </span>
              <span className="store-cart__label">Carrito</span>
            </Link>
          </div>
        </div>
      </div>

      <nav aria-label="Categorías" className={`store-nav ${menuOpen ? 'store-nav--open' : ''}`}>
        <div className="store-nav__inner">
          <NavLink
            className="store-nav__link store-nav__link--all"
            end
            onClick={() => setMenuOpen(false)}
            to="/catalogo"
          >
            <Icon name="menu" size={18} />
            Todas las categorías
          </NavLink>
          {categories.slice(0, 8).map((category) => (
            <NavLink
              className="store-nav__link"
              key={category.id}
              onClick={() => setMenuOpen(false)}
              to={`/categoria/${category.slug}`}
            >
              {category.name}
            </NavLink>
          ))}
          <NavLink
            className="store-nav__link store-nav__link--offers"
            onClick={() => setMenuOpen(false)}
            to="/catalogo?destacados=1"
          >
            <Icon name="tag" size={18} />
            Ofertas
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
