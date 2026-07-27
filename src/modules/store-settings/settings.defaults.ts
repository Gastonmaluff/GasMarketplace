import { appConfig } from '../../config/app.config';
import type { PrivateStoreSettings, PublicStoreSettings } from './settings.types';

/** Valores iniciales seguros cuando los documentos de settings todavía no existen. */
export function createDefaultPublicSettings(): PublicStoreSettings {
  return {
    storeName: appConfig.name,
    storeDescription: appConfig.description,
    whatsappNumberDisplay: '',
    whatsappNumberNormalized: '',
    supportEmail: '',
    address: '',
    city: '',
    country: 'Paraguay',
    currency: appConfig.currency,
    locale: appConfig.locale,
    timezone: appConfig.timezone,
    pickupEnabled: true,
    deliveryEnabled: false,
    acceptedPaymentMethods: ['cash'],
    deliveryZones: [],
    orderConfirmationMessage:
      'Recibimos tu pedido. Te vamos a contactar por WhatsApp para coordinar la entrega.',
    active: true,
  };
}

export function createDefaultPrivateSettings(): PrivateStoreSettings {
  return {
    internalOrderNotificationEmails: [],
    defaultLowStockThreshold: 3,
    allowNegativeStock: false,
  };
}
