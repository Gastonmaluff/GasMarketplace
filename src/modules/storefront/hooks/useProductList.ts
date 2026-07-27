import { useCallback, useEffect, useRef, useState } from 'react';

import {
  listActiveProducts,
  type Product,
  type ProductSort,
  type ProductQueryOptions,
} from '../../catalog';
import { getAvailability } from '../utils/availability';

type Cursor = ProductQueryOptions['cursor'];

export interface ProductListState {
  products: Product[];
  status: 'loading' | 'ready' | 'error';
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

interface UseProductListParams {
  categoryId?: string;
  featuredOnly?: boolean;
  sort: ProductSort;
  /** Filtra por disponibilidad en el cliente sobre las páginas ya traídas. */
  availableOnly?: boolean;
  pageSize?: number;
}

interface QueryResult {
  key: string;
  products: Product[];
  hasMore: boolean;
  error: boolean;
}

/**
 * Lista paginada de productos activos con cursor de Firestore. El estado de
 * carga se deriva comparando la clave de consulta pedida con la de los datos ya
 * cargados, así el efecto solo hace setState en callbacks asíncronos. Los
 * filtros de servidor (categoría, destacados, orden) reinician la consulta; la
 * disponibilidad se filtra en el cliente porque no existe una consulta Firestore
 * razonable que la exprese (depende de trackStock/stock/allowBackorder).
 */
export function useProductList({
  availableOnly = false,
  categoryId,
  featuredOnly = false,
  pageSize,
  sort,
}: UseProductListParams): ProductListState {
  const [reloadCount, setReloadCount] = useState(0);
  const queryKey = JSON.stringify([
    categoryId ?? '',
    featuredOnly,
    sort,
    pageSize ?? 0,
    reloadCount,
  ]);

  const [result, setResult] = useState<QueryResult>({
    key: '',
    products: [],
    hasMore: false,
    error: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<Cursor>(null);

  const baseOptions: ProductQueryOptions = {
    sort,
    ...(categoryId ? { categoryId } : {}),
    ...(featuredOnly ? { featuredOnly } : {}),
    ...(pageSize ? { pageSize } : {}),
  };

  useEffect(() => {
    let cancelled = false;
    cursorRef.current = null;
    listActiveProducts(baseOptions)
      .then((page) => {
        if (cancelled) return;
        cursorRef.current = page.cursor;
        setResult({ key: queryKey, products: page.products, hasMore: page.hasMore, error: false });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key: queryKey, products: [], hasMore: false, error: true });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const loadMore = useCallback(() => {
    if (loadingMore || result.key !== queryKey || !result.hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    listActiveProducts({ ...baseOptions, cursor: cursorRef.current })
      .then((page) => {
        cursorRef.current = page.cursor;
        setResult((current) =>
          current.key === queryKey
            ? {
                ...current,
                products: [...current.products, ...page.products],
                hasMore: page.hasMore,
              }
            : current,
        );
      })
      .catch(() =>
        setResult((current) => (current.key === queryKey ? { ...current, error: true } : current)),
      )
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, result, queryKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const upToDate = result.key === queryKey;
  const status: ProductListState['status'] = !upToDate
    ? 'loading'
    : result.error
      ? 'error'
      : 'ready';
  const baseProducts = upToDate ? result.products : [];
  const products = availableOnly
    ? baseProducts.filter((product) => getAvailability(product).purchasable)
    : baseProducts;

  return {
    products,
    status,
    hasMore: upToDate && result.hasMore,
    loadingMore,
    loadMore,
    reload,
  };
}
