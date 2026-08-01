import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../../components/ui/DataTable';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { appConfig } from '../../../../config/app.config';
import { listAllStockMovements, listProducts } from '../product.service';
import type { Product, StockMovement, StockMovementType } from '../product.types';

type TypeFilter = 'all' | StockMovementType;

interface MovementRow extends StockMovement {
  productName: string;
}

const TYPE_LABELS: Readonly<Record<StockMovementType, string>> = {
  ajuste: 'Ajuste manual',
  venta: 'Venta',
  anulacion: 'Anulación',
};

function typeTone(type: StockMovementType): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (type) {
    case 'venta':
      return 'info';
    case 'anulacion':
      return 'warning';
    default:
      return 'neutral';
  }
}

function formatDate(millis?: number): string {
  if (!millis) return '—';
  return new Intl.DateTimeFormat(appConfig.locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: appConfig.timezone,
  }).format(new Date(millis));
}

export function AdminStockPage() {
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    let cancelled = false;
    Promise.all([listAllStockMovements(), listProducts()])
      .then(([loadedMovements, loadedProducts]) => {
        if (cancelled) return;
        setMovements(loadedMovements);
        setProducts(loadedProducts);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudo cargar el historial de stock.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setMovements(null);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );

  const rows: MovementRow[] = useMemo(
    () =>
      (movements ?? []).map((movement) => ({
        ...movement,
        productName: productNames.get(movement.productId) ?? movement.productId,
      })),
    [movements, productNames],
  );

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (normalizedSearch === '') return true;
      return row.productName.toLowerCase().includes(normalizedSearch);
    });
  }, [rows, search, typeFilter]);

  const stats = useMemo(() => {
    const all = movements ?? [];
    return {
      total: all.length,
      ventas: all.filter((movement) => movement.type === 'venta').length,
      ajustes: all.filter((movement) => movement.type === 'ajuste').length,
      anulaciones: all.filter((movement) => movement.type === 'anulacion').length,
    };
  }, [movements]);

  const columns: readonly DataTableColumn<MovementRow>[] = [
    {
      key: 'date',
      header: 'Fecha',
      render: (row) => formatDate(row.createdAtMillis),
      sortValue: (row) => row.createdAtMillis ?? 0,
    },
    {
      key: 'product',
      header: 'Producto',
      render: (row) => <Link to={`/admin/productos/${row.productId}`}>{row.productName}</Link>,
      sortValue: (row) => row.productName,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => <Badge tone={typeTone(row.type)}>{TYPE_LABELS[row.type]}</Badge>,
      sortValue: (row) => row.type,
    },
    {
      key: 'change',
      header: 'Cambio',
      align: 'right',
      render: (row) => (row.quantity > 0 ? `+${row.quantity}` : row.quantity),
      sortValue: (row) => row.quantity,
    },
    {
      key: 'before',
      header: 'Antes',
      align: 'right',
      render: (row) => row.previousStock,
    },
    {
      key: 'after',
      header: 'Después',
      align: 'right',
      render: (row) => row.resultingStock,
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row) =>
        row.orderId ? <Link to={`/admin/pedidos/${row.orderId}`}>{row.reason}</Link> : row.reason,
    },
  ];

  return (
    <div className="admin-page admin-page--wide">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Stock' }]}
        description="Historial de movimientos de stock de todo el catálogo: ajustes, ventas y anulaciones."
        title="Stock"
      />

      {loadError ? (
        <Alert title="Error de carga" tone="danger">
          {loadError}
        </Alert>
      ) : null}

      <div className="admin-products-layout">
        <div className="admin-products-main">
          <section className="admin-filter-panel" aria-label="Filtros de stock">
            <div className="admin-filter-panel__search">
              <TextField
                label="Buscar"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Nombre del producto..."
                type="search"
                value={search}
              />
            </div>
            <div className="admin-filter-panel__fields">
              <div className="text-field">
                <label htmlFor="stock-type-filter">Tipo</label>
                <select
                  className="text-field__input"
                  id="stock-type-filter"
                  onChange={(event) => setTypeFilter(event.currentTarget.value as TypeFilter)}
                  value={typeFilter}
                >
                  <option value="all">Todos</option>
                  <option value="ajuste">Ajuste manual</option>
                  <option value="venta">Venta</option>
                  <option value="anulacion">Anulación</option>
                </select>
              </div>
            </div>
          </section>

          <section className="admin-metric-grid" aria-label="Resumen de movimientos">
            <article className="admin-metric-card">
              <div>
                <span>Movimientos totales</span>
                <strong>{stats.total}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Ventas</span>
                <strong>{stats.ventas}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Ajustes manuales</span>
                <strong>{stats.ajustes}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Anulaciones</span>
                <strong>{stats.anulaciones}</strong>
              </div>
            </article>
          </section>

          <section className="admin-table-panel" aria-label="Historial de movimientos">
            <DataTable
              columns={columns}
              emptyDescription="Los movimientos de stock (ventas, ajustes, anulaciones) van a aparecer acá."
              emptyTitle="Sin movimientos"
              error={loadError ?? undefined}
              getRowKey={(row) => row.id}
              loading={movements === null && !loadError}
              pageSize={20}
              rows={visibleRows}
            />
          </section>
        </div>
      </div>
      {loadError ? (
        <Button onClick={reload} variant="secondary">
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
