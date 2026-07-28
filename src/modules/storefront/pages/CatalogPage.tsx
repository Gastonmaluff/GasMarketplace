import { useSearchParams } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import type { ProductSort } from '../../catalog';
import { ProductGrid } from '../components/ProductGrid';
import { SortSelect } from '../components/SortSelect';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useProductList } from '../hooks/useProductList';

const VALID_SORTS: ProductSort[] = ['featured', 'recent', 'price-asc', 'price-desc', 'name-asc'];

function parseSort(value: string | null): ProductSort {
  return value && VALID_SORTS.includes(value as ProductSort) ? (value as ProductSort) : 'featured';
}

export function CatalogPage() {
  const { categories } = useStorefrontContext();
  const [params, setParams] = useSearchParams();

  const categoryId = params.get('categoria') ?? '';
  const sort = parseSort(params.get('orden'));
  const availableOnly = params.get('disponible') === '1';
  const featuredOnly = params.get('destacados') === '1';

  useDocumentMeta({
    title: `Catálogo | ${appConfig.name}`,
    description: 'Explorá todos los productos disponibles en la tienda.',
    canonicalPath: '/catalogo',
  });

  const list = useProductList({
    sort,
    availableOnly,
    featuredOnly,
    ...(categoryId ? { categoryId } : {}),
  });

  function updateParam(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === '') next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="store-listing">
      <div className="store-listing__head">
        <StoreBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Catálogo' }]} />
        <h1 className="store-listing__title">{featuredOnly ? 'Ofertas destacadas' : 'Catálogo'}</h1>
        <p className="store-listing__subtitle">Todos los productos de la tienda.</p>
      </div>

      <div className="store-toolbar">
        <div className="store-toolbar__field">
          <label htmlFor="catalog-category">Categoría</label>
          <select
            id="catalog-category"
            onChange={(event) => updateParam('categoria', event.currentTarget.value)}
            value={categoryId}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <SortSelect onChange={(value) => updateParam('orden', value)} value={sort} />

        <div className="store-toolbar__checks">
          <label className="checkbox-field">
            <input
              checked={availableOnly}
              onChange={(event) =>
                updateParam('disponible', event.currentTarget.checked ? '1' : '')
              }
              type="checkbox"
            />
            <span>Solo disponibles</span>
          </label>
          <label className="checkbox-field">
            <input
              checked={featuredOnly}
              onChange={(event) =>
                updateParam('destacados', event.currentTarget.checked ? '1' : '')
              }
              type="checkbox"
            />
            <span>Solo ofertas</span>
          </label>
        </div>
      </div>

      {list.status === 'error' ? (
        <div className="store-state">
          <Alert title="No pudimos cargar el catálogo" tone="danger">
            Revisá tu conexión e intentá nuevamente.
          </Alert>
          <Button onClick={list.reload} variant="secondary">
            Reintentar
          </Button>
        </div>
      ) : list.status === 'loading' ? (
        <LoadingState label="Cargando productos" />
      ) : list.products.length === 0 ? (
        <EmptyState
          description="Probá quitar filtros o buscar otra cosa."
          title="No hay productos para mostrar"
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
