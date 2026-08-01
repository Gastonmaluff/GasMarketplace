import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { PageHeader } from '../../../components/ui/PageHeader';
import { TextField } from '../../../components/ui/TextField';
import { appConfig } from '../../../config/app.config';
import { formatNumericValue, resolveNumericDecimals } from '../../../utils/formatters/number';
import { listCustomers } from '../customer.service';
import type { Customer } from '../customer.types';

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

export function AdminCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    listCustomers()
      .then((loaded) => {
        if (!cancelled) setCustomers(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar los clientes.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setCustomers(null);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const visibleCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch === '') return customers ?? [];
    return (customers ?? []).filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.phoneNormalized.includes(normalizedSearch) ||
        (customer.email ?? '').toLowerCase().includes(normalizedSearch),
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const allCustomers = customers ?? [];
    const totalSpent = allCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const totalOrders = allCustomers.reduce((sum, customer) => sum + customer.ordersCount, 0);
    const avgPerCustomer =
      allCustomers.length > 0 ? Math.round(totalSpent / allCustomers.length) : 0;
    return { total: allCustomers.length, totalSpent, totalOrders, avgPerCustomer };
  }, [customers]);

  const columns: readonly DataTableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Cliente',
      render: (customer) => (
        <div className="cell-title">
          <div>
            <strong>{customer.name || 'Sin nombre'}</strong>
            <small>{customer.phoneDisplay}</small>
          </div>
        </div>
      ),
      sortValue: (customer) => customer.name,
    },
    {
      key: 'orders',
      header: 'Pedidos',
      align: 'right',
      render: (customer) => customer.ordersCount,
      sortValue: (customer) => customer.ordersCount,
    },
    {
      key: 'totalSpent',
      header: 'Total gastado',
      align: 'right',
      render: (customer) => formatPrice(customer.totalSpent),
      sortValue: (customer) => customer.totalSpent,
    },
    {
      key: 'lastOrder',
      header: 'Último pedido',
      render: (customer) => formatDate(customer.lastOrderAtMillis),
      sortValue: (customer) => customer.lastOrderAtMillis ?? 0,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (customer) => (
        <div className="row-actions">
          <Button
            onClick={() => navigate(`/admin/clientes/${customer.id}`)}
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
        breadcrumbs={[{ label: 'Inicio', href: '/admin' }, { label: 'Clientes' }]}
        description="Clientes derivados de los pedidos hechos desde el checkout."
        title="Clientes"
      />

      {loadError ? (
        <Alert title="Error de carga" tone="danger">
          {loadError}
        </Alert>
      ) : null}

      <div className="admin-products-layout">
        <div className="admin-products-main">
          <section className="admin-filter-panel" aria-label="Filtros de clientes">
            <div className="admin-filter-panel__search">
              <TextField
                label="Buscar"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Nombre, teléfono o correo..."
                type="search"
                value={search}
              />
            </div>
          </section>

          <section className="admin-metric-grid" aria-label="Resumen de clientes">
            <article className="admin-metric-card">
              <div>
                <span>Total clientes</span>
                <strong>{stats.total}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Pedidos totales</span>
                <strong>{stats.totalOrders}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Gasto total</span>
                <strong>{formatPrice(stats.totalSpent)}</strong>
              </div>
            </article>
            <article className="admin-metric-card">
              <div>
                <span>Promedio por cliente</span>
                <strong>{formatPrice(stats.avgPerCustomer)}</strong>
              </div>
            </article>
          </section>

          <section className="admin-table-panel" aria-label="Listado de clientes">
            <DataTable
              columns={columns}
              emptyDescription="Los clientes aparecen acá apenas se registra su primer pedido."
              emptyTitle="Sin clientes"
              error={loadError ?? undefined}
              getRowKey={(customer) => customer.id}
              loading={customers === null && !loadError}
              pageSize={15}
              rows={visibleCustomers}
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
