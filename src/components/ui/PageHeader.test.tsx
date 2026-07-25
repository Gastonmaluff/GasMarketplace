import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('compone contexto, acciones y contenido adicional', () => {
    render(
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Página actual' }]}
        description="Descripción reutilizable"
        eyebrow="Contexto"
        primaryAction={<button type="button">Acción principal</button>}
        title="Título de página"
      >
        <label>
          Filtro <input />
        </label>
      </PageHeader>,
    );

    expect(screen.getByRole('heading', { name: 'Título de página' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Migas de pan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acción principal' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Filtro' })).toBeInTheDocument();
  });
});
