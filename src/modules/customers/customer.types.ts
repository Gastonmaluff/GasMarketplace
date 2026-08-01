/**
 * Cliente derivado de pedidos (ver docs/ECOMMERCE-ARCHITECTURE.md). Se crea o
 * actualiza únicamente por `createOrder`; el panel admin solo lee.
 */
export interface Customer {
  id: string;
  phoneNormalized: string;
  phoneDisplay: string;
  name: string;
  email?: string;
  ordersCount: number;
  /** Entero en PYG. Suma de `total` de todos sus pedidos. */
  totalSpent: number;
  lastOrderAtMillis?: number;
}
