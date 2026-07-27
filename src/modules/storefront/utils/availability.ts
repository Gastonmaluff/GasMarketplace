import type { Product } from '../../catalog';

export type AvailabilityStatus = 'available' | 'in-stock' | 'backorder' | 'out-of-stock';

export interface Availability {
  status: AvailabilityStatus;
  label: string;
  /** Si el comprador podría adquirirlo (para el botón de carrito futuro). */
  purchasable: boolean;
}

/**
 * Disponibilidad pública derivada del control de stock. Nunca expone la
 * cantidad exacta ni el umbral interno.
 */
export function getAvailability(product: Product): Availability {
  if (!product.trackStock) {
    return { status: 'available', label: 'Disponible', purchasable: true };
  }
  if (product.stock > 0) {
    return { status: 'in-stock', label: 'En stock', purchasable: true };
  }
  if (product.allowBackorder) {
    return { status: 'backorder', label: 'Disponible bajo pedido', purchasable: true };
  }
  return { status: 'out-of-stock', label: 'Agotado', purchasable: false };
}
