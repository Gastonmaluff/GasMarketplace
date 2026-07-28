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

function getFirebaseErrorCode(cause: unknown): string | null {
  if (typeof cause !== 'object' || cause === null) return null;
  const code = (cause as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function getFirebaseErrorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}

function isProductionMode(): boolean {
  return import.meta.env.MODE === 'production';
}

export function toCatalogError(
  cause: unknown,
  fallbackMessage = 'No se pudo completar la operacion. Intenta nuevamente.',
): CatalogError {
  if (cause instanceof CatalogError) return cause;

  const code = getFirebaseErrorCode(cause);
  const rawMessage = getFirebaseErrorMessage(cause);
  const lowerMessage = rawMessage.toLowerCase();

  let message = fallbackMessage;
  if (code === 'permission-denied') {
    message = 'No tenes permisos suficientes para completar esta accion.';
  } else if (code === 'storage/unauthorized') {
    message = 'No tenes permisos para subir o modificar imagenes.';
  } else if (code === 'invalid-argument' || lowerMessage.includes('unsupported field value')) {
    message = 'Hay un campo invalido en el producto. Revisa los datos e intenta de nuevo.';
  } else if (code === 'already-exists') {
    message = 'Ya existe un registro con esos datos.';
  } else if (code === 'unavailable') {
    message = 'Firebase no respondio a tiempo. Intenta nuevamente.';
  }

  if (!isProductionMode()) {
    console.warn('[catalog]', {
      code: code ?? 'unknown',
      message: rawMessage,
    });
  }

  return new CatalogError([message], message);
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
