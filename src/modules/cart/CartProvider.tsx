import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { addItem, cartTotals, removeItem, setQuantity } from './cart.core';
import { CartContext, type CartContextValue, toCartInput } from './cart.context';
import { loadCart, saveCart } from './cart.storage';
import type { CartItem } from './cart.types';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totals: cartTotals(items),
      addProduct: (product, quantity = 1) =>
        setItems((current) => addItem(current, toCartInput(product), quantity)),
      setItemQuantity: (productId, quantity) =>
        setItems((current) => setQuantity(current, productId, quantity)),
      removeProduct: (productId) => setItems((current) => removeItem(current, productId)),
      clear: () => setItems([]),
      hasProduct: (productId) => items.some((item) => item.productId === productId),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
