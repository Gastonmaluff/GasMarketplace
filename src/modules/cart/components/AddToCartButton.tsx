import { useEffect, useState } from 'react';

import { Icon } from '../../../components/ui/Icon';
import type { Product } from '../../catalog';
import { useCart } from '../cart.context';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  label?: string;
  sublabel?: string;
}

function isPurchasable(product: Product): boolean {
  return !product.trackStock || product.stock > 0 || product.allowBackorder;
}

/** Botón para agregar un producto al carrito, con feedback breve de "agregado". */
export function AddToCartButton({
  className = 'button button--primary',
  label = 'Agregar al carrito',
  product,
  sublabel,
}: AddToCartButtonProps) {
  const { addProduct } = useCart();
  const [added, setAdded] = useState(false);
  const purchasable = isPurchasable(product);

  useEffect(() => {
    if (!added) return undefined;
    const timeout = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [added]);

  if (!purchasable) {
    return (
      <button className={className} disabled type="button">
        <Icon name="cart" size={18} />
        <span>Sin stock</span>
      </button>
    );
  }

  return (
    <button
      className={className}
      onClick={() => {
        addProduct(product);
        setAdded(true);
      }}
      type="button"
    >
      <Icon name={added ? 'check' : 'cart'} size={18} />
      <span>
        {added ? '¡Agregado!' : label}
        {sublabel && !added ? <small>{sublabel}</small> : null}
      </span>
    </button>
  );
}
