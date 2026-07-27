import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import { LoadingState } from '../../../components/ui/LoadingState';
import { getActiveProductBySlug, listRelatedProducts, type Product } from '../../catalog';
import { ProductGallery } from '../components/ProductGallery';
import { ProductGrid } from '../components/ProductGrid';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getAvailability } from '../utils/availability';
import { formatPrice, savingsPercent } from '../utils/format';
import { buildWhatsappLink, productInquiryMessage } from '../utils/whatsapp';
import { StoreNotFoundPage } from './StoreNotFoundPage';

interface ProductResult {
  slug: string;
  product: Product | null;
  error: boolean;
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const currentSlug = slug ?? '';
  const { categories, settings } = useStorefrontContext();
  const [result, setResult] = useState<ProductResult>({ slug: '', product: null, error: false });
  const [related, setRelated] = useState<{ slug: string; items: Product[] }>({
    slug: '',
    items: [],
  });

  useEffect(() => {
    let cancelled = false;
    getActiveProductBySlug(currentSlug)
      .then((product) => {
        if (cancelled) return;
        setResult({ slug: currentSlug, product, error: false });
        if (product) {
          listRelatedProducts(product)
            .then((items) => {
              if (!cancelled) setRelated({ slug: currentSlug, items });
            })
            .catch(() => undefined);
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ slug: currentSlug, product: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  const upToDate = result.slug === currentSlug;
  const product = upToDate ? result.product : null;
  const relatedItems = related.slug === currentSlug ? related.items : [];

  useDocumentMeta({
    title: product ? `${product.name} | ${appConfig.name}` : appConfig.name,
    description: product?.shortDescription || product?.description || undefined,
    ...(slug ? { canonicalPath: `/producto/${slug}` } : {}),
    noindex: upToDate && !result.error && result.product === null,
  });

  if (!upToDate) {
    return <LoadingState label="Cargando producto" />;
  }
  if (result.error) {
    return (
      <div className="store-state">
        <Alert title="No pudimos cargar el producto" tone="danger">
          Revisá tu conexión e intentá nuevamente.
        </Alert>
      </div>
    );
  }
  if (!product) {
    return (
      <StoreNotFoundPage
        message="Este producto no existe o ya no está disponible."
        title="Producto no encontrado"
      />
    );
  }

  const availability = getAvailability(product);
  const savings = savingsPercent(product.price, product.compareAtPrice);
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const primaryCategoryId = product.primaryCategoryId ?? product.categoryIds[0];
  const primaryCategory = primaryCategoryId
    ? categories.find((category) => category.id === primaryCategoryId)
    : undefined;
  const whatsappLink = buildWhatsappLink(
    settings.whatsappNumberNormalized,
    productInquiryMessage(product.name),
  );

  return (
    <div className="store-product">
      <StoreBreadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Catálogo', href: '/catalogo' },
          ...(primaryCategory
            ? [{ label: primaryCategory.name, href: `/categoria/${primaryCategory.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="product-detail">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="product-detail__info">
          {product.featured ? <Badge tone="info">Destacado</Badge> : null}
          <h1 className="product-detail__title">{product.name}</h1>

          <span
            className={`availability availability--${availability.status}`}
            data-testid="availability"
          >
            {availability.label}
          </span>

          <div className="product-detail__pricing">
            <span className="product-detail__price">{formatPrice(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="product-detail__compare">{formatPrice(product.compareAtPrice)}</span>
            ) : null}
            {savings !== null ? <Badge tone="danger">-{savings}% OFF</Badge> : null}
          </div>

          {product.shortDescription ? <p>{product.shortDescription}</p> : null}

          <div className="product-detail__actions">
            <button
              className="button button--primary"
              disabled
              title="Disponible próximamente"
              type="button"
            >
              <Icon name="cart" size={18} /> Comprar · Pagás al recibir
            </button>
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

          {product.description ? (
            <p className="product-detail__description">{product.description}</p>
          ) : null}

          <div className="product-detail__meta">
            {primaryCategory ? (
              <span>
                Categoría:{' '}
                <Link to={`/categoria/${primaryCategory.slug}`}>{primaryCategory.name}</Link>
              </span>
            ) : null}
            {product.categoryIds.length > 1 ? (
              <span>
                También en:{' '}
                {product.categoryIds
                  .filter((id) => id !== primaryCategoryId)
                  .map((id) => categoryName.get(id))
                  .filter(Boolean)
                  .join(', ')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {relatedItems.length > 0 ? (
        <section aria-labelledby="related-title" className="store-section">
          <div className="store-section__head">
            <h2 className="store-section__title" id="related-title">
              Productos relacionados
            </h2>
          </div>
          <ProductGrid products={relatedItems} />
        </section>
      ) : null}
    </div>
  );
}
