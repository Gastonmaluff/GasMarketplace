import { afterEach, describe, expect, it } from 'vitest';

import { loadCart, saveCart } from './cart.storage';
import type { CartItem } from './cart.types';

const validItem: CartItem = {
  productId: 'p1',
  slug: 'yerba',
  name: 'Yerba',
  price: 25000,
  quantity: 2,
};

afterEach(() => {
  window.localStorage.clear();
});

describe('cart.storage', () => {
  it('guarda y recupera el carrito', () => {
    saveCart([validItem]);
    expect(loadCart()).toEqual([validItem]);
  });

  it('devuelve vacío si no hay nada guardado', () => {
    expect(loadCart()).toEqual([]);
  });

  it('descarta items inválidos y JSON corrupto', () => {
    window.localStorage.setItem(
      'gasmarket:cart:v1',
      JSON.stringify([validItem, { productId: 'x' }]),
    );
    expect(loadCart()).toEqual([validItem]);

    window.localStorage.setItem('gasmarket:cart:v1', 'no-es-json');
    expect(loadCart()).toEqual([]);
  });
});
