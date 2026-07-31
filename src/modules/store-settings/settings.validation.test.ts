import { describe, expect, it } from 'vitest';

import { createDefaultPrivateSettings, createDefaultPublicSettings } from './settings.defaults';
import { validatePrivateSettings, validatePublicSettings } from './settings.validation';
import type { DeliveryZone, PublicStoreSettings } from './settings.types';

function zone(overrides: Partial<DeliveryZone> = {}): DeliveryZone {
  return { id: 'z1', name: 'Centro', cost: 15000, active: true, order: 0, ...overrides };
}

function publicSettings(overrides: Partial<PublicStoreSettings> = {}): PublicStoreSettings {
  return { ...createDefaultPublicSettings(), ...overrides };
}

describe('validatePublicSettings', () => {
  it('acepta los valores por defecto', () => {
    const result = validatePublicSettings(publicSettings());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('mantiene la configuración regional por defecto', () => {
    const defaults = createDefaultPublicSettings();
    expect(defaults.currency).toBe('PYG');
    expect(defaults.locale).toBe('es-PY');
    expect(defaults.timezone).toBe('America/Asuncion');
    expect(defaults.country).toBe('Paraguay');
  });

  it('rechaza nombre vacío', () => {
    const result = validatePublicSettings(publicSettings({ storeName: '   ' }));
    expect(result.valid).toBe(false);
  });

  it('rechaza WhatsApp inválido cuando está informado', () => {
    const result = validatePublicSettings(publicSettings({ whatsappNumberNormalized: '+595123' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/whatsapp/i);
  });

  it('acepta WhatsApp vacío', () => {
    expect(validatePublicSettings(publicSettings({ whatsappNumberNormalized: '' })).valid).toBe(
      true,
    );
  });

  it('rechaza medios de pago desconocidos', () => {
    const result = validatePublicSettings(
      publicSettings({ acceptedPaymentMethods: ['cash', 'crypto' as never] }),
    );
    expect(result.valid).toBe(false);
  });

  it('exige al menos un método de entrega', () => {
    const result = validatePublicSettings(
      publicSettings({ pickupEnabled: false, deliveryEnabled: false }),
    );
    expect(result.valid).toBe(false);
  });

  it('permite delivery desactivado sin zonas', () => {
    const result = validatePublicSettings(
      publicSettings({ deliveryEnabled: false, deliveryZones: [] }),
    );
    expect(result.valid).toBe(true);
  });

  it('rechaza zonas sin nombre', () => {
    const result = validatePublicSettings(
      publicSettings({ deliveryEnabled: true, deliveryZones: [zone({ name: ' ' })] }),
    );
    expect(result.valid).toBe(false);
  });

  it('rechaza costos negativos o no enteros', () => {
    for (const cost of [-100, 10.5]) {
      const result = validatePublicSettings(
        publicSettings({ deliveryEnabled: true, deliveryZones: [zone({ cost })] }),
      );
      expect(result.valid).toBe(false);
    }
  });

  it('rechaza IDs de zona duplicados', () => {
    const result = validatePublicSettings(
      publicSettings({
        deliveryEnabled: true,
        deliveryZones: [zone(), zone({ name: 'Norte', order: 1 })],
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/duplicados/i);
  });

  it('rechaza delivery habilitado sin zonas activas', () => {
    const result = validatePublicSettings(
      publicSettings({ deliveryEnabled: true, deliveryZones: [zone({ active: false })] }),
    );
    expect(result.valid).toBe(false);
  });

  it('acepta el cobro en destino como medio de pago', () => {
    const result = validatePublicSettings(
      publicSettings({ acceptedPaymentMethods: ['cash', 'cash_on_delivery'] }),
    );
    expect(result.valid).toBe(true);
  });

  it('acepta zonas con ciudades y transportadora', () => {
    const result = validatePublicSettings(
      publicSettings({
        deliveryEnabled: true,
        deliveryZones: [
          zone({ cities: ['Ciudad del Este', 'Hernandarias'], carrierName: 'Transportadora X' }),
        ],
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('rechaza ciudades vacías dentro de una zona', () => {
    const result = validatePublicSettings(
      publicSettings({
        deliveryEnabled: true,
        deliveryZones: [zone({ cities: ['Válida', '  '] })],
      }),
    );
    expect(result.valid).toBe(false);
  });
});

describe('validatePrivateSettings', () => {
  it('acepta los valores por defecto', () => {
    expect(validatePrivateSettings(createDefaultPrivateSettings()).valid).toBe(true);
  });

  it('rechaza umbral negativo o decimal', () => {
    for (const threshold of [-1, 2.5]) {
      const result = validatePrivateSettings({
        ...createDefaultPrivateSettings(),
        defaultLowStockThreshold: threshold,
      });
      expect(result.valid).toBe(false);
    }
  });

  it('rechaza correos internos inválidos', () => {
    const result = validatePrivateSettings({
      ...createDefaultPrivateSettings(),
      internalOrderNotificationEmails: ['no-es-correo'],
    });
    expect(result.valid).toBe(false);
  });
});
