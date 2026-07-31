import { describe, expect, it } from 'vitest';

import { isLowStock, validateProductDraft, validateProductImages } from './product.validation';
import type { EditableProductImage, ProductDraft } from './product.types';

function draft(overrides: Partial<ProductDraft> = {}): ProductDraft {
  return {
    name: 'Yerba Mate Selecta 1kg',
    slug: 'yerba-mate-selecta-1kg',
    shortDescription: '',
    description: '',
    sku: '',
    barcode: '',
    categoryIds: [],
    primaryCategoryId: '',
    price: 25000,
    compareAtPrice: null,
    costPrice: null,
    supplierId: '',
    supplierName: '',
    internalNotes: '',
    stock: 10,
    lowStockThreshold: null,
    trackStock: true,
    allowBackorder: false,
    featured: false,
    active: true,
    ...overrides,
  };
}

function image(overrides: Partial<EditableProductImage> = {}): EditableProductImage {
  return {
    id: crypto.randomUUID(),
    alt: '',
    isPrimary: false,
    url: 'https://x/y.jpg',
    ...overrides,
  };
}

const options = { allowNegativeStock: false };

describe('validateProductDraft', () => {
  it('acepta un borrador válido sin imágenes', () => {
    expect(validateProductDraft(draft(), [], options)).toEqual([]);
  });

  it('rechaza nombre vacío y slug inválido', () => {
    expect(validateProductDraft(draft({ name: ' ' }), [], options)).not.toEqual([]);
    expect(validateProductDraft(draft({ slug: 'Con Espacios' }), [], options)).not.toEqual([]);
  });

  it('rechaza precios inválidos', () => {
    for (const price of [null, -1, 10.5]) {
      expect(validateProductDraft(draft({ price }), [], options)).not.toEqual([]);
    }
  });

  it('rechaza compareAtPrice menor o igual al precio', () => {
    expect(
      validateProductDraft(draft({ price: 25000, compareAtPrice: 25000 }), [], options),
    ).not.toEqual([]);
    expect(
      validateProductDraft(draft({ price: 25000, compareAtPrice: 30000 }), [], options),
    ).toEqual([]);
  });

  it('rechaza stock negativo salvo que la configuración lo permita', () => {
    expect(validateProductDraft(draft({ stock: -5 }), [], options)).not.toEqual([]);
    expect(validateProductDraft(draft({ stock: -5 }), [], { allowNegativeStock: true })).toEqual(
      [],
    );
  });

  it('rechaza stock decimal', () => {
    expect(validateProductDraft(draft({ stock: 1.5 }), [], options)).not.toEqual([]);
  });

  it('limita las categorías a 5 y exige principal incluida', () => {
    expect(
      validateProductDraft(draft({ categoryIds: ['a', 'b', 'c', 'd', 'e', 'f'] }), [], options),
    ).not.toEqual([]);
    expect(
      validateProductDraft(draft({ categoryIds: ['a'], primaryCategoryId: 'b' }), [], options),
    ).not.toEqual([]);
  });
});

describe('validateProductImages', () => {
  it('exige exactamente una imagen principal cuando hay imágenes', () => {
    expect(validateProductImages([image(), image()])).not.toEqual([]);
    expect(
      validateProductImages([image({ isPrimary: true }), image({ isPrimary: true })]),
    ).not.toEqual([]);
    expect(validateProductImages([image({ isPrimary: true }), image()])).toEqual([]);
  });

  it('limita el máximo de imágenes a 10', () => {
    const images = Array.from({ length: 11 }, (_, index) => image({ isPrimary: index === 0 }));
    expect(validateProductImages(images)).not.toEqual([]);
  });
});

describe('isLowStock', () => {
  it('usa el umbral propio o el general y respeta trackStock', () => {
    expect(isLowStock({ stock: 2, trackStock: true }, 3)).toBe(true);
    expect(isLowStock({ stock: 2, trackStock: true, lowStockThreshold: 1 }, 3)).toBe(false);
    expect(isLowStock({ stock: 0, trackStock: false }, 3)).toBe(false);
  });
});
