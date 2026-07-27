export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'pay_on_pickup'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia bancaria',
  pay_on_pickup: 'Pago al retirar',
};

export interface DeliveryZone {
  id: string;
  name: string;
  /** Entero en PYG, sin decimales. */
  cost: number;
  active: boolean;
  order: number;
  description?: string;
}

export interface PublicStoreSettings {
  storeName: string;
  storeDescription: string;
  whatsappNumberDisplay: string;
  whatsappNumberNormalized: string;
  supportEmail: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  locale: string;
  timezone: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  acceptedPaymentMethods: PaymentMethod[];
  deliveryZones: DeliveryZone[];
  orderConfirmationMessage: string;
  active: boolean;
}

export interface PrivateStoreSettings {
  internalOrderNotificationEmails: string[];
  defaultLowStockThreshold: number;
  allowNegativeStock: boolean;
}

export interface StoreSettings {
  publicSettings: PublicStoreSettings;
  privateSettings: PrivateStoreSettings;
}

export const MAX_DELIVERY_ZONES = 20;
