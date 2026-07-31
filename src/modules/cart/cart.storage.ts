import { isValidCartItem } from './cart.core';
import type { CartItem } from './cart.types';

const STORAGE_KEY = 'gasmarket:cart:v1';

/** Carga el carrito desde localStorage, descartando items inválidos. */
export function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem);
  } catch {
    return [];
  }
}

export function saveCart(items: readonly CartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // El carrito sigue funcionando en memoria aunque el navegador bloquee el almacenamiento.
  }
}
