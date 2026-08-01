export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'pay_on_pickup',
  'cash_on_delivery',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia bancaria',
  pay_on_pickup: 'Pago al retirar',
  cash_on_delivery: 'Pago contra entrega (cobro en destino)',
};

export interface DeliveryZone {
  id: string;
  name: string;
  /** Entero en PYG, sin decimales. */
  cost: number;
  active: boolean;
  order: number;
  description?: string;
  /**
   * Ciudades que cubre esta zona. El checkout las usa para resolver la zona
   * (y el costo) según la ciudad que elige el cliente — ver
   * `src/modules/checkout/checkout.delivery.ts`. Una zona sin `cities`
   * declaradas actúa como cobertura general ("resto del país").
   */
  cities?: string[];
  /** Transportadora que cubre la zona; vacío para delivery propio local. */
  carrierName?: string;
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
export const MAX_ZONE_CITIES = 80;
export const MAX_CITY_NAME_LENGTH = 80;
export const MAX_CARRIER_NAME_LENGTH = 80;
