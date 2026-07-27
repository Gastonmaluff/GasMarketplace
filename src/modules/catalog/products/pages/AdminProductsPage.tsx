import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { appConfig } from '../../../../config/app.config';
import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../../components/ui/DataTable';
import { Modal } from '../../../../components/ui/Modal';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { Toast } from '../../../../components/ui/Toast';
import { formatNumericValue, resolveNumericDecimals } from '../../../../utils/formatters/number';
import { CatalogError } from '../../shared/catalog-context';
import { listCategories } from '../../categories/category.service';
import type { Category } from '../../categories/category.types';
import { deleteProduct, listProducts, setProductActive } from '../product.service';
import { isLowStock } from '../product.validation';
import type { Product } from '../product.types';

const DEFAULT_LOW_STOCK_THRESHOLD = 3;

type ActivityFilter = 'all' | 'active' | 'inactive';

function formatPrice(price: number): string {
  return formatNumericValue(price, {
    currency: appConfig.currency,
    decimals: resolveNumericDecimals(appConfig.currency),
    locale: appConfig.locale,
  });
}

function formatDate(millis?: number): string {
  if (!millis) return '—';
  return new Intl.DateTimeFormat(appConfig.locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: appConfig.timezone,
  }).format(new Date(millis));
}

export function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listProducts(), listCategories()])
      .then(([loadedProducts, loadedCategories]) => {
        if (cancelled) return;
        setProducts(loadedProducts);
        setCategories(loadedCategories);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar los productos.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setProducts(null);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (products ?? []).filter((product) => {
      if (activityFilter === 'active' && !product.active) return false;
      if (activityFilter === 'inactive' && product.active) return false;
      if (categoryFilter && !product.categoryIds.includes(categoryFilter)) return false;
      if (featuredOnly && !product.featured) return false;
      if (lowStockOnly && !isLowStock(product, DEFAULT_LOW_STOCK_THRESHOLD)) return false;
      if (normalizedSearch === '') return true;
      return (
        product.normalizedName.includes(normalizedSearch) ||
        product.slug.includes(normalizedSearch) ||
        (product.sku ?? '').toLowerCase().includes(normalizedSearch) ||
        (product.barcode ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activityFilter, categoryFilter, featuredOnly, lowStockOnly, products, search]);

  async function toggleActive(product: Product) {
    setBusyId(product.id);
    setActionError(null);
    try {
      await setProductActive(product.id, !product.active);
      setToast(product.active ? 'Producto desactivado.' : 'Producto activado.');
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof CatalogError ? cause.message : 'No se pudo actualizar el producto.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    setActionError(null);
    try {
      await deleteProduct(pendingDelete.id);
      setToast('Producto eliminado.');
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof CatalogError ? cause.message : 'No se pudo eliminar el producto.',
      );
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  const columns: readonly DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Producto',
      render: (product) => {
        const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
        return (
          <div className="cell-title">
            {primaryImage ? (
              <img alt="" className="cell-thumb" height="36" src={primaryImage.url} width="36" />
            ) : null}
            <div>
              <strong>{product.name}</strong>
              <small>{product.sku ?? `/${product.slug}`}</small>
            </div>
          </div>
        );
      },
      sortValue: (product) => product.normalizedName,
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (product) =>
        product.primaryCategoryId ? (categoryNames.get(product.primaryCategoryId) ?? '—') : '—',
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (product) => formatPrice(product.price),
      sortValue: (product) => product.price,
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (product) =>
        product.trackStock ? (
          <span>
            {product.stock}{' '}
            {isLowStock(product, DEFAULT_LOW_STOCK_THRESHOLD) ? (
              <Badge tone="warning">Bajo</Badge>
            ) : null}
          </span>
        ) : (
          'Sin control'
        ),
      sortValue: (product) => product.stock,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (product) => (
        <div className="cell-badges">
          <Badge tone={product.active ? 'success' : 'neutral'}>
            {product.active ? 'Activo' : 'Inactivo'}
          </Badge>
          {product.featured ? <Badge tone="info">Destacado</Badge> : null}
        </div>
      ),
      sortValue: (product) => (product.active ? 0 : 1),
    },
    {
      key: 'updated',
      header: 'Actualizado',
      render: (product) => formatDate(product.updatedAtMillis),
      sortValue: (product) => product.updatedAtMillis ?? 0,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (product) => (
        <div className="row-actions">
          <Button
            onClick={() => navigate(`/admin/productos/${product.id}`)}
            size="small"
            variant="ghost"
          >
            Editar
          </Button>
          <Button
            loading={busyId === product.id}
            onClick={() => void toggleActive(product)}
            size="small"
            variant="secondary"
          >
            {product.active ? 'Desactivar' : 'Activar'}
          </Button>
          <Button onClick={() => setPendingDelete(product)} size="small" variant="danger">
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page admin-page--wide">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Productos' }]}
        description="Mercadería de la tienda: precios, imágenes y stock."
        primaryAction={
          <Link className="button button--primary" to="/admin/productos/nuevo">
            Nuevo producto
          </Link>
        }
        title="Productos"
      />

      {actionError ? (
        <Alert onDismiss={() => setActionError(null)} title="Acción no completada" tone="danger">
          {actionError}
        </Alert>
      ) : null}

      <div className="list-toolbar list-toolbar--products">
        <TextField
          label="Buscar"
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Nombre, slug, SKU o código"
          type="search"
          value={search}
        />
        <div className="text-field">
          <label htmlFor="product-category-filter">Categoría</label>
          <select
            className="text-field__input"
            id="product-category-filter"
            onChange={(event) => setCategoryFilter(event.currentTarget.value)}
            value={categoryFilter}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-field">
          <label htmlFor="product-activity-filter">Estado</label>
          <select
            className="text-field__input"
            id="product-activity-filter"
            onChange={(event) => setActivityFilter(event.currentTarget.value as ActivityFilter)}
            value={activityFilter}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <label className="checkbox-field">
          <input
            checked={lowStockOnly}
            onChange={(event) => setLowStockOnly(event.currentTarget.checked)}
            type="checkbox"
          />
          <span>Solo stock bajo</span>
        </label>
        <label className="checkbox-field">
          <input
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.currentTarget.checked)}
            type="checkbox"
          />
          <span>Solo destacados</span>
        </label>
      </div>

      <DataTable
        columns={columns}
        emptyDescription="Cargá el primer producto para empezar a vender."
        emptyTitle="Sin productos"
        error={loadError ?? undefined}
        getRowKey={(product) => product.id}
        loading={products === null && !loadError}
        pageSize={10}
        rows={visibleProducts}
      />
      {loadError ? (
        <Button onClick={reload} variant="secondary">
          Reintentar
        </Button>
      ) : null}

      <Modal
        description="Esta acción no se puede deshacer."
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`Eliminar "${pendingDelete?.name ?? ''}"`}
      >
        <p>
          Preferí desactivar el producto si querés ocultarlo temporalmente. La eliminación borra el
          producto, sus índices y sus imágenes.
        </p>
        <div className="modal-actions">
          <Button onClick={() => setPendingDelete(null)} variant="ghost">
            Cancelar
          </Button>
          <Button
            loading={busyId === pendingDelete?.id}
            onClick={() => void confirmDelete()}
            variant="danger"
          >
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
