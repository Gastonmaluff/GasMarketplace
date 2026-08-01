import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../../components/ui/DataTable';
import { Icon } from '../../../../components/ui/Icon';
import { Modal } from '../../../../components/ui/Modal';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { Toast } from '../../../../components/ui/Toast';
import { appConfig } from '../../../../config/app.config';
import { formatNumericValue, resolveNumericDecimals } from '../../../../utils/formatters/number';
import { listCategories } from '../../categories/category.service';
import type { Category } from '../../categories/category.types';
import { CatalogError } from '../../shared/catalog-context';
import { deleteProduct, listProducts, setProductActive } from '../product.service';
import type { Product } from '../product.types';
import { isLowStock } from '../product.validation';

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

  const productStats = useMemo(() => {
    const allProducts = products ?? [];
    const total = allProducts.length;
    const featured = allProducts.filter((product) => product.featured).length;
    const lowStock = allProducts.filter((product) =>
      isLowStock(product, DEFAULT_LOW_STOCK_THRESHOLD),
    ).length;
    const inventoryValue = allProducts.reduce(
      (sum, product) => sum + (product.trackStock ? Math.max(product.stock, 0) * product.price : 0),
      0,
    );
    return { featured, inventoryValue, lowStock, total };
  }, [products]);

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
              <img alt="" className="cell-thumb" height="48" src={primaryImage.url} width="48" />
            ) : (
              <span className="cell-thumb cell-thumb--empty">
                <Icon name="box" size={18} />
              </span>
            )}
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
          <span className="stock-cell">
            <strong>{product.stock}</strong>
            {isLowStock(product, DEFAULT_LOW_STOCK_THRESHOLD) ? (
              <Badge tone={product.stock <= 0 ? 'danger' : 'warning'}>
                {product.stock <= 0 ? 'Sin stock' : 'Stock bajo'}
              </Badge>
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
            className="table-icon-action"
            onClick={() => navigate(`/admin/productos/${product.id}`)}
            size="small"
            variant="ghost"
          >
            <Icon name="edit" size={16} />
            <span>Editar</span>
          </Button>
          <Button
            className="table-compact-action"
            loading={busyId === product.id}
            onClick={() => void toggleActive(product)}
            size="small"
            variant="secondary"
          >
            {product.active ? 'Desactivar' : 'Activar'}
          </Button>
          <Button
            className="table-icon-action"
            onClick={() => setPendingDelete(product)}
            size="small"
            variant="danger"
          >
            <Icon name="trash" size={16} />
            <span>Eliminar</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page admin-page--wide">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Productos' }]}
        description="Gestioná tu catálogo: precios, imágenes, stock y visibilidad."
        primaryAction={
          <Link className="button button--primary admin-primary-action" to="/admin/productos/nuevo">
            <Icon name="plus" size={18} />
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

      <div className="admin-products-layout">
        <div className="admin-products-main">
          <section className="admin-filter-panel" aria-label="Filtros de productos">
            <div className="admin-filter-panel__search">
              <TextField
                label="Buscar"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Buscar por nombre, slug, SKU o código..."
                type="search"
                value={search}
              />
            </div>
            <div className="admin-filter-panel__fields">
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
                  onChange={(event) =>
                    setActivityFilter(event.currentTarget.value as ActivityFilter)
                  }
                  value={activityFilter}
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              <label className="admin-toggle-filter">
                <input
                  checked={lowStockOnly}
                  onChange={(event) => setLowStockOnly(event.currentTarget.checked)}
                  type="checkbox"
                />
                <span>Stock bajo</span>
              </label>
              <label className="admin-toggle-filter">
                <input
                  checked={featuredOnly}
                  onChange={(event) => setFeaturedOnly(event.currentTarget.checked)}
                  type="checkbox"
                />
                <span>Destacados</span>
              </label>
            </div>
          </section>

          <section className="admin-metric-grid" aria-label="Resumen de productos">
            <article className="admin-metric-card">
              <span className="admin-metric-card__icon">
                <Icon name="box" />
              </span>
              <div>
                <span>Total productos</span>
                <strong>{productStats.total}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <span className="admin-metric-card__icon admin-metric-card__icon--accent">
                <Icon name="tag" />
              </span>
              <div>
                <span>Destacados</span>
                <strong>{productStats.featured}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <span className="admin-metric-card__icon">
                <Icon name="alert" />
              </span>
              <div>
                <span>Stock bajo</span>
                <strong>{productStats.lowStock}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <span className="admin-metric-card__icon admin-metric-card__icon--warm">
                <Icon name="dollar" />
              </span>
              <div>
                <span>Valor inventario</span>
                <strong>{formatPrice(productStats.inventoryValue)}</strong>
              </div>
            </article>
          </section>

          <section className="admin-table-panel" aria-label="Listado de productos">
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
          </section>
        </div>
      </div>
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
