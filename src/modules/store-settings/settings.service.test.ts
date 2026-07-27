import { describe, expect, it } from 'vitest';

import {
  loadStoreSettings,
  normalizePublicSettings,
  saveStoreSettings,
  SettingsError,
} from './settings.service';
import { createDefaultPrivateSettings, createDefaultPublicSettings } from './settings.defaults';

describe('settings.service sin Firebase configurado', () => {
  it('la carga falla con un error entendible', async () => {
    await expect(loadStoreSettings()).rejects.toBeInstanceOf(SettingsError);
  });

  it('el guardado valida antes de tocar Firestore', async () => {
    await expect(
      saveStoreSettings({
        publicSettings: { ...createDefaultPublicSettings(), storeName: '' },
        privateSettings: createDefaultPrivateSettings(),
      }),
    ).rejects.toMatchObject({ name: 'SettingsError' });
  });
});

describe('normalizePublicSettings', () => {
  it('limpia espacios, reasigna orden y descarta descripciones vacías', () => {
    const normalized = normalizePublicSettings({
      ...createDefaultPublicSettings(),
      storeName: '  Gas   Market  ',
      supportEmail: ' Ventas@GasMarket.com ',
      deliveryZones: [
        {
          id: 'b',
          name: '  Zona   Norte ',
          cost: 10000,
          active: true,
          order: 9,
          description: '  ',
        },
        { id: 'a', name: 'Centro', cost: 5000, active: true, order: 3, description: ' Cerca ' },
      ],
    });

    expect(normalized.storeName).toBe('Gas Market');
    expect(normalized.supportEmail).toBe('ventas@gasmarket.com');
    expect(normalized.deliveryZones[0]).toMatchObject({ name: 'Zona Norte', order: 0 });
    expect(normalized.deliveryZones[0]).not.toHaveProperty('description');
    expect(normalized.deliveryZones[1]).toMatchObject({ order: 1, description: 'Cerca' });
  });
});
