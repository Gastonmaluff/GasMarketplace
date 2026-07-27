import { appConfig } from '../../../config/app.config';
import { formatNumericValue, resolveNumericDecimals } from '../../../utils/formatters/number';

/** Precio en PYG con formato es-PY (p. ej. "Gs. 12.000"). */
export function formatPrice(value: number): string {
  return formatNumericValue(value, {
    currency: appConfig.currency,
    decimals: resolveNumericDecimals(appConfig.currency),
    locale: appConfig.locale,
  });
}

/** Porcentaje de ahorro entero cuando compareAtPrice es válido; si no, null. */
export function savingsPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
