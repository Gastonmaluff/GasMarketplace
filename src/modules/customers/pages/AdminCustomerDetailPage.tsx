import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/ui/LoadingState';
import { PageHeader } from '../../../components/ui/PageHeader';
import { appConfig } from '../../../config/app.config';
import { formatNumericValue, resolveNumericDecimals } from '../../../utils/formatters/number';
import {
  listOrdersByCustomer,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from '../../orders';
import { getCustomer } from '../customer.service';
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
    dateStyle: 'medium',
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

function whatsappUrl(phoneNormalized: string): string {
  return `https://wa.me/${phoneNormalized.replace(/\D/gu, '')}`;
}

export function AdminCustomerDetailPage() {
  const navigate = useNavigate();
  const { id: customerId } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return undefined;
    let cancelled = false;
    Promise.all([getCustomer(customerId), listOrdersByCustomer(customerId)])
      .then(([loadedCustomer, loadedOrders]) => {
        if (cancelled) return;
        if (!loadedCustomer) {
          setLoadError('El cliente no existe.');
          return;
        }
        setCustomer(loadedCustomer);
        setOrders(loadedOrders);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudo cargar el cliente.');
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (loadError) {
    return (
      <div className="admin-page">
        <Alert title="Error" tone="danger">
          {loadError}
        </Alert>
        <Button onClick={() => navigate('/admin/clientes')} variant="secondary">
          Volver a clientes
        </Button>
      </div>
    );
  }

  if (!customer) {
    return <LoadingState label="Cargando cliente" />;
  }

  return (
    <div className="admin-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', href: '/admin' },
          { label: 'Clientes', href: '/admin/clientes' },
          { label: customer.name || 'Cliente' },
        ]}
        title={customer.name || 'Cliente sin nombre'}
      />

      <section className="admin-section" aria-labelledby="customer-info">
        <h2 id="customer-info">Datos de contacto</h2>
        <div className="form-grid">
          <p>
            <a
              href={whatsappUrl(customer.phoneNormalized)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {customer.phoneDisplay}
            </a>
          </p>
          {customer.email ? <p>{customer.email}</p> : null}
        </div>
      </section>

      <section className="admin-metric-grid" aria-label="Resumen del cliente">
        <article className="admin-metric-card">
          <div>
            <span>Pedidos</span>
            <strong>{customer.ordersCount}</strong>
          </div>
        </article>
        <article className="admin-metric-card">
          <div>
            <span>Total gastado</span>
            <strong>{formatPrice(customer.totalSpent)}</strong>
          </div>
        </article>
        <article className="admin-metric-card">
          <div>
            <span>Último pedido</span>
            <strong>{formatDate(customer.lastOrderAtMillis)}</strong>
          </div>
        </article>
      </section>

      <section className="admin-section" aria-labelledby="customer-orders">
        <h2 id="customer-orders">Pedidos</h2>
        {orders.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Pedido">{order.number}</td>
                    <td data-label="Fecha">{formatDate(order.createdAtMillis)}</td>
                    <td data-label="Estado">
                      <Badge tone={statusTone(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td data-label="Total">{formatPrice(order.total)}</td>
                    <td data-label="">
                      <Link to={`/admin/pedidos/${order.id}`}>Ver detalle</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-page__note">Este cliente todavía no tiene pedidos.</p>
        )}
      </section>
    </div>
  );
}
