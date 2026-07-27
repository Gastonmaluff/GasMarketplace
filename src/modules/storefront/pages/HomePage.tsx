import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { listActiveProducts, type Product } from '../../catalog';
import { PAYMENT_METHOD_LABELS } from '../../store-settings';
import { CategoryCard } from '../components/CategoryCard';
import { ProductGrid } from '../components/ProductGrid';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { buildWhatsappLink } from '../utils/whatsapp';

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
    listActiveProducts({ featuredOnly: true, sort: 'recent', pageSize: 8 })
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

  const whatsappLink = buildWhatsappLink(settings.whatsappNumberNormalized);
  const storeName = settings.storeName || appConfig.name;

  return (
    <div className="store-home">
      <section className="store-hero">
        <p className="eyebrow">Tienda en línea</p>
        <h1>{storeName}</h1>
        {settings.storeDescription ? (
          <p className="store-hero__lead">{settings.storeDescription}</p>
        ) : null}
        <div className="button-group">
          <Link className="button button--primary" to="/catalogo">
            Ver catálogo
          </Link>
          {whatsappLink ? (
            <a
              className="button button--ghost"
              href={whatsappLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              Consultar por WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="store-section">
          <div className="store-section__head">
            <h2 id="home-categories">Categorías</h2>
            <Link to="/catalogo">Ver todo</Link>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard category={category} key={category.id} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="home-featured" className="store-section">
        <div className="store-section__head">
          <h2 id="home-featured">Productos destacados</h2>
          <Link to="/catalogo">Ver catálogo</Link>
        </div>
        {featured === null ? (
          <div className="product-grid product-grid--skeleton" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="product-card product-card--skeleton" key={index} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <ProductGrid products={featured} />
        ) : (
          <p className="store-empty">Todavía no hay productos destacados.</p>
        )}
      </section>

      <section aria-labelledby="home-benefits" className="store-section store-benefits">
        <h2 className="sr-only" id="home-benefits">
          Beneficios
        </h2>
        {settings.pickupEnabled ? (
          <div className="store-benefit">
            <strong>Retiro en local</strong>
            <span>Pasá a buscar tu pedido cuando te quede cómodo.</span>
          </div>
        ) : null}
        {settings.deliveryEnabled ? (
          <div className="store-benefit">
            <strong>Delivery por zonas</strong>
            <span>Coordinamos la entrega según tu zona.</span>
          </div>
        ) : null}
        {settings.acceptedPaymentMethods.length > 0 ? (
          <div className="store-benefit">
            <strong>Medios de pago</strong>
            <span>
              {settings.acceptedPaymentMethods
                .map((method) => PAYMENT_METHOD_LABELS[method])
                .join(' · ')}
            </span>
          </div>
        ) : null}
      </section>

      {whatsappLink ? (
        <section className="store-cta">
          <h2>¿Tenés una consulta?</h2>
          <p>{settings.orderConfirmationMessage || 'Escribinos y te ayudamos con tu compra.'}</p>
          <a
            className="button button--primary"
            href={whatsappLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            Escribir por WhatsApp
          </a>
        </section>
      ) : null}
    </div>
  );
}
