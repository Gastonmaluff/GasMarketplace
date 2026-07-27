import { doc, getDoc, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';

import { getFirebaseServices } from '../../lib/firebase/client';
import { createDefaultPrivateSettings, createDefaultPublicSettings } from './settings.defaults';
import { validatePrivateSettings, validatePublicSettings } from './settings.validation';
import type { PrivateStoreSettings, PublicStoreSettings, StoreSettings } from './settings.types';

export class SettingsError extends Error {
  readonly errors: string[];

  constructor(errors: string[], message = errors[0] ?? 'No se pudo completar la operación.') {
    super(message);
    this.name = 'SettingsError';
    this.errors = errors;
  }
}

interface SettingsContext {
  database: Firestore;
  uid: string;
}

function getContext(): SettingsContext {
  const firebase = getFirebaseServices();
  const uid = firebase?.auth.currentUser?.uid;
  if (!firebase || !uid) {
    throw new SettingsError(['Firebase no está disponible o no hay sesión activa.']);
  }
  return { database: firebase.database, uid };
}

function mergeWithDefaults<T extends object>(defaults: T, stored: unknown): T {
  if (typeof stored !== 'object' || stored === null) return defaults;
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = (stored as Record<string, unknown>)[key as string];
    if (value !== undefined) {
      merged[key] = value as T[keyof T];
    }
  }
  return merged;
}

/** Carga ambos documentos de settings, aplicando defaults seguros si no existen. */
export async function loadStoreSettings(): Promise<StoreSettings> {
  const { database } = getContext();

  const [publicSnapshot, privateSnapshot] = await Promise.all([
    getDoc(doc(database, 'settings', 'public')),
    getDoc(doc(database, 'settings', 'private')),
  ]);

  return {
    publicSettings: mergeWithDefaults(createDefaultPublicSettings(), publicSnapshot.data()),
    privateSettings: mergeWithDefaults(createDefaultPrivateSettings(), privateSnapshot.data()),
  };
}

/**
 * Valida y guarda ambos documentos en un batch atómico. Lanza SettingsError con
 * la lista completa de problemas cuando la validación falla.
 */
export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const publicResult = validatePublicSettings(settings.publicSettings);
  const privateResult = validatePrivateSettings(settings.privateSettings);
  const errors = [...publicResult.errors, ...privateResult.errors];
  if (errors.length > 0) {
    throw new SettingsError(errors);
  }

  const { database, uid } = getContext();
  const audit = { updatedAt: serverTimestamp(), updatedBy: uid };

  const batch = writeBatch(database);
  batch.set(doc(database, 'settings', 'public'), { ...settings.publicSettings, ...audit });
  batch.set(doc(database, 'settings', 'private'), { ...settings.privateSettings, ...audit });
  await batch.commit();
}

export function normalizePrivateSettings(settings: PrivateStoreSettings): PrivateStoreSettings {
  return {
    ...settings,
    internalOrderNotificationEmails: settings.internalOrderNotificationEmails
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email !== ''),
  };
}

export function normalizePublicSettings(settings: PublicStoreSettings): PublicStoreSettings {
  return {
    ...settings,
    storeName: settings.storeName.trim().replace(/\s+/gu, ' '),
    storeDescription: settings.storeDescription.trim(),
    supportEmail: settings.supportEmail.trim().toLowerCase(),
    address: settings.address.trim(),
    city: settings.city.trim(),
    orderConfirmationMessage: settings.orderConfirmationMessage.trim(),
    deliveryZones: settings.deliveryZones.map((zone, index) => {
      const { description, ...rest } = zone;
      const trimmedDescription = description?.trim();
      return {
        ...rest,
        name: zone.name.trim().replace(/\s+/gu, ' '),
        order: index,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      };
    }),
  };
}
