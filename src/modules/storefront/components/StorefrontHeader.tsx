import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';

import { appConfig } from '../../../config/app.config';
import { Icon } from '../../../components/ui/Icon';
import { useCart } from '../../cart';
import type { Category } from '../../catalog';
import type { PublicStoreSettings } from '../../store-settings';
import { buildWhatsappLink } from '../utils/whatsapp';
import { Brand48 } from './Brand48';

interface StorefrontHeaderProps {
  settings: PublicStoreSettings;
  categories: Category[];
}

export function StorefrontHeader({ categories, settings }: StorefrontHeaderProps) {
  const navigate = useNavigate();
  const { totals } = useCart();
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen && !categoriesOpen) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      setCategoriesOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen, categoriesOpen]);

  useEffect(() => {
    if (!categoriesOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [categoriesOpen]);

  const storeName = settings.storeName || appConfig.name;
  const whatsappLink = buildWhatsappLink(settings.whatsappNumberNormalized);

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
            onClick={() => {
              setMenuOpen((open) => !open);
              setCategoriesOpen(false);
            }}
            type="button"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>

          <Brand48 storeName={storeName} />

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
            <Link
              aria-label="Panel administrativo"
              className="header-icon-link"
              title="Panel administrativo"
              to="/admin"
            >
              <Icon name="shield" size={20} />
            </Link>
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
                {totals.count > 0 ? (
                  <span
                    aria-label={`${totals.count} productos en el carrito`}
                    className="store-cart__count"
                  >
                    {totals.count > 99 ? '99+' : totals.count}
                  </span>
                ) : null}
              </span>
              <span className="store-cart__label">Carrito</span>
            </Link>
          </div>
        </div>
      </div>

      <nav
        aria-label="Categorías y ayuda"
        className={`store-nav ${menuOpen ? 'store-nav--open' : ''}`}
        ref={navRef}
      >
        <div className="store-nav__inner">
          <button
            aria-controls="store-category-drawer"
            aria-expanded={categoriesOpen}
            className="store-nav__link store-nav__link--all"
            onClick={() => setCategoriesOpen((open) => !open)}
            type="button"
          >
            <Icon name="menu" size={18} />
            Todas las categorías
            <Icon
              className={`store-nav__chevron ${categoriesOpen ? 'store-nav__chevron--open' : ''}`}
              name="chevron-down"
              size={16}
            />
          </button>
          <NavLink
            className="store-nav__link store-nav__link--offers"
            onClick={() => {
              setMenuOpen(false);
              setCategoriesOpen(false);
            }}
            to="/catalogo?destacados=1"
          >
            <Icon name="tag" size={18} />
            Ofertas del día
          </NavLink>
          <NavLink
            className="store-nav__link"
            onClick={() => {
              setMenuOpen(false);
              setCategoriesOpen(false);
            }}
            to="/preguntas-frecuentes"
          >
            <Icon name="help" size={18} />
            Preguntas frecuentes
          </NavLink>
          {whatsappLink ? (
            <a
              className="store-nav__link"
              href={whatsappLink}
              onClick={() => {
                setMenuOpen(false);
                setCategoriesOpen(false);
              }}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name="message" size={18} />
              Contacto
            </a>
          ) : null}
        </div>

        <div
          className={`store-category-drawer ${categoriesOpen ? 'store-category-drawer--open' : ''}`}
          id="store-category-drawer"
        >
          <div className="store-category-drawer__grid">
            {categories.map((category) => (
              <Link
                className="store-category-drawer__card"
                key={category.id}
                onClick={() => setCategoriesOpen(false)}
                to={`/categoria/${category.slug}`}
              >
                <span className="store-category-drawer__card-icon">
                  <Icon name={category.icon ?? 'tag'} size={26} />
                </span>
                {category.name}
              </Link>
            ))}
          </div>
          <div className="store-category-drawer__footer">
            <Link onClick={() => setCategoriesOpen(false)} to="/catalogo">
              Ver todo el catálogo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
