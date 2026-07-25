import { describe, expect, it } from 'vitest';

import { appConfig } from './app.config';

describe('appConfig', () => {
  it('carga la configuración principal', () => {
    expect(appConfig.name).toBe('Gaston Web Starter');
    expect(appConfig.theme.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(appConfig.theme.sidebarExpandedWidth).toBe('270px');
    expect(appConfig.features.internalDemo).toBe(true);
  });
});
