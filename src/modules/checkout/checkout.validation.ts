import { isValidParaguayPhone } from '../../utils/formatters/paraguay-phone';
import type { PaymentMethod } from '../orders';

export const MAX_CUSTOMER_NAME_LENGTH = 120;
export const MAX_CUSTOMER_EMAIL_LENGTH = 160;
export const MAX_CUSTOMER_ADDRESS_LENGTH = 300;
export const MAX_ORDER_NOTES_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

export interface CheckoutFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  deliveryMethod: 'pickup' | 'delivery';
  /** Ciudad elegida en la UI; resuelve `deliveryZoneId` (ver checkout.delivery.ts). */
  deliveryCity: string;
  deliveryZoneId: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
}

export interface CheckoutFormOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  acceptedPaymentMethods: readonly PaymentMethod[];
}

/**
 * Validación de UI: mismos límites que la Cloud Function `createOrder`, para
 * avisar antes de enviar. No reemplaza la validación del servidor, que es la
 * fuente de verdad.
 */
export function validateCheckoutForm(
  form: CheckoutFormState,
  { pickupEnabled, deliveryEnabled, acceptedPaymentMethods }: CheckoutFormOptions,
): string[] {
  const errors: string[] = [];

  if (form.customerName.trim() === '') {
    errors.push('Tu nombre es obligatorio.');
  }
  if (form.customerName.length > MAX_CUSTOMER_NAME_LENGTH) {
    errors.push(`El nombre no puede superar ${MAX_CUSTOMER_NAME_LENGTH} caracteres.`);
  }
  if (form.customerPhone.trim() === '' || !isValidParaguayPhone(form.customerPhone, 'mobile')) {
    errors.push('Ingresá un número de WhatsApp paraguayo válido.');
  }
  if (form.customerEmail !== '' && !EMAIL_PATTERN.test(form.customerEmail)) {
    errors.push('El correo no es válido.');
  }
  if (form.customerEmail.length > MAX_CUSTOMER_EMAIL_LENGTH) {
    errors.push(`El correo no puede superar ${MAX_CUSTOMER_EMAIL_LENGTH} caracteres.`);
  }
  if (form.customerAddress.length > MAX_CUSTOMER_ADDRESS_LENGTH) {
    errors.push(`La dirección no puede superar ${MAX_CUSTOMER_ADDRESS_LENGTH} caracteres.`);
  }

  if (form.deliveryMethod === 'pickup' && !pickupEnabled) {
    errors.push('El retiro en local no está disponible.');
  }
  if (form.deliveryMethod === 'delivery') {
    if (!deliveryEnabled) {
      errors.push('El delivery no está disponible.');
    }
    if (form.deliveryCity === '') {
      errors.push('Elegí tu ciudad para calcular el envío.');
    } else if (form.deliveryZoneId === '') {
      errors.push(
        'No hacemos envíos a esa ciudad todavía. Elegí retiro en local o escribinos por WhatsApp.',
      );
    }
  }

  if (form.paymentMethod === '') {
    errors.push('Elegí un medio de pago.');
  } else if (!acceptedPaymentMethods.includes(form.paymentMethod)) {
    errors.push('El medio de pago elegido no está disponible.');
  }

  if (form.notes.length > MAX_ORDER_NOTES_LENGTH) {
    errors.push(`La nota no puede superar ${MAX_ORDER_NOTES_LENGTH} caracteres.`);
  }

  return errors;
}
