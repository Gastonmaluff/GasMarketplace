import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { getActiveCategoryBySlug, type Category, type ProductSort } from '../../catalog';
import { ProductGrid } from '../components/ProductGrid';
import { ProductImage } from '../components/ProductImage';
import { SortSelect } from '../components/SortSelect';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useProductList } from '../hooks/useProductList';
import { StoreNotFoundPage } from './StoreNotFoundPage';

const VALID_SORTS: ProductSort[] = ['featured', 'recent', 'price-asc', 'price-desc', 'name-asc'];

function parseSort(value: string | null): ProductSort {
  return value && VALID_SORTS.includes(value as ProductSort) ? (value as ProductSort) : 'featured';
}

type CategoryState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; category: Category };

interface CategoryResult {
  slug: string;
  category: Category | null;
  error: boolean;
}

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const currentSlug = slug ?? '';
  const [params, setParams] = useSearchParams();
  const sort = parseSort(params.get('orden'));
  const [result, setResult] = useState<CategoryResult>({
    slug: '',
    category: null,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    getActiveCategoryBySlug(currentSlug)
      .then((category) => {
        if (!cancelled) setResult({ slug: currentSlug, category, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ slug: currentSlug, category: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  const upToDate = result.slug === currentSlug;
  const state: CategoryState = !upToDate
    ? { status: 'loading' }
    : result.error
      ? { status: 'error' }
      : result.category
        ? { status: 'ready', category: result.category }
        : { status: 'not-found' };

  const categoryId = state.status === 'ready' ? state.category.id : undefined;
  const categoryName = state.status === 'ready' ? state.category.name : '';

  useDocumentMeta({
    title: categoryName ? `${categoryName} | ${appConfig.name}` : appConfig.name,
    description:
      state.status === 'ready' && state.category.description
        ? state.category.description
        : `Productos de la categoría ${categoryName}.`,
    ...(slug ? { canonicalPath: `/categoria/${slug}` } : {}),
    noindex: state.status === 'not-found',
  });

  const list = useProductList({ sort, ...(categoryId ? { categoryId } : {}) });

  if (state.status === 'loading') {
    return <LoadingState label="Cargando categoría" />;
  }
  if (state.status === 'not-found') {
    return (
      <StoreNotFoundPage
        message="Esta categoría no existe o ya no está disponible."
        title="Categoría no encontrada"
      />
    );
  }
  if (state.status === 'error') {
    return (
      <div className="store-state">
        <Alert title="No pudimos cargar la categoría" tone="danger">
          Revisá tu conexión e intentá nuevamente.
        </Alert>
      </div>
    );
  }

  const { category } = state;

  return (
    <div className="store-listing">
      <StoreBreadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Catálogo', href: '/catalogo' },
          { label: category.name },
        ]}
      />

      <div className="category-hero">
        {category.imageUrl ? (
          <ProductImage
            alt={category.name}
            className="category-hero__image"
            src={category.imageUrl}
          />
        ) : null}
        <div>
          <h1>{category.name}</h1>
          {category.description ? <p>{category.description}</p> : null}
        </div>
      </div>

      <div className="store-toolbar">
        <SortSelect
          onChange={(value) =>
            setParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.set('orden', value);
                return next;
              },
              { replace: true },
            )
          }
          value={sort}
        />
      </div>

      {list.status === 'error' ? (
        <div className="store-state">
          <Alert title="No pudimos cargar los productos" tone="danger">
            Intentá nuevamente en un momento.
          </Alert>
          <Button onClick={list.reload} variant="secondary">
            Reintentar
          </Button>
        </div>
      ) : list.status === 'loading' ? (
        <LoadingState label="Cargando productos" />
      ) : list.products.length === 0 ? (
        <EmptyState
          description="Todavía no hay productos en esta categoría."
          title="Sin productos"
        />
      ) : (
        <>
          <ProductGrid products={list.products} />
          {list.hasMore ? (
            <div className="store-loadmore">
              <Button loading={list.loadingMore} onClick={list.loadMore} variant="secondary">
                Cargar más productos
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
