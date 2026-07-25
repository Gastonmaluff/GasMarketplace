import { describe, expect, it } from 'vitest';

import {
  cleanPhoneDigits,
  formatParaguayPhone,
  isValidParaguayPhone,
  normalizeParaguayPhone,
} from './paraguay-phone';

describe('teléfonos paraguayos', () => {
  it('limpia y normaliza entradas variadas', () => {
    expect(cleanPhoneDigits('+595 (981)-123-456')).toBe('595981123456');
    expect(normalizeParaguayPhone('0981 123-456')).toBe('+595981123456');
    expect(normalizeParaguayPhone('595981123456')).toBe('+595981123456');
  });

  it('formatea números nacionales e internacionales', () => {
    expect(formatParaguayPhone('0981123456')).toBe('0981 123 456');
    expect(formatParaguayPhone('595981123456')).toBe('+595 981 123 456');
    expect(formatParaguayPhone('+595 981-123-456')).toBe('+595 981 123 456');
    expect(formatParaguayPhone('021123456')).toBe('021 123 456');
  });

  it('valida móvil, fijo y modo flexible sin confundirlos', () => {
    expect(isValidParaguayPhone('0981123456', 'mobile')).toBe(true);
    expect(isValidParaguayPhone('021123456', 'landline')).toBe(true);
    expect(isValidParaguayPhone('021123456', 'mobile')).toBe(false);
    expect(isValidParaguayPhone('+595981123456', 'any')).toBe(true);
  });
});
