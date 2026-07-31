import { describe, expect, it } from 'vitest';

import { validateSupplierDraft } from './supplier.validation';
import type { SupplierDraft } from './supplier.types';

function draft(overrides: Partial<SupplierDraft> = {}): SupplierDraft {
  return {
    name: 'Distribuidora Sur',
    contactName: '',
    phone: '',
    notes: '',
    active: true,
    ...overrides,
  };
}

describe('validateSupplierDraft', () => {
  it('acepta un proveedor válido', () => {
    expect(validateSupplierDraft(draft())).toEqual([]);
  });

  it('exige nombre', () => {
    expect(validateSupplierDraft(draft({ name: '   ' }))).toContain(
      'El nombre del proveedor es obligatorio.',
    );
  });

  it('limita el largo de los campos', () => {
    const errors = validateSupplierDraft(
      draft({ name: 'a'.repeat(121), phone: '9'.repeat(41), notes: 'x'.repeat(501) }),
    );
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
