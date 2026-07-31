import { describe, expect, it } from 'vitest';

import {
  addItem,
  cartTotals,
  CART_MAX_QUANTITY,
  isValidCartItem,
  removeItem,
  setQuantity,
} from './cart.core';
import type { CartItem } from './cart.types';

function item(overrides: Partial<CartItem> = {}): Omit<CartItem, 'quantity'> {
  return { productId: 'p1', slug: 'yerba', name: 'Yerba', price: 25000, ...overrides };
}

describe('addItem', () => {
  it('agrega un producto nuevo con la cantidad indicada', () => {
    const result = addItem([], item(), 2);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ productId: 'p1', quantity: 2 });
  });

  it('suma la cantidad si el producto ya está', () => {
    const result = addItem(addItem([], item(), 1), item(), 2);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });

  it('respeta el tope de stock (maxQuantity)', () => {
    const result = addItem([], item({ maxQuantity: 3 }), 10);
    expect(result[0]?.quantity).toBe(3);
  });

  it('nunca supera CART_MAX_QUANTITY', () => {
    const result = addItem([], item(), 500);
    expect(result[0]?.quantity).toBe(CART_MAX_QUANTITY);
  });

  it('no mezcla productos distintos', () => {
    const result = addItem(addItem([], item({ productId: 'a' })), item({ productId: 'b' }));
    expect(result).toHaveLength(2);
  });
});

describe('setQuantity', () => {
  it('fija la cantidad exacta', () => {
    const start = addItem([], item({ maxQuantity: 10 }), 1);
    expect(setQuantity(start, 'p1', 5)[0]?.quantity).toBe(5);
  });

  it('cantidad <= 0 elimina la línea', () => {
    const start = addItem([], item(), 3);
    expect(setQuantity(start, 'p1', 0)).toHaveLength(0);
  });

  it('capa al stock disponible', () => {
    const start = addItem([], item({ maxQuantity: 4 }), 1);
    expect(setQuantity(start, 'p1', 99)[0]?.quantity).toBe(4);
  });
});

describe('removeItem', () => {
  it('quita solo el producto indicado', () => {
    const start = addItem(addItem([], item({ productId: 'a' })), item({ productId: 'b' }));
    const result = removeItem(start, 'a');
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe('b');
  });
});

describe('cartTotals', () => {
  it('suma cantidades y subtotal', () => {
    const items = addItem(
      addItem([], item({ productId: 'a', price: 10000 }), 2),
      item({
        productId: 'b',
        price: 5000,
      }),
    );
    expect(cartTotals(items)).toEqual({ count: 3, subtotal: 25000 });
  });

  it('carrito vacío da cero', () => {
    expect(cartTotals([])).toEqual({ count: 0, subtotal: 0 });
  });
});

describe('isValidCartItem', () => {
  it('acepta un item válido', () => {
    expect(isValidCartItem({ productId: 'p', slug: 's', name: 'n', price: 1, quantity: 1 })).toBe(
      true,
    );
  });

  it('rechaza estructuras inválidas', () => {
    expect(isValidCartItem(null)).toBe(false);
    expect(isValidCartItem({ productId: 'p' })).toBe(false);
    expect(isValidCartItem({ productId: 'p', slug: 's', name: 'n', price: 'x', quantity: 1 })).toBe(
      false,
    );
    expect(isValidCartItem({ productId: 'p', slug: 's', name: 'n', price: 1, quantity: 0 })).toBe(
      false,
    );
  });
});
