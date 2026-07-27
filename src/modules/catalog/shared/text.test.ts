import { describe, expect, it } from 'vitest';

import { buildSearchTokens, isValidSlug, normalizeCode, slugify } from './text';

describe('slugify', () => {
  it('convierte nombres con tildes y espacios en slugs legibles', () => {
    expect(slugify('Almohadones de Algodón  Premium')).toBe('almohadones-de-algodon-premium');
    expect(slugify('Ñandutí & Encajes')).toBe('nanduti-encajes');
    expect(slugify('  Café --- 500g  ')).toBe('cafe-500g');
  });

  it('genera slugs válidos según su propio validador', () => {
    for (const name of ['Bebidas', 'Lácteos y Fiambres', '¡Ofertas! 2x1']) {
      expect(isValidSlug(slugify(name))).toBe(true);
    }
  });

  it('devuelve vacío para entradas sin caracteres útiles', () => {
    expect(slugify('¡¡¡···!!!')).toBe('');
  });
});

describe('normalizeCode', () => {
  it('normaliza SKU a mayúsculas sin espacios', () => {
    expect(normalizeCode('  ab-123 x ')).toBe('AB-123X');
  });
});

describe('buildSearchTokens', () => {
  it('tokeniza nombre y códigos sin tildes ni duplicados', () => {
    const tokens = buildSearchTokens(['Café Torrado Café', 'SKU-99', undefined]);
    expect(tokens).toContain('cafe');
    expect(tokens).toContain('torrado');
    expect(tokens).toContain('sku');
    expect(tokens).toContain('99');
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it('descarta palabras de una letra y limita la cantidad', () => {
    const longName = Array.from({ length: 60 }, (_, index) => `palabra${index}`).join(' ');
    const tokens = buildSearchTokens([`a ${longName}`]);
    expect(tokens).not.toContain('a');
    expect(tokens.length).toBeLessThanOrEqual(30);
  });
});
