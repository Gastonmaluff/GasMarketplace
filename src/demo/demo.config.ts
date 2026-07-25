import type { SidebarNavigationItem } from '../components/shell/Sidebar';
import type { TopbarUser } from '../components/shell/Topbar';

export const demoNavigation = [
  { icon: 'dashboard', label: 'Resumen', to: '/demo', end: true },
  { icon: 'components', label: 'Componentes', to: '/demo/componentes' },
  { icon: 'components', label: 'Módulos futuros', disabled: true },
] satisfies readonly SidebarNavigationItem[];

export const demoUser = {
  detail: 'Sin autenticación',
  exitLabel: 'Salir de la demo',
  exitTo: '/',
  initials: 'GS',
  menuDescription: 'La autenticación se integra en cada proyecto.',
  menuTitle: 'Perfil demostrativo',
  name: 'Usuario demo',
} satisfies TopbarUser;

export const demoShellLabels = {
  environment: 'Entorno demostrativo',
  section: 'Área interna',
  sidebarSection: 'Espacio de trabajo',
  systemStatus: 'Sistema operativo',
} as const;
