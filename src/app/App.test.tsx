import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from './App';

// Sin Firebase configurado (entorno de pruebas), el storefront cae a defaults
// seguros: settings por defecto y sin categorías/productos.
describe('GasMarket storefront', () => {
  it('renderiza la home pública con el nombre de la tienda', async () => {
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: /gasmarket/i }, { timeout: 15000 }),
    ).toBeInTheDocument();
  }, 20000);

  it('muestra la 404 pública para una ruta inexistente', async () => {
    render(
      <MemoryRouter initialEntries={['/ruta-inexistente']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: /página no encontrada/i }, { timeout: 15000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Error 404')).toBeInTheDocument();
  }, 20000);
});
