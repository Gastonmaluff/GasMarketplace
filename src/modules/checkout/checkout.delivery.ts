import { normalizeText } from '../../utils/normalizers/text';
import type { DeliveryZone } from '../store-settings';

/**
 * Ruteo por ciudad estilo marketplace: el cliente elige su ciudad y se
 * resuelve sola la zona (y por lo tanto el costo/transportadora). Una zona
 * sin `cities` declaradas actúa como cobertura general ("resto del país").
 */

function normalizeCity(value: string): string {
  return normalizeText(value, 'lowercase');
}

/** Ciudades declaradas por zonas activas, sin duplicados, en orden de aparición. */
export function listKnownCities(zones: readonly DeliveryZone[]): string[] {
  const seen = new Set<string>();
  const cities: string[] = [];
  for (const zone of zones) {
    if (!zone.active) continue;
    for (const city of zone.cities ?? []) {
      const key = normalizeCity(city);
      if (key === '' || seen.has(key)) continue;
      seen.add(key);
      cities.push(city);
    }
  }
  return cities;
}

/**
 * Resuelve la zona activa que corresponde a una ciudad: primero busca una
 * coincidencia exacta entre las ciudades declaradas; si no hay, cae a una
 * zona activa sin `cities` (cobertura general). Devuelve `undefined` si
 * ninguna zona cubre la ciudad.
 */
export function resolveZoneForCity(
  city: string,
  zones: readonly DeliveryZone[],
): DeliveryZone | undefined {
  const normalizedCity = normalizeCity(city);
  if (normalizedCity === '') return undefined;

  const activeZones = zones.filter((zone) => zone.active);
  const exactMatch = activeZones.find((zone) =>
    (zone.cities ?? []).some((candidate) => normalizeCity(candidate) === normalizedCity),
  );
  if (exactMatch) return exactMatch;

  return activeZones.find((zone) => (zone.cities ?? []).length === 0);
}
