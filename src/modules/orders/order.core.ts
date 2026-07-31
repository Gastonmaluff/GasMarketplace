import type { OrderItem, OrderStatus, OrderTotals } from './order.types';

/** Todos los estados posibles, en orden natural del flujo. */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'enviado',
  'entregado',
  'cancelado',
];

/**
 * Transiciones válidas de la máquina de estados (ver arquitectura). `cancelado`
 * es alcanzable desde pendiente/confirmado/en_preparacion; `entregado` y
 * `cancelado` son terminales.
 */
export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

/** Estados a los que se puede pasar desde `status`. */
export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status] ?? [];
}

/** ¿Es válido pasar de `from` a `to`? Un mismo estado no es una transición. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to);
}

/** `cancelado` y `entregado` son terminales. */
export function isTerminalStatus(status: OrderStatus): boolean {
  return nextStatuses(status).length === 0;
}

/** Subtotal de una línea. Redondea por seguridad; los precios son enteros en PYG. */
export function computeItemSubtotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity);
}

/**
 * Totales del pedido a partir de los ítems y el costo de envío. El servidor es
 * la fuente de verdad: nunca confía en montos enviados por el cliente.
 */
export function computeOrderTotals(
  items: readonly Pick<OrderItem, 'unitPrice' | 'quantity'>[],
  deliveryCost = 0,
): OrderTotals {
  const safeDelivery = Math.max(0, Math.round(deliveryCost));
  let itemCount = 0;
  let itemsSubtotal = 0;
  for (const item of items) {
    itemCount += item.quantity;
    itemsSubtotal += computeItemSubtotal(item.unitPrice, item.quantity);
  }
  return {
    itemCount,
    itemsSubtotal,
    deliveryCost: safeDelivery,
    total: itemsSubtotal + safeDelivery,
  };
}

/** Correlativo legible del pedido: `YYYY-000001` (6 dígitos con ceros a la izquierda). */
export function formatOrderNumber(year: number, sequence: number): string {
  return `${year}-${String(sequence).padStart(6, '0')}`;
}
