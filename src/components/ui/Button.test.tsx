import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('mantiene el contenido para conservar el ancho durante la carga', () => {
    render(
      <Button loading loadingLabel="Guardando">
        Guardar cambios
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Guardando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Guardar cambios')).toHaveClass('button__content--hidden');
  });

  it('usa el estado nativo deshabilitado', () => {
    render(<Button disabled>Acción no disponible</Button>);
    expect(screen.getByRole('button', { name: 'Acción no disponible' })).toBeDisabled();
  });
});
