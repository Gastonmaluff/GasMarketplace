import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ComponentsDemoPage } from './ComponentsDemoPage';

describe('ComponentsDemoPage', () => {
  it('permite cambiar estados de tabla y usar el modal con teclado', async () => {
    const user = userEvent.setup();
    render(<ComponentsDemoPage />);
    await user.click(screen.getByRole('button', { name: 'Cargando' }));
    expect(screen.getByText('Cargando resultados')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir modal' }));
    expect(screen.getByRole('dialog', { name: 'Confirmar acción' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar modal' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra y descarta una notificación temporal', async () => {
    const user = userEvent.setup();
    render(<ComponentsDemoPage />);
    await user.click(screen.getByRole('button', { name: 'Mostrar notificación' }));
    expect(
      screen.getByText('La notificación temporal funciona correctamente.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(
      screen.queryByText('La notificación temporal funciona correctamente.'),
    ).not.toBeInTheDocument();
  });

  it('distingue el teléfono visual de su valor normalizado', () => {
    render(<ComponentsDemoPage />);
    const section = screen.getByRole('region', { name: 'Formatos y normalización' });
    const input = within(section).getByRole('textbox', { name: 'Teléfono móvil nacional' });

    fireEvent.change(input, { target: { value: '+595 (982)-654-321' } });

    const example = input.closest('.localized-example');
    expect(example).toHaveTextContent('+595 982 654 321');
    expect(example).toHaveTextContent('+595982654321');
  });
});
