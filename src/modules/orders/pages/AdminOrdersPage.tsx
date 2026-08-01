import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { PageHeader } from '../../../components/ui/PageHeader';
import { TextField } from '../../../components/ui/TextField';
import { appConfig } from '../../../config/app.config';
import { formatNumericValue, resolveNumericDecimals } from '../../../utils/formatters/number';
import { ORDER_STATUSES } from '../order.core';
import { listOrders } from '../order.service';
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '../order.types';

type StatusFilter = 'all' | OrderStatus;

function formatPrice(value: number): string {
  return formatNumericValue(value, {
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

function statusTone(status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'entregado':
      return 'success';
    case 'cancelado':
      return 'danger';
    case 'pendiente':
      return 'warning';
    default:
      return 'info';
  }
}

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    let cancelled = false;
    listOrders()
      .then((loaded) => {
        if (!cancelled) setOrders(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar los pedidos.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setOrders(null);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const visibleOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (orders ?? []).filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (normalizedSearch === '') return true;
      return (
        order.number.toLowerCase().includes(normalizedSearch) ||
        order.customer.name.toLowerCase().includes(normalizedSearch) ||
        order.customer.phoneNormalized.includes(normalizedSearch)
      );
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const allOrders = orders ?? [];
    const pending = allOrders.filter((order) => order.status === 'pendiente').length;
    const inProgress = allOrders.filter((order) =>
      ['confirmado', 'en_preparacion', 'enviado'].includes(order.status),
    ).length;
    const revenue = allOrders
      .filter((order) => order.status !== 'cancelado')
      .reduce((sum, order) => sum + order.total, 0);
    return { total: allOrders.length, pending, inProgress, revenue };
  }, [orders]);

  const columns: readonly DataTableColumn<Order>[] = [
    {
      key: 'number',
      header: 'Pedido',
      render: (order) => (
        <div className="cell-title">
          <div>
            <strong>{order.number}</strong>
            <small>{formatDate(order.createdAtMillis)}</small>
          </div>
        </div>
      ),
      sortValue: (order) => order.createdAtMillis ?? 0,
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (order) => (
        <div className="cell-title">
          <div>
            <strong>{order.customer.name}</strong>
            <small>{order.customer.phoneDisplay}</small>
          </div>
        </div>
      ),
      sortValue: (order) => order.customer.name,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      render: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (order) => formatPrice(order.total),
      sortValue: (order) => order.total,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (order) => (
        <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      ),
      sortValue: (order) => order.status,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (order) => (
        <div className="row-actions">
          <Button
            onClick={() => navigate(`/admin/pedidos/${order.id}`)}
            size="small"
            variant="ghost"
          >
            Ver detalle
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page admin-page--wide">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Pedidos' }]}
        description="Pedidos creados desde el checkout de la tienda."
        title="Pedidos"
      />

      {loadError ? (
        <Alert title="Error de carga" tone="danger">
          {loadError}
        </Alert>
      ) : null}

      <div className="admin-products-layout">
        <div className="admin-products-main">
          <section className="admin-filter-panel" aria-label="Filtros de pedidos">
            <div className="admin-filter-panel__search">
              <TextField
                label="Buscar"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Número de pedido, cliente o teléfono..."
                type="search"
                value={search}
              />
            </div>
            <div className="admin-filter-panel__fields">
              <div className="text-field">
                <label htmlFor="order-status-filter">Estado</label>
                <select
                  className="text-field__input"
                  id="order-status-filter"
                  onChange={(event) => setStatusFilter(event.currentTarget.value as StatusFilter)}
                  value={statusFilter}
                >
                  <option value="all">Todos</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="admin-metric-grid" aria-label="Resumen de pedidos">
            <article className="admin-metric-card">
              <div>
                <span>Total pedidos</span>
                <strong>{stats.total}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Pendientes</span>
                <strong>{stats.pending}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>En curso</span>
                <strong>{stats.inProgress}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Facturado</span>
                <strong>{formatPrice(stats.revenue)}</strong>
              </div>
            </article>
          </section>

          <section className="admin-table-panel" aria-label="Listado de pedidos">
            <DataTable
              columns={columns}
              emptyDescription="Los pedidos hechos desde el checkout van a aparecer acá."
              emptyTitle="Sin pedidos"
              error={loadError ?? undefined}
              getRowKey={(order) => order.id}
              initialSortKey="number"
              loading={orders === null && !loadError}
              pageSize={15}
              rows={visibleOrders}
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
