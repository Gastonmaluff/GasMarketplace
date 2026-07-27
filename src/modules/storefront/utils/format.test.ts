import { describe, expect, it } from 'vitest';

import { formatPrice, savingsPercent } from './format';

describe('formatPrice', () => {
  it('formatea en PYG con separador es-PY y sin decimales', () => {
    const formatted = formatPrice(1500000);
    expect(formatted).toContain('1.500.000');
    expect(formatted).not.toContain(',');
  });
});

describe('savingsPercent', () => {
  it('calcula el porcentaje de ahorro cuando compareAtPrice es mayor', () => {
    expect(savingsPercent(8000, 10000)).toBe(20);
  });

  it('devuelve null cuando no hay compareAtPrice o no es mayor', () => {
    expect(savingsPercent(10000)).toBeNull();
    expect(savingsPercent(10000, 10000)).toBeNull();
    expect(savingsPercent(10000, 8000)).toBeNull();
  });
});
