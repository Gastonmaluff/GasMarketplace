import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/ui/LoadingState';
import { Modal } from '../../../components/ui/Modal';
import { PageHeader } from '../../../components/ui/PageHeader';
import { TextField } from '../../../components/ui/TextField';
import { Toast } from '../../../components/ui/Toast';
import { appConfig } from '../../../config/app.config';
import { formatNumericValue, resolveNumericDecimals } from '../../../utils/formatters/number';
import { loadPublicStoreSettings, PAYMENT_METHOD_LABELS } from '../../store-settings';
import { nextStatuses } from '../order.core';
import { getOrder, listOrderEvents, OrderError, transitionOrderStatus } from '../order.service';
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderEvent,
  type OrderStatus,
} from '../order.types';

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

export function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [transitioning, setTransitioning] = useState<OrderStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    Promise.all([getOrder(orderId), listOrderEvents(orderId), loadPublicStoreSettings()])
      .then(([loadedOrder, loadedEvents, settings]) => {
        if (cancelled) return;
        if (!loadedOrder) {
          setLoadError('El pedido no existe.');
          return;
        }
        setOrder(loadedOrder);
        setEvents(loadedEvents);
        if (loadedOrder.deliveryZoneId) {
          const zone = settings.deliveryZones.find(
            (item) => item.id === loadedOrder.deliveryZoneId,
          );
          setZoneName(zone?.name ?? loadedOrder.deliveryZoneId);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudo cargar el pedido.');
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  if (loadError) {
    return (
      <div className="admin-page">
        <Alert title="Error" tone="danger">
          {loadError}
        </Alert>
        <Button onClick={() => navigate('/admin/pedidos')} variant="secondary">
          Volver a pedidos
        </Button>
      </div>
    );
  }

  if (!order || !orderId) {
    return <LoadingState label="Cargando pedido" />;
  }

  async function applyTransition(toStatus: OrderStatus, note?: string) {
    if (transitioning) return;
    setActionError(null);
    setTransitioning(toStatus);
    try {
      await transitionOrderStatus(orderId!, toStatus, note);
      setToast(`Pedido actualizado a "${ORDER_STATUS_LABELS[toStatus]}".`);
      setCancelModalOpen(false);
      setCancelReason('');
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setActionError(
        cause instanceof OrderError ? cause.message : 'No se pudo actualizar el pedido.',
      );
    } finally {
      setTransitioning(null);
    }
  }

  const itemsSubtotal = order.total - order.deliveryCost;
  const availableTransitions = nextStatuses(order.status);

  return (
    <div className="admin-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', href: '/admin' },
          { label: 'Pedidos', href: '/admin/pedidos' },
          { label: order.number },
        ]}
        title={`Pedido ${order.number}`}
      />

      {actionError ? (
        <Alert onDismiss={() => setActionError(null)} title="Acción no completada" tone="danger">
          {actionError}
        </Alert>
      ) : null}

      <section className="admin-section" aria-labelledby="order-status">
        <div className="admin-section__heading">
          <h2 id="order-status">Estado</h2>
          <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>
        <p className="admin-page__note">
          Creado el {formatDate(order.createdAtMillis)} · Última actualización{' '}
          {formatDate(order.updatedAtMillis)}
        </p>
        {availableTransitions.length > 0 ? (
          <div className="row-actions">
            {availableTransitions
              .filter((status) => status !== 'cancelado')
              .map((status) => (
                <Button
                  key={status}
                  loading={transitioning === status}
                  onClick={() => void applyTransition(status)}
                  size="small"
                  variant="secondary"
                >
                  Marcar como {ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
            {availableTransitions.includes('cancelado') ? (
              <Button onClick={() => setCancelModalOpen(true)} size="small" variant="danger">
                Cancelar pedido
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="admin-page__note">Este pedido no tiene más transiciones posibles.</p>
        )}
      </section>

      <section className="admin-section" aria-labelledby="order-customer">
        <h2 id="order-customer">Cliente</h2>
        <div className="form-grid">
          <p>
            <strong>{order.customer.name}</strong>
          </p>
          <p>
            <a
              href={whatsappUrl(order.customer.phoneNormalized)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {order.customer.phoneDisplay}
            </a>
          </p>
          {order.customer.email ? <p>{order.customer.email}</p> : null}
          {order.customer.address ? <p>{order.customer.address}</p> : null}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="order-delivery">
        <h2 id="order-delivery">Entrega y pago</h2>
        <div className="form-grid">
          <p>
            <strong>Entrega:</strong> {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
            {zoneName ? ` — ${zoneName}` : ''}
          </p>
          <p>
            <strong>Pago:</strong> {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </p>
          {order.notes ? (
            <p>
              <strong>Notas:</strong> {order.notes}
            </p>
          ) : null}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="order-items">
        <h2 id="order-items">Productos</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td data-label="Producto">{item.name}</td>
                  <td data-label="Cantidad">{item.quantity}</td>
                  <td data-label="Precio unitario">{formatPrice(item.unitPrice)}</td>
                  <td data-label="Subtotal">{formatPrice(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cart-summary__row">
          <span>Subtotal</span>
          <span>{formatPrice(itemsSubtotal)}</span>
        </div>
        <div className="cart-summary__row">
          <span>Envío</span>
          <span>{formatPrice(order.deliveryCost)}</span>
        </div>
        <div className="cart-summary__row">
          <span>Total</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="order-history">
        <h2 id="order-history">Historial</h2>
        {events.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Evento</th>
                  <th>Transición</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td data-label="Fecha">{formatDate(event.createdAtMillis)}</td>
                    <td data-label="Evento">{event.type}</td>
                    <td data-label="Transición">
                      {event.fromStatus && event.toStatus
                        ? `${ORDER_STATUS_LABELS[event.fromStatus]} → ${ORDER_STATUS_LABELS[event.toStatus]}`
                        : event.toStatus
                          ? ORDER_STATUS_LABELS[event.toStatus]
                          : '—'}
                    </td>
                    <td data-label="Nota">{event.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-page__note">Sin eventos registrados todavía.</p>
        )}
      </section>

      <Modal
        description="El pedido pasa a cancelado y se repone el stock de cada producto."
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancelar pedido ${order.number}`}
      >
        <TextField
          helpText="Opcional; queda registrado en el historial."
          label="Motivo"
          onChange={(event) => setCancelReason(event.currentTarget.value)}
          value={cancelReason}
        />
        <div className="modal-actions">
          <Button onClick={() => setCancelModalOpen(false)} variant="ghost">
            Volver
          </Button>
          <Button
            loading={transitioning === 'cancelado'}
            onClick={() => void applyTransition('cancelado', cancelReason)}
            variant="danger"
          >
            Cancelar pedido
          </Button>
        </div>
      </Modal>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
