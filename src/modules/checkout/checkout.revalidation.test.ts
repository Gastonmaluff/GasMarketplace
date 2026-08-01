import { describe, expect, it } from 'vitest';

import type { CartItem } from '../cart';
import type { Product } from '../catalog';
import { buildRevalidationOutcome } from './checkout.revalidation';

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return { productId: 'p1', slug: 'yerba', name: 'Yerba', price: 25000, quantity: 2, ...overrides };
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Yerba',
    normalizedName: 'yerba',
    slug: 'yerba',
    shortDescription: '',
    description: '',
    categoryIds: [],
    price: 25000,
    stock: 10,
    trackStock: true,
    allowBackorder: false,
    images: [],
    featured: false,
    active: true,
    ...overrides,
  };
}

describe('buildRevalidationOutcome', () => {
  it('no reporta issues cuando todo coincide', () => {
    const outcome = buildRevalidationOutcome([cartItem()], new Map([['p1', product()]]));
    expect(outcome.issues).toEqual([]);
    expect(outcome.removals.size).toBe(0);
  });

  it('quita del carrito un producto inexistente', () => {
    const outcome = buildRevalidationOutcome([cartItem()], new Map([['p1', null]]));
    expect(outcome.removals.has('p1')).toBe(true);
    expect(outcome.issues[0]?.kind).toBe('removed');
  });

  it('quita del carrito un producto inactivo', () => {
    const outcome = buildRevalidationOutcome(
      [cartItem()],
      new Map([['p1', product({ active: false })]]),
    );
    expect(outcome.removals.has('p1')).toBe(true);
  });

  it('quita del carrito un producto sin stock', () => {
    const outcome = buildRevalidationOutcome(
      [cartItem()],
      new Map([['p1', product({ stock: 0 })]]),
    );
    expect(outcome.removals.has('p1')).toBe(true);
  });

  it('detecta un cambio de precio y no toca la cantidad', () => {
    const outcome = buildRevalidationOutcome(
      [cartItem({ price: 25000 })],
      new Map([['p1', product({ price: 30000 })]]),
    );
    expect(outcome.priceUpdates.get('p1')).toMatchObject({ price: 30000 });
    expect(outcome.quantityUpdates.size).toBe(0);
    expect(outcome.issues[0]?.kind).toBe('price-changed');
  });

  it('ajusta la cantidad cuando el stock disponible es menor', () => {
    const outcome = buildRevalidationOutcome(
      [cartItem({ quantity: 5 })],
      new Map([['p1', product({ stock: 3 })]]),
    );
    expect(outcome.quantityUpdates.get('p1')).toBe(3);
    expect(outcome.issues[0]?.kind).toBe('stock-reduced');
  });

  it('no limita la cantidad cuando el producto permite backorder', () => {
    const outcome = buildRevalidationOutcome(
      [cartItem({ quantity: 5 })],
      new Map([['p1', product({ stock: 1, allowBackorder: true })]]),
    );
    expect(outcome.quantityUpdates.size).toBe(0);
    expect(outcome.removals.size).toBe(0);
  });

  it('no limita la cantidad cuando el producto no controla stock', () => {
    const outcome = buildRevalidationOutcome(
      [cartItem({ quantity: 50 })],
      new Map([['p1', product({ trackStock: false, stock: 0 })]]),
    );
    expect(outcome.quantityUpdates.size).toBe(0);
    expect(outcome.removals.size).toBe(0);
  });
});
