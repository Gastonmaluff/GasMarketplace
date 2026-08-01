import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CartProvider } from '../../cart';
import { createDefaultPublicSettings } from '../../store-settings';
import { StorefrontDataContext, type StorefrontData } from '../hooks/storefront-context';
import type { Product } from '../../catalog';

const searchActiveProducts = vi.fn<(term: string) => Promise<Product[]>>();

vi.mock('../../catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../catalog')>();
  return { ...actual, searchActiveProducts: (term: string) => searchActiveProducts(term) };
});

const { SearchPage } = await import('./SearchPage');

function product(name: string): Product {
  return {
    id: name,
    name,
    normalizedName: name.toLowerCase(),
    slug: name.toLowerCase(),
    shortDescription: '',
    description: '',
    categoryIds: [],
    price: 10000,
    stock: 3,
    trackStock: true,
    allowBackorder: false,
    images: [],
    featured: false,
    active: true,
  };
}

function renderSearch(initialEntry: string) {
  const data: StorefrontData = {
    status: 'ready',
    settings: createDefaultPublicSettings(),
    categories: [],
  };
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <StorefrontDataContext.Provider value={data}>
        <CartProvider>
          <SearchPage />
        </CartProvider>
      </StorefrontDataContext.Provider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  searchActiveProducts.mockReset();
});

describe('SearchPage', () => {
  it('con término vacío muestra el estado inicial y no consulta', () => {
    renderSearch('/buscar');
    expect(screen.getByRole('heading', { name: /qué estás buscando/i })).toBeInTheDocument();
    expect(searchActiveProducts).not.toHaveBeenCalled();
  });

  it('muestra resultados y mantiene el término en el encabezado', async () => {
    searchActiveProducts.mockResolvedValue([product('Yerba'), product('Yerbera')]);
    renderSearch('/buscar?q=yerba');
    expect(await screen.findByText('2 resultados')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /resultados para "yerba"/i })).toBeInTheDocument();
    expect(searchActiveProducts).toHaveBeenCalledWith('yerba');
  });

  it('muestra el estado sin resultados', async () => {
    searchActiveProducts.mockResolvedValue([]);
    renderSearch('/buscar?q=inexistente');
    expect(await screen.findByRole('heading', { name: /sin resultados/i })).toBeInTheDocument();
  });
});
