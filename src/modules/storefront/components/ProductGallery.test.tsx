import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ProductGallery } from './ProductGallery';
import type { ProductImage } from '../../catalog';

function image(overrides: Partial<ProductImage>): ProductImage {
  return {
    id: 'i1',
    url: 'https://example.test/img.jpg',
    path: 'products/p1/img.jpg',
    alt: '',
    order: 0,
    isPrimary: false,
    ...overrides,
  };
}

describe('ProductGallery', () => {
  it('sin imágenes muestra el placeholder accesible', () => {
    render(<ProductGallery images={[]} productName="Producto" />);
    expect(screen.getByRole('img', { name: 'Producto' })).toBeInTheDocument();
  });

  it('muestra miniaturas y marca la principal como actual', () => {
    render(
      <ProductGallery
        images={[
          image({ id: 'a', order: 1, alt: 'Segunda' }),
          image({ id: 'b', order: 0, isPrimary: true, alt: 'Principal' }),
        ]}
        productName="Producto"
      />,
    );
    const thumbs = screen.getAllByRole('button');
    expect(thumbs).toHaveLength(2);
    // La principal (order 0) queda seleccionada al inicio.
    expect(thumbs[0]).toHaveAttribute('aria-current', 'true');
  });

  it('permite cambiar la imagen activa al hacer clic en una miniatura', async () => {
    const user = userEvent.setup();
    render(
      <ProductGallery
        images={[
          image({ id: 'a', order: 0, isPrimary: true, alt: 'Principal' }),
          image({ id: 'b', order: 1, alt: 'Segunda' }),
        ]}
        productName="Producto"
      />,
    );
    const thumbs = screen.getAllByRole('button');
    await user.click(thumbs[1]!);
    expect(thumbs[1]).toHaveAttribute('aria-current', 'true');
    expect(thumbs[0]).toHaveAttribute('aria-current', 'false');
  });
});
