import type { AppConfig } from '../types/app';

export const appConfig = {
  name: 'GasMarket',
  description: 'Tienda web para compra de mercaderías.',
  branding: {
    logoFull: '/brand/mercado48-logo-header.webp',
    logoCompact: '/brand/mercado48-logo-header.webp',
  },
  theme: {
    primary: '#17635c',
    secondary: '#0f4a44',
    sidebar: '#123a36',
    borderRadius: '0.7rem',
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
