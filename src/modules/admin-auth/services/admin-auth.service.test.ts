import { describe, expect, it } from 'vitest';

import { getAdminAuthService, isCurrentUserAdmin } from './admin-auth.service';

describe('admin-auth.service', () => {
  it('devuelve null cuando Firebase no está configurado', () => {
    expect(getAdminAuthService()).toBeNull();
  });

  it('no reconoce administradores sin sesión de Firebase', async () => {
    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });
});
