import type { DeliveryMethod, PaymentMethod } from '../orders';

export interface CheckoutCustomerInput {
  name: string;
  /** Se envía sin normalizar; el servidor normaliza y valida. */
  phone: string;
  email?: string;
  address?: string;
}

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItemInput[];
  customer: CheckoutCustomerInput;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CheckoutOrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutTotals {
  itemCount: number;
  itemsSubtotal: number;
  deliveryCost: number;
  total: number;
}

/** Respuesta de `createOrder`: todo calculado por el servidor. */
export interface CheckoutResult {
  orderId: string;
  number: string;
  status: string;
  items: CheckoutOrderItem[];
  totals: CheckoutTotals;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  paymentMethod: PaymentMethod;
  customer: {
    name: string;
    phoneDisplay: string;
    phoneNormalized: string;
    email?: string;
    address?: string;
  };
}
