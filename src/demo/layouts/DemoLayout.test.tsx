import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DemoLayout } from './DemoLayout';

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/demo']}>
      <Routes>
        <Route element={<DemoLayout />}>
          <Route path="demo" element={<h1>Contenido demo</h1>} />
          <Route path="demo/componentes" element={<h1>Catálogo</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('DemoLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.style.overflow = '';
  });

  it('colapsa el sidebar y persiste la preferencia', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Colapsar barra lateral' }));
    expect(window.localStorage.getItem('gasmarket:sidebar:v1')).toBe('collapsed');
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toBeInTheDocument();
  });

  it('cierra el drawer al navegar', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('link', { name: 'Componentes' }));
    expect(screen.getByLabelText('Navegación interna')).not.toHaveClass('sidebar--open');
    expect(screen.getByRole('heading', { name: 'Catálogo' })).toBeInTheDocument();
  });

  it('bloquea el scroll y cierra el drawer con Escape', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Navegación interna')).not.toHaveClass('sidebar--open');
    expect(document.body.style.overflow).toBe('');
  });

  it('cierra el drawer al tocar fuera', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar menú lateral' }));
    expect(screen.getByLabelText('Navegación interna')).not.toHaveClass('sidebar--open');
  });

  it('permite recorrer la carcasa con teclado', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'GasMarket, inicio' })).toHaveFocus();
  });
});
