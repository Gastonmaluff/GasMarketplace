import { describe, expect, it } from 'vitest';

import { validateCheckoutForm, type CheckoutFormState } from './checkout.validation';

function form(overrides: Partial<CheckoutFormState> = {}): CheckoutFormState {
  return {
    customerName: 'Ana Gómez',
    customerPhone: '0981 123 456',
    customerEmail: '',
    customerAddress: '',
    deliveryMethod: 'pickup',
    deliveryZoneId: '',
    paymentMethod: 'cash',
    notes: '',
    ...overrides,
  };
}

const options = {
  pickupEnabled: true,
  deliveryEnabled: true,
  acceptedPaymentMethods: ['cash'] as const,
};

describe('validateCheckoutForm', () => {
  it('acepta un formulario válido de retiro en local', () => {
    expect(validateCheckoutForm(form(), options)).toEqual([]);
  });

  it('exige nombre', () => {
    expect(validateCheckoutForm(form({ customerName: '  ' }), options).length).toBeGreaterThan(0);
  });

  it('exige teléfono móvil paraguayo válido', () => {
    expect(validateCheckoutForm(form({ customerPhone: '123' }), options).length).toBeGreaterThan(0);
  });

  it('rechaza correo inválido cuando se informa', () => {
    expect(
      validateCheckoutForm(form({ customerEmail: 'no-es-correo' }), options).length,
    ).toBeGreaterThan(0);
  });

  it('exige zona de entrega cuando el método es delivery', () => {
    expect(
      validateCheckoutForm(form({ deliveryMethod: 'delivery' }), options).length,
    ).toBeGreaterThan(0);
    expect(
      validateCheckoutForm(form({ deliveryMethod: 'delivery', deliveryZoneId: 'z1' }), options),
    ).toEqual([]);
  });

  it('rechaza el método de entrega si la tienda no lo tiene habilitado', () => {
    expect(
      validateCheckoutForm(form(), { ...options, pickupEnabled: false }).length,
    ).toBeGreaterThan(0);
  });

  it('exige un medio de pago aceptado por la tienda', () => {
    expect(validateCheckoutForm(form({ paymentMethod: '' }), options).length).toBeGreaterThan(0);
    expect(
      validateCheckoutForm(form({ paymentMethod: 'bank_transfer' }), options).length,
    ).toBeGreaterThan(0);
  });
});
