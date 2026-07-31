import { isValidParaguayPhone } from '../../utils/formatters/paraguay-phone';
import {
  MAX_CARRIER_NAME_LENGTH,
  MAX_CITY_NAME_LENGTH,
  MAX_DELIVERY_ZONES,
  MAX_ZONE_CITIES,
  PAYMENT_METHODS,
  type PaymentMethod,
  type PrivateStoreSettings,
  type PublicStoreSettings,
} from './settings.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const MAX_NAME_LENGTH = 80;
const MAX_TEXT_LENGTH = 500;
const MAX_ZONE_NAME_LENGTH = 60;
const MAX_ZONE_COST = 10_000_000;

export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
}

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

export function validatePublicSettings(settings: PublicStoreSettings): SettingsValidationResult {
  const errors: string[] = [];

  if (settings.storeName.trim() === '') {
    errors.push('El nombre de la tienda es obligatorio.');
  }
  if (settings.storeName.length > MAX_NAME_LENGTH) {
    errors.push(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`);
  }
  if (settings.storeDescription.length > MAX_TEXT_LENGTH) {
    errors.push(`La descripción no puede superar ${MAX_TEXT_LENGTH} caracteres.`);
  }
  if (settings.orderConfirmationMessage.length > MAX_TEXT_LENGTH) {
    errors.push(`El mensaje de confirmación no puede superar ${MAX_TEXT_LENGTH} caracteres.`);
  }

  if (
    settings.whatsappNumberNormalized !== '' &&
    !isValidParaguayPhone(settings.whatsappNumberNormalized, 'mobile')
  ) {
    errors.push('El número de WhatsApp no es un móvil paraguayo válido.');
  }

  if (settings.supportEmail !== '' && !EMAIL_PATTERN.test(settings.supportEmail)) {
    errors.push('El correo de contacto no es válido.');
  }

  if (settings.acceptedPaymentMethods.length === 0) {
    errors.push('Seleccioná al menos un medio de pago.');
  }
  const unknownMethods = settings.acceptedPaymentMethods.filter(
    (method) => !PAYMENT_METHODS.includes(method as PaymentMethod),
  );
  if (unknownMethods.length > 0) {
    errors.push('Hay medios de pago desconocidos.');
  }
  if (new Set(settings.acceptedPaymentMethods).size !== settings.acceptedPaymentMethods.length) {
    errors.push('Hay medios de pago repetidos.');
  }

  if (!settings.pickupEnabled && !settings.deliveryEnabled) {
    errors.push('Habilitá al menos un método de entrega (retiro o delivery).');
  }

  if (settings.deliveryZones.length > MAX_DELIVERY_ZONES) {
    errors.push(`No se pueden definir más de ${MAX_DELIVERY_ZONES} zonas de entrega.`);
  }
  const zoneIds = new Set<string>();
  for (const zone of settings.deliveryZones) {
    if (zone.name.trim() === '') {
      errors.push('Hay zonas de entrega sin nombre.');
    }
    if (zone.name.length > MAX_ZONE_NAME_LENGTH) {
      errors.push(`El nombre de la zona "${zone.name.slice(0, 20)}…" es demasiado largo.`);
    }
    if (!isInteger(zone.cost) || zone.cost < 0) {
      errors.push(`La zona "${zone.name || zone.id}" tiene un costo inválido.`);
    }
    if (zone.cost > MAX_ZONE_COST) {
      errors.push(`El costo de la zona "${zone.name}" supera el máximo permitido.`);
    }
    if (zone.carrierName !== undefined && zone.carrierName.length > MAX_CARRIER_NAME_LENGTH) {
      errors.push(`La transportadora de la zona "${zone.name}" tiene un nombre demasiado largo.`);
    }
    if (zone.cities !== undefined) {
      if (zone.cities.length > MAX_ZONE_CITIES) {
        errors.push(`La zona "${zone.name}" tiene demasiadas ciudades.`);
      }
      if (zone.cities.some((city) => city.trim() === '' || city.length > MAX_CITY_NAME_LENGTH)) {
        errors.push(`La zona "${zone.name}" tiene ciudades vacías o demasiado largas.`);
      }
    }
    if (zoneIds.has(zone.id)) {
      errors.push('Hay zonas de entrega con identificadores duplicados.');
    }
    zoneIds.add(zone.id);
  }

  if (settings.deliveryEnabled && settings.deliveryZones.every((zone) => !zone.active)) {
    errors.push('El delivery está habilitado pero no hay ninguna zona activa.');
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validatePrivateSettings(settings: PrivateStoreSettings): SettingsValidationResult {
  const errors: string[] = [];

  if (
    !isInteger(settings.defaultLowStockThreshold) ||
    settings.defaultLowStockThreshold < 0 ||
    settings.defaultLowStockThreshold > 100_000
  ) {
    errors.push('El umbral de stock bajo debe ser un entero entre 0 y 100000.');
  }
  for (const email of settings.internalOrderNotificationEmails) {
    if (!EMAIL_PATTERN.test(email)) {
      errors.push(`El correo interno "${email}" no es válido.`);
    }
  }
  if (settings.internalOrderNotificationEmails.length > 10) {
    errors.push('No se pueden definir más de 10 correos internos.');
  }

  return { valid: errors.length === 0, errors };
}
