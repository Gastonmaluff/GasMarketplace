import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';

import { firebaseConfig, isFirebaseConfigured, useFirebaseEmulators } from './config';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  database: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
}

const EMULATOR_HOST = '127.0.0.1';

let services: FirebaseServices | null | undefined;

function connectEmulators({ auth, database, functions, storage }: FirebaseServices): void {
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(database, EMULATOR_HOST, 8080);
  connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);
}

export function getFirebaseServices(): FirebaseServices | null {
  if (!isFirebaseConfigured) return null;
  if (services) return services;

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  services = {
    app,
    auth: getAuth(app),
    database: getFirestore(app),
    functions: getFunctions(app),
    storage: getStorage(app),
  };

  if (useFirebaseEmulators) {
    connectEmulators(services);
  }

  return services;
}
