import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageUpload } from './ImageUpload';

describe('ImageUpload', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('valida formato y tamaño configurables', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<ImageUpload acceptedTypes={['image/png']} maxSizeBytes={3} />);
    const input = screen.getByLabelText(/Seleccionar imagen/i);

    await user.upload(input, new File(['texto'], 'archivo.txt', { type: 'text/plain' }));
    expect(screen.getByRole('alert')).toHaveTextContent('formato');

    await user.upload(input, new File(['grande'], 'grande.png', { type: 'image/png' }));
    expect(screen.getByRole('alert')).toHaveTextContent('límite');
  });

  it('muestra vista previa, procesamiento, nombre y permite eliminar', async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);
    const input = screen.getByLabelText(/Seleccionar imagen/i);
    await user.upload(input, new File(['imagen'], 'avatar.png', { type: 'image/png' }));

    const preview = screen.getByRole('img', { name: 'Vista previa de avatar.png' });
    expect(screen.getByRole('status')).toHaveTextContent('Procesando imagen');
    expect(screen.getByText('avatar.png')).toBeInTheDocument();
    fireEvent.load(preview);
    expect(screen.queryByText('Procesando imagen')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar imagen' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
