import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProductCard } from './ProductCard';
import { StorefrontDataContext, type StorefrontData } from '../hooks/storefront-context';
import { CartProvider } from '../../cart';
import { createDefaultPublicSettings } from '../../store-settings';
import type { Product } from '../../catalog';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Yerba Mate Selecta',
    normalizedName: 'yerba mate selecta',
    slug: 'yerba-mate-selecta',
    shortDescription: '',
    description: '',
    categoryIds: [],
    price: 25000,
    stock: 5,
    trackStock: true,
    allowBackorder: false,
    images: [],
    featured: false,
    active: true,
    ...overrides,
  };
}

function renderCard(node: React.ReactNode) {
  const data: StorefrontData = {
    status: 'ready',
    settings: createDefaultPublicSettings(),
    categories: [],
  };
  return render(
    <MemoryRouter>
      <StorefrontDataContext.Provider value={data}>
        <CartProvider>{node}</CartProvider>
      </StorefrontDataContext.Provider>
    </MemoryRouter>,
  );
}

describe('ProductCard', () => {
  it('muestra nombre, precio y enlace a la ficha', () => {
    renderCard(<ProductCard product={product()} />);
    expect(screen.getByRole('heading', { name: 'Yerba Mate Selecta' })).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/producto/yerba-mate-selecta');
  });

  it('muestra compareAtPrice, badge destacado y disponibilidad', () => {
    renderCard(<ProductCard product={product({ compareAtPrice: 30000, featured: true })} />);
    expect(screen.getByText(/30\.000/)).toBeInTheDocument();
    expect(screen.getByText('Destacado')).toBeInTheDocument();
    expect(screen.getByTestId('availability')).toHaveTextContent('En stock');
  });

  it('marca Agotado cuando no hay stock ni backorder', () => {
    renderCard(<ProductCard product={product({ stock: 0, allowBackorder: false })} />);
    expect(screen.getByTestId('availability')).toHaveTextContent('Agotado');
  });
});
