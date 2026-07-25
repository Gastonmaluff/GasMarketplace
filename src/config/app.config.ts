import type { AppConfig } from '../types/app';

export const appConfig = {
  name: 'Gaston Web Starter',
  description: 'Base técnica profesional para crear sistemas web personalizados.',
  branding: {
    logoFull: '/favicon.svg',
    logoCompact: '/favicon.svg',
  },
  theme: {
    primary: '#335cff',
    secondary: '#0f766e',
    sidebar: '#111827',
    borderRadius: '0.85rem',
    density: 'comfortable',
    sidebarExpandedWidth: '270px',
    sidebarCollapsedWidth: '76px',
  },
  locale: 'es-PY',
  timezone: 'America/Asuncion',
  currency: 'PYG',
  features: {
    publicArea: true,
    internalDemo: true,
    firebase: true,
  },
} satisfies AppConfig;
