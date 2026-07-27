import { useSearchParams } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { PageHeader } from '../../../components/ui/PageHeader';
import type { ProductSort } from '../../catalog';
import { ProductGrid } from '../components/ProductGrid';
import { SortSelect } from '../components/SortSelect';
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
    <div className="store-catalog">
      <PageHeader title="Catálogo" description="Todos los productos de la tienda." />

      <div className="store-toolbar">
        <div className="text-field">
          <label htmlFor="catalog-category">Categoría</label>
          <select
            className="text-field__input"
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

        <label className="checkbox-field">
          <input
            checked={availableOnly}
            onChange={(event) => updateParam('disponible', event.currentTarget.checked ? '1' : '')}
            type="checkbox"
          />
          <span>Solo disponibles</span>
        </label>
        <label className="checkbox-field">
          <input
            checked={featuredOnly}
            onChange={(event) => updateParam('destacados', event.currentTarget.checked ? '1' : '')}
            type="checkbox"
          />
          <span>Solo destacados</span>
        </label>
      </div>

      {list.status === 'error' ? (
        <>
          <Alert title="No pudimos cargar el catálogo" tone="danger">
            Revisá tu conexión e intentá nuevamente.
          </Alert>
          <Button onClick={list.reload} variant="secondary">
            Reintentar
          </Button>
        </>
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
                Cargar más
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
