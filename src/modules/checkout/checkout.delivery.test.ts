import { describe, expect, it } from 'vitest';

import type { DeliveryZone } from '../store-settings';
import { listKnownCities, resolveZoneForCity } from './checkout.delivery';

function zone(overrides: Partial<DeliveryZone> = {}): DeliveryZone {
  return { id: 'z1', name: 'Zona', cost: 25000, active: true, order: 0, ...overrides };
}

const localZone = zone({
  id: 'z-local',
  name: 'Delivery local',
  cost: 25000,
  cities: ['Ciudad del Este', 'Hernandarias', 'Presidente Franco'],
});
const nationalZone = zone({
  id: 'z-nacional',
  name: 'Transportadora',
  cost: 35000,
  order: 1,
  // Sin `cities`: cobertura general.
});

describe('resolveZoneForCity', () => {
  it('resuelve la zona cuya lista de ciudades incluye la ciudad (sin importar mayúsculas/acentos)', () => {
    const zones = [localZone, nationalZone];
    expect(resolveZoneForCity('Ciudad del Este', zones)?.id).toBe('z-local');
    expect(resolveZoneForCity('hernandarias', zones)?.id).toBe('z-local');
    expect(resolveZoneForCity('  Presidente Franco  ', zones)?.id).toBe('z-local');
  });

  it('cae a la zona sin cities declaradas para una ciudad no listada', () => {
    const zones = [localZone, nationalZone];
    expect(resolveZoneForCity('Asunción', zones)?.id).toBe('z-nacional');
  });

  it('devuelve undefined si no hay zona de cobertura general y la ciudad no matchea', () => {
    expect(resolveZoneForCity('Asunción', [localZone])).toBeUndefined();
  });

  it('devuelve undefined para ciudad vacía', () => {
    expect(resolveZoneForCity('   ', [localZone, nationalZone])).toBeUndefined();
  });

  it('ignora zonas inactivas', () => {
    const inactiveNational = { ...nationalZone, active: false };
    expect(resolveZoneForCity('Asunción', [localZone, inactiveNational])).toBeUndefined();
  });
});

describe('listKnownCities', () => {
  it('junta las ciudades de zonas activas, sin duplicados', () => {
    const cities = listKnownCities([
      localZone,
      zone({ id: 'z2', cities: ['Hernandarias', 'Encarnación'], order: 2 }),
    ]);
    expect(cities).toEqual(['Ciudad del Este', 'Hernandarias', 'Presidente Franco', 'Encarnación']);
  });

  it('ignora zonas inactivas', () => {
    expect(listKnownCities([{ ...localZone, active: false }])).toEqual([]);
  });

  it('devuelve vacío si ninguna zona declara ciudades', () => {
    expect(listKnownCities([nationalZone])).toEqual([]);
  });
});
