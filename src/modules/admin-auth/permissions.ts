import type { AdminSession } from './hooks/useAdminSession';

/**
 * Permisos temporales del panel. En esta fase no se almacenan en Firestore:
 * toda cuenta con custom claim admin recibe el set completo. Cuando existan
 * roles diferenciados, este mapa pasará a resolverse desde claims.
 */
export const ADMIN_PERMISSIONS = [
  'products.read',
  'products.create',
  'products.update',
  'products.delete',
  'categories.manage',
  'settings.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export function getSessionPermissions(session: AdminSession): readonly AdminPermission[] {
  return session.status === 'admin' ? ADMIN_PERMISSIONS : [];
}

export function sessionHasPermission(session: AdminSession, permission: AdminPermission): boolean {
  return getSessionPermissions(session).includes(permission);
}
