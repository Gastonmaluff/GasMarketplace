import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TextField } from './TextField';

describe('TextField', () => {
  it('asocia etiqueta, ayuda y estado requerido', () => {
    render(<TextField helpText="Ayuda contextual" label="Nombre" required />);
    const input = screen.getByRole('textbox', { name: 'Nombre' });
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Ayuda contextual');
  });

  it('expone errores mediante aria-invalid y descripción', () => {
    render(<TextField error="Valor inválido" label="Código" />);
    const input = screen.getByRole('textbox', { name: 'Código' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Valor inválido');
  });

  it('normaliza nombres únicamente al perder el foco', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TextField defaultValue="  maría   gonzález " label="Nombre" normalization="person-name" />
        <TextField defaultValue="  Sin Cambios  " label="Código" normalization="none" />
      </>,
    );
    const name = screen.getByRole('textbox', { name: 'Nombre' });
    const code = screen.getByRole('textbox', { name: 'Código' });

    await user.click(name);
    expect(name).toHaveValue('  maría   gonzález ');
    await user.tab();
    expect(name).toHaveValue('María González');

    await user.click(code);
    await user.tab();
    expect(code).toHaveValue('  Sin Cambios  ');
  });
});
