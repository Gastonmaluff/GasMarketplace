import type { CartItem, CartTotals } from './cart.types';

/** Tope duro de unidades por línea, incluso sin límite de stock conocido. */
export const CART_MAX_QUANTITY = 99;

function clampQuantity(quantity: number, maxQuantity?: number): number {
  const hardMax = Math.min(CART_MAX_QUANTITY, maxQuantity ?? CART_MAX_QUANTITY);
  return Math.max(1, Math.min(Math.floor(quantity), hardMax));
}

/**
 * Agrega un producto al carrito. Si ya está, suma la cantidad; siempre respeta
 * el tope de stock/`CART_MAX_QUANTITY`. Devuelve un array nuevo (inmutable).
 */
export function addItem(
  items: readonly CartItem[],
  item: Omit<CartItem, 'quantity'>,
  quantity = 1,
): CartItem[] {
  const existing = items.find((current) => current.productId === item.productId);
  if (existing) {
    return items.map((current) =>
      current.productId === item.productId
        ? {
            ...current,
            ...item,
            quantity: clampQuantity(current.quantity + quantity, item.maxQuantity),
          }
        : current,
    );
  }
  return [...items, { ...item, quantity: clampQuantity(quantity, item.maxQuantity) }];
}

/** Fija la cantidad exacta de una línea. Cantidad <= 0 elimina la línea. */
export function setQuantity(
  items: readonly CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return removeItem(items, productId);
  return items.map((current) =>
    current.productId === productId
      ? { ...current, quantity: clampQuantity(quantity, current.maxQuantity) }
      : current,
  );
}

export function removeItem(items: readonly CartItem[], productId: string): CartItem[] {
  return items.filter((current) => current.productId !== productId);
}

export function cartTotals(items: readonly CartItem[]): CartTotals {
  return items.reduce<CartTotals>(
    (totals, item) => ({
      count: totals.count + item.quantity,
      subtotal: totals.subtotal + item.price * item.quantity,
    }),
    { count: 0, subtotal: 0 },
  );
}

/** Valida y normaliza un item cargado desde almacenamiento externo. */
export function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    typeof item.quantity === 'number' &&
    item.quantity >= 1
  );
}
