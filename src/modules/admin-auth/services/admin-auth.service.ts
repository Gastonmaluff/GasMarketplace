import { AuthService, FirebaseAuthProvider } from '@gaston/auth';

import { getFirebaseServices } from '../../../lib/firebase/client';

let service: AuthService | null | undefined;

/**
 * Servicio de autenticación del panel administrativo. Devuelve null cuando
 * Firebase no está configurado; la interfaz debe informarlo sin romper.
 */
export function getAdminAuthService(): AuthService | null {
  if (service !== undefined) return service;

  const firebase = getFirebaseServices();
  service = firebase === null ? null : new AuthService(new FirebaseAuthProvider(firebase.auth));

  return service;
}

/**
 * Verifica el custom claim admin del usuario autenticado actual. El claim solo
 * puede asignarse con Firebase Admin SDK desde un entorno privilegiado; el
 * cliente únicamente lo lee del ID token.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const firebase = getFirebaseServices();
  const user = firebase?.auth.currentUser ?? null;
  if (user === null) return false;

  const token = await user.getIdTokenResult();
  return token.claims['admin'] === true;
}
