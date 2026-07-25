import { describe, expect, it } from 'vitest';

import { normalizeText } from './text';

describe('normalizeText', () => {
  it('normaliza nombres simples, compuestos y espacios múltiples', () => {
    expect(normalizeText('  maría   gonzález ', 'person-name')).toBe('María González');
    expect(normalizeText('jUAN carlos benítez', 'person-name')).toBe('Juan Carlos Benítez');
  });

  it('conserva tildes y capitaliza partes con guiones y apóstrofes', () => {
    expect(normalizeText('ana-maría rojas', 'person-name')).toBe('Ana-María Rojas');
    expect(normalizeText("d'ávila", 'person-name')).toBe("D'Ávila");
  });

  it('no modifica campos sin normalización', () => {
    expect(normalizeText('  Correo@Ejemplo.com  ', 'none')).toBe('  Correo@Ejemplo.com  ');
  });
});
