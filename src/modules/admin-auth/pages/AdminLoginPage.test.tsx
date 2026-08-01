import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AdminLoginPage } from './AdminLoginPage';

describe('AdminLoginPage', () => {
  it('muestra el estado pendiente de Firebase sin romper', () => {
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Panel administrativo' })).toBeInTheDocument();
    expect(screen.getByText('Firebase pendiente')).toBeInTheDocument();
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument();
  });
});
