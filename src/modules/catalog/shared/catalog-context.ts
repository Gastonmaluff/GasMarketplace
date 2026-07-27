import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

import { getFirebaseServices } from '../../../lib/firebase/client';

export class CatalogError extends Error {
  readonly errors: string[];

  constructor(errors: string[], message = errors[0] ?? 'No se pudo completar la operación.') {
    super(message);
    this.name = 'CatalogError';
    this.errors = errors;
  }
}

export interface CatalogContext {
  database: Firestore;
  storage: FirebaseStorage;
  uid: string;
}

export function getCatalogContext(): CatalogContext {
  const firebase = getFirebaseServices();
  const uid = firebase?.auth.currentUser?.uid;
  if (!firebase || !uid) {
    throw new CatalogError(['Firebase no está disponible o no hay sesión activa.']);
  }
  return { database: firebase.database, storage: firebase.storage, uid };
}

/**
 * Acceso de solo lectura para el storefront público: no exige sesión, pero sí
 * que Firebase esté configurado. Las consultas que lo usan deben incluir
 * `active == true` para cumplir las Security Rules.
 */
export function getPublicCatalogDatabase(): Firestore {
  const firebase = getFirebaseServices();
  if (!firebase) {
    throw new CatalogError(['La tienda no está disponible en este momento.']);
  }
  return firebase.database;
}
