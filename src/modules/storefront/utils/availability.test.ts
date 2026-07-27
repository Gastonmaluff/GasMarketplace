import { describe, expect, it } from 'vitest';

import { getAvailability } from './availability';
import type { Product } from '../../catalog';

function product(overrides: Partial<Product>): Product {
  return {
    id: 'p1',
    name: 'Producto',
    normalizedName: 'producto',
    slug: 'producto',
    shortDescription: '',
    description: '',
    categoryIds: [],
    price: 10000,
    stock: 0,
    trackStock: true,
    allowBackorder: false,
    images: [],
    featured: false,
    active: true,
    ...overrides,
  };
}

describe('getAvailability', () => {
  it('sin control de stock: Disponible y comprable', () => {
    const result = getAvailability(product({ trackStock: false }));
    expect(result).toMatchObject({ status: 'available', label: 'Disponible', purchasable: true });
  });

  it('con stock positivo: En stock', () => {
    expect(getAvailability(product({ trackStock: true, stock: 5 }))).toMatchObject({
      status: 'in-stock',
      label: 'En stock',
      purchasable: true,
    });
  });

  it('sin stock pero con backorder: Disponible bajo pedido', () => {
    expect(
      getAvailability(product({ trackStock: true, stock: 0, allowBackorder: true })),
    ).toMatchObject({ status: 'backorder', label: 'Disponible bajo pedido', purchasable: true });
  });

  it('sin stock ni backorder: Agotado y no comprable', () => {
    expect(
      getAvailability(product({ trackStock: true, stock: 0, allowBackorder: false })),
    ).toMatchObject({ status: 'out-of-stock', label: 'Agotado', purchasable: false });
  });
});
