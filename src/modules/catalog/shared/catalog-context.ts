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
