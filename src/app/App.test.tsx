import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from './App';

describe('Gaston Web Starter', () => {
  it('renderiza la aplicación', () => {
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /una base sólida/i })).toBeInTheDocument();
  });

  it('muestra la página 404 para una ruta inexistente', () => {
    render(
      <MemoryRouter initialEntries={['/ruta-inexistente']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /esta ruta no forma parte/i })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
