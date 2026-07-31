/**
 * Modelo de dominio de pedidos (ver docs/ECOMMERCE-ARCHITECTURE.md).
 * Este módulo no conoce Firestore: solo tipos y lógica pura reutilizable por la
 * Cloud Function `createOrder`, el checkout público y el panel administrativo.
 */

export type OrderStatus =
  'pendiente' | 'confirmado' | 'en_preparacion' | 'enviado' | 'entregado' | 'cancelado';

export type DeliveryMethod = 'pickup' | 'delivery';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'pay_on_pickup';

/** Snapshot del ítem al momento de la compra: nunca cambia si el producto se edita. */
export interface OrderItem {
  productId: string;
  name: string;
  /** Entero en PYG. */
  unitPrice: number;
  quantity: number;
  /** unitPrice * quantity. */
  subtotal: number;
}

export interface OrderCustomer {
  name: string;
  phoneDisplay: string;
  phoneNormalized: string;
  email?: string;
  address?: string;
}

export interface Order {
  id: string;
  /** Correlativo legible `YYYY-000001`. */
  number: string;
  status: OrderStatus;
  customer: OrderCustomer;
  customerId: string;
  items: OrderItem[];
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  /** Entero en PYG. */
  deliveryCost: number;
  /** Suma de subtotales + deliveryCost. */
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAtMillis?: number;
  updatedAtMillis?: number;
}

export type OrderEventType = 'creado' | 'cambio_estado' | 'nota';

export interface OrderEvent {
  id: string;
  type: OrderEventType;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  note?: string;
  createdAtMillis?: number;
  createdBy: string;
}

/** Totales calculados por el servidor a partir de los ítems y el costo de envío. */
export interface OrderTotals {
  itemCount: number;
  itemsSubtotal: number;
  deliveryCost: number;
  total: number;
}
