import { describe, expect, it } from 'vitest';

import { formatNumericValue, parseNumericValue } from './number';

describe('formatNumericValue', () => {
  it('usa puntos como separadores de miles en es-PY', () => {
    expect(formatNumericValue(1500)).toBe('1.500');
    expect(formatNumericValue(1_500_000)).toBe('1.500.000');
  });

  it('conserva cero, vacío y decimales configurados', () => {
    expect(formatNumericValue(0)).toBe('0');
    expect(formatNumericValue(null)).toBe('');
    expect(formatNumericValue(1234.5, { decimals: 2 })).toBe('1.234,50');
  });

  it('usa cero decimales para PYG por defecto', () => {
    expect(formatNumericValue(1500.75, { currency: 'PYG' })).toMatch(/1\.501/u);
  });
});

describe('parseNumericValue', () => {
  it('devuelve un número limpio desde el formato visual', () => {
    expect(parseNumericValue('1.500.000')).toBe(1_500_000);
    expect(parseNumericValue('1.234,50', { decimals: 2 })).toBe(1234.5);
  });

  it('respeta la configuración de negativos', () => {
    expect(parseNumericValue('-1.500', { allowNegative: true })).toBe(-1500);
    expect(parseNumericValue('-1.500', { allowNegative: false })).toBe(1500);
  });
});
