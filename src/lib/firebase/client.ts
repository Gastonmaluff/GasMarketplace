import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { firebaseConfig, isFirebaseConfigured } from './config';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  database: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null | undefined;

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

  return services;
}
