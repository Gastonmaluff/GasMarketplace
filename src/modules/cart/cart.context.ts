import { createContext, useContext } from 'react';

import type { Product } from '../catalog';
import type { CartItem, CartTotals } from './cart.types';

export interface CartContextValue {
  items: CartItem[];
  totals: CartTotals;
  addProduct: (product: Product, quantity?: number) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  hasProduct: (productId: string) => boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);

/** Snapshot público del producto para el carrito (sin datos internos). */
export function toCartInput(product: Product): Omit<CartItem, 'quantity'> {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0] ?? undefined;
  const maxQuantity =
    product.trackStock && !product.allowBackorder ? Math.max(product.stock, 0) : undefined;
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    ...(primaryImage?.url ? { image: primaryImage.url } : {}),
    ...(maxQuantity !== undefined ? { maxQuantity } : {}),
  };
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider.');
  }
  return context;
}
