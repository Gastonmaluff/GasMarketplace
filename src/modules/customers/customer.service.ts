import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  type DocumentSnapshot,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

import { getFirebaseServices } from '../../lib/firebase/client';
import type { Customer } from './customer.types';

export class CustomerError extends Error {
  readonly errors: string[];

  constructor(errors: string[], message = errors[0] ?? 'No se pudo completar la operación.') {
    super(message);
    this.name = 'CustomerError';
    this.errors = errors;
  }
}

interface CustomersContext {
  database: Firestore;
}

function getContext(): CustomersContext {
  const firebase = getFirebaseServices();
  const uid = firebase?.auth.currentUser?.uid;
  if (!firebase || !uid) {
    throw new CustomerError(['Firebase no está disponible o no hay sesión activa.']);
  }
  return { database: firebase.database };
}

const MAX_CUSTOMERS = 200;

function toCustomer(snapshot: DocumentSnapshot): Customer {
  const data = snapshot.data() ?? {};
  const lastOrderAt = data.lastOrderAt as Timestamp | undefined;
  return {
    id: snapshot.id,
    phoneNormalized: typeof data.phoneNormalized === 'string' ? data.phoneNormalized : '',
    phoneDisplay: typeof data.phoneDisplay === 'string' ? data.phoneDisplay : '',
    name: typeof data.name === 'string' ? data.name : '',
    ...(typeof data.email === 'string' && data.email ? { email: data.email } : {}),
    ordersCount: typeof data.ordersCount === 'number' ? data.ordersCount : 0,
    totalSpent: typeof data.totalSpent === 'number' ? data.totalSpent : 0,
    ...(lastOrderAt && typeof lastOrderAt.toMillis === 'function'
      ? { lastOrderAtMillis: lastOrderAt.toMillis() }
      : {}),
  };
}

/** Listado administrativo, ordenado por último pedido descendente. */
export async function listCustomers(): Promise<Customer[]> {
  const { database } = getContext();
  const snapshot = await getDocs(
    query(
      collection(database, 'customers'),
      orderBy('lastOrderAt', 'desc'),
      queryLimit(MAX_CUSTOMERS),
    ),
  );
  return snapshot.docs.map(toCustomer);
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const { database } = getContext();
  const snapshot = await getDoc(doc(database, 'customers', customerId));
  return snapshot.exists() ? toCustomer(snapshot) : null;
}
