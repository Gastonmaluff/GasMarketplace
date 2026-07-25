import { appConfig } from '../config/app.config';

export function applyAppTheme(): void {
  document.documentElement.lang = appConfig.locale.split('-')[0] ?? 'es';
  document.documentElement.dataset.density = appConfig.theme.density;
  document.documentElement.style.setProperty('--color-primary', appConfig.theme.primary);
  document.documentElement.style.setProperty('--color-secondary', appConfig.theme.secondary);
  document.documentElement.style.setProperty('--color-sidebar', appConfig.theme.sidebar);
  document.documentElement.style.setProperty('--radius-control', appConfig.theme.borderRadius);
  document.documentElement.style.setProperty(
    '--sidebar-expanded-width',
    appConfig.theme.sidebarExpandedWidth,
  );
  document.documentElement.style.setProperty(
    '--sidebar-collapsed-width',
    appConfig.theme.sidebarCollapsedWidth,
  );
}
