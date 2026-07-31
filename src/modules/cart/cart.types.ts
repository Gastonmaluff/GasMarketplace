export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  /** Precio unitario en PYG (snapshot al agregar). */
  price: number;
  image?: string;
  quantity: number;
  /** Tope de unidades (stock al agregar). undefined = sin límite conocido. */
  maxQuantity?: number;
}

export interface CartTotals {
  count: number;
  subtotal: number;
}
