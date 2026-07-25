import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AdminGuard } from './AdminGuard';

describe('AdminGuard', () => {
  it('no expone el contenido protegido cuando Firebase no está configurado', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminGuard />}>
            <Route path="admin" element={<h1>Contenido protegido</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Firebase pendiente')).toBeInTheDocument();
  });
});
