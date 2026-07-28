import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { listActiveProducts, type Product } from '../../catalog';
import { CategoryCard } from '../components/CategoryCard';
import { ProductGrid } from '../components/ProductGrid';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function HomePage() {
  const { categories, settings } = useStorefrontContext();
  const [featured, setFeatured] = useState<Product[] | null>(null);

  useDocumentMeta({
    title: settings.storeName || appConfig.name,
    description: settings.storeDescription || 'Tienda web para compra de mercaderías.',
    canonicalPath: '/',
  });

  useEffect(() => {
    let cancelled = false;
    listActiveProducts({ featuredOnly: true, sort: 'recent', pageSize: 10 })
      .then((page) => {
        if (!cancelled) setFeatured(page.products);
      })
      .catch(() => {
        if (!cancelled) setFeatured([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="store-home">
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">Comprá fácil, rápido y seguro</p>
          <h1 className="hero__title">
            Todo lo que necesitás,
            <br />
            en un solo lugar.
          </h1>
          <p className="hero__lead">
            Miles de productos • Ofertas todos los días • Pagás al recibir
          </p>
          <Link className="button button--primary hero__cta" to="/catalogo?destacados=1">
            Ver ofertas destacadas <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div aria-hidden="true" className="hero__media" />
      </section>

      {categories.length > 0 ? (
        <section aria-label="Categorías" className="home-categories">
          {categories.map((category, index) => (
            <CategoryCard category={category} highlighted={index === 0} key={category.id} />
          ))}
          <Link className="category-card category-card--all" to="/catalogo">
            <span className="category-card__thumb category-card__thumb--all" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="category-card__body">
              <span className="category-card__name">Ver todas</span>
              <span className="category-card__link">Todas las categorías</span>
            </span>
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="home-featured" className="store-section">
        <div className="store-section__head">
          <h2 className="store-section__title" id="home-featured">
            Productos destacados
          </h2>
          <Link className="store-section__more" to="/catalogo">
            Ver todos los productos <span aria-hidden="true">→</span>
          </Link>
        </div>
        {featured === null ? (
          <div aria-hidden="true" className="product-grid">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="product-card product-card--skeleton" key={index} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <ProductGrid products={featured} />
        ) : (
          <p className="store-empty">Todavía no hay productos destacados.</p>
        )}
      </section>
    </div>
  );
}
