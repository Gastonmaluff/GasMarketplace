/**
 * Lógica pura de pedidos, sin dependencias de Firebase. Espejo intencional de
 * `src/modules/orders/order.core.ts` y de partes de
 * `src/utils/formatters/paraguay-phone.ts`: Cloud Functions se empaqueta y
 * despliega solo desde `functions/`, así que no puede importar del árbol
 * `src/` del frontend. Si cambia el original, replicar el cambio acá.
 */

export type OrderStatus =
  'pendiente' | 'confirmado' | 'en_preparacion' | 'enviado' | 'entregado' | 'cancelado';

export type DeliveryMethod = 'pickup' | 'delivery';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'pay_on_pickup' | 'cash_on_delivery';

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'cash',
  'bank_transfer',
  'pay_on_pickup',
  'cash_on_delivery',
];

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderTotals {
  itemCount: number;
  itemsSubtotal: number;
  deliveryCost: number;
  total: number;
}

export function computeItemSubtotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity);
}

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

export function formatOrderNumber(year: number, sequence: number): string {
  return `${year}-${String(sequence).padStart(6, '0')}`;
}

function getLocalDigits(input: string): string {
  const digits = input.replace(/\D/gu, '');
  if (digits.startsWith('595')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function normalizeParaguayPhone(input: string): string {
  const localDigits = getLocalDigits(input).slice(0, 9);
  return localDigits ? `+595${localDigits}` : '';
}

export function isValidParaguayMobile(input: string): boolean {
  return /^9\d{8}$/u.test(getLocalDigits(input));
}
