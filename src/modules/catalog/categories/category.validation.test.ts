import { describe, expect, it } from 'vitest';

import { validateCategoryDraft } from './category.validation';
import type { CategoryDraft } from './category.types';

function draft(overrides: Partial<CategoryDraft> = {}): CategoryDraft {
  return {
    name: 'Lácteos y Fiambres',
    slug: 'lacteos-y-fiambres',
    description: '',
    icon: '',
    order: 0,
    active: true,
    ...overrides,
  };
}

describe('validateCategoryDraft', () => {
  it('acepta un borrador válido', () => {
    expect(validateCategoryDraft(draft())).toEqual([]);
  });

  it('rechaza nombre vacío', () => {
    expect(validateCategoryDraft(draft({ name: '  ' }))).not.toEqual([]);
  });

  it('rechaza slugs con mayúsculas, tildes o espacios', () => {
    for (const slug of ['Lacteos', 'lácteos', 'lacteos fiambres', '-lacteos', 'lacteos-']) {
      expect(validateCategoryDraft(draft({ slug }))).not.toEqual([]);
    }
  });

  it('rechaza orden negativo o decimal', () => {
    for (const order of [-1, 1.5]) {
      expect(validateCategoryDraft(draft({ order }))).not.toEqual([]);
    }
  });

  it('acepta un ícono válido y rechaza uno desconocido', () => {
    expect(validateCategoryDraft(draft({ icon: 'drink' }))).toEqual([]);
    // @ts-expect-error valor fuera del set permitido, a propósito para el test
    expect(validateCategoryDraft(draft({ icon: 'unicornio' }))).not.toEqual([]);
  });
});
