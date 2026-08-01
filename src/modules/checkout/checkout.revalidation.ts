import type { CartItem } from '../cart';
import type { Product } from '../catalog';

export type RevalidationIssueKind = 'removed' | 'price-changed' | 'stock-reduced';

export interface RevalidationIssue {
  productId: string;
  name: string;
  kind: RevalidationIssueKind;
  previousPrice?: number;
  nextPrice?: number;
  availableQuantity?: number;
}

export interface RevalidationOutcome {
  issues: RevalidationIssue[];
  /** productId → nueva cantidad (stock insuficiente, pero no agotado). */
  quantityUpdates: Map<string, number>;
  /** productId → nuevo precio/tope (el producto sigue disponible). */
  priceUpdates: Map<string, { price: number; maxQuantity?: number }>;
  /** productIds a quitar del carrito (ya no existe, inactivo o agotado). */
  removals: Set<string>;
}

/**
 * Compara el carrito contra el catálogo vigente (leído justo antes del
 * checkout) y arma qué corregir. Es pura y testeable: no toca Firestore ni
 * el estado del carrito directamente, eso lo hace quien la use.
 */
export function buildRevalidationOutcome(
  items: readonly CartItem[],
  products: ReadonlyMap<string, Product | null>,
): RevalidationOutcome {
  const issues: RevalidationIssue[] = [];
  const quantityUpdates = new Map<string, number>();
  const priceUpdates = new Map<string, { price: number; maxQuantity?: number }>();
  const removals = new Set<string>();

  for (const item of items) {
    const product = products.get(item.productId);
    if (!product || !product.active) {
      issues.push({ productId: item.productId, name: item.name, kind: 'removed' });
      removals.add(item.productId);
      continue;
    }

    const maxQuantity =
      product.trackStock && !product.allowBackorder ? Math.max(product.stock, 0) : undefined;

    if (maxQuantity !== undefined && maxQuantity <= 0) {
      issues.push({ productId: item.productId, name: item.name, kind: 'removed' });
      removals.add(item.productId);
      continue;
    }

    if (product.price !== item.price) {
      issues.push({
        productId: item.productId,
        name: item.name,
        kind: 'price-changed',
        previousPrice: item.price,
        nextPrice: product.price,
      });
      priceUpdates.set(item.productId, {
        price: product.price,
        ...(maxQuantity !== undefined ? { maxQuantity } : {}),
      });
    }

    if (maxQuantity !== undefined && item.quantity > maxQuantity) {
      issues.push({
        productId: item.productId,
        name: item.name,
        kind: 'stock-reduced',
        availableQuantity: maxQuantity,
      });
      quantityUpdates.set(item.productId, maxQuantity);
    }
  }

  return { issues, quantityUpdates, priceUpdates, removals };
}
