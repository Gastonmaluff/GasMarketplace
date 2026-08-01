import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentSnapshot,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

import { getFirebaseServices } from '../../lib/firebase/client';
import { canTransition } from './order.core';
import type {
  DeliveryMethod,
  Order,
  OrderEvent,
  OrderEventType,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from './order.types';

export class OrderError extends Error {
  readonly errors: string[];

  constructor(errors: string[], message = errors[0] ?? 'No se pudo completar la operación.') {
    super(message);
    this.name = 'OrderError';
    this.errors = errors;
  }
}

interface OrdersContext {
  database: Firestore;
  uid: string;
}

function getContext(): OrdersContext {
  const firebase = getFirebaseServices();
  const uid = firebase?.auth.currentUser?.uid;
  if (!firebase || !uid) {
    throw new OrderError(['Firebase no está disponible o no hay sesión activa.']);
  }
  return { database: firebase.database, uid };
}

const MAX_ORDERS = 200;
const MAX_EVENTS = 50;

function toOrderItem(value: unknown): OrderItem {
  const item = (value ?? {}) as Record<string, unknown>;
  return {
    productId: typeof item.productId === 'string' ? item.productId : '',
    name: typeof item.name === 'string' ? item.name : '',
    unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
    quantity: typeof item.quantity === 'number' ? item.quantity : 0,
    subtotal: typeof item.subtotal === 'number' ? item.subtotal : 0,
  };
}

export function toOrder(snapshot: DocumentSnapshot): Order {
  const data = snapshot.data() ?? {};
  const customer = (data.customer ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items.map(toOrderItem) : [];
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id: snapshot.id,
    number: typeof data.number === 'string' ? data.number : '',
    status: (typeof data.status === 'string' ? data.status : 'pendiente') as OrderStatus,
    customer: {
      name: typeof customer.name === 'string' ? customer.name : '',
      phoneDisplay: typeof customer.phoneDisplay === 'string' ? customer.phoneDisplay : '',
      phoneNormalized: typeof customer.phoneNormalized === 'string' ? customer.phoneNormalized : '',
      ...(typeof customer.email === 'string' && customer.email ? { email: customer.email } : {}),
      ...(typeof customer.address === 'string' && customer.address
        ? { address: customer.address }
        : {}),
    },
    customerId: typeof data.customerId === 'string' ? data.customerId : '',
    items,
    deliveryMethod: (typeof data.deliveryMethod === 'string'
      ? data.deliveryMethod
      : 'pickup') as DeliveryMethod,
    ...(typeof data.deliveryZoneId === 'string' && data.deliveryZoneId
      ? { deliveryZoneId: data.deliveryZoneId }
      : {}),
    deliveryCost: typeof data.deliveryCost === 'number' ? data.deliveryCost : 0,
    total: typeof data.total === 'number' ? data.total : 0,
    paymentMethod: (typeof data.paymentMethod === 'string'
      ? data.paymentMethod
      : 'cash') as PaymentMethod,
    ...(typeof data.notes === 'string' && data.notes ? { notes: data.notes } : {}),
    ...(createdAt && typeof createdAt.toMillis === 'function'
      ? { createdAtMillis: createdAt.toMillis() }
      : {}),
    ...(updatedAt && typeof updatedAt.toMillis === 'function'
      ? { updatedAtMillis: updatedAt.toMillis() }
      : {}),
  };
}

function toOrderEvent(snapshot: DocumentSnapshot): OrderEvent {
  const data = snapshot.data() ?? {};
  const createdAt = data.createdAt as Timestamp | undefined;
  return {
    id: snapshot.id,
    type: (typeof data.type === 'string' ? data.type : 'nota') as OrderEventType,
    ...(typeof data.fromStatus === 'string' ? { fromStatus: data.fromStatus as OrderStatus } : {}),
    ...(typeof data.toStatus === 'string' ? { toStatus: data.toStatus as OrderStatus } : {}),
    ...(typeof data.note === 'string' && data.note ? { note: data.note } : {}),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    ...(createdAt && typeof createdAt.toMillis === 'function'
      ? { createdAtMillis: createdAt.toMillis() }
      : {}),
  };
}

/** Listado administrativo, ordenado por fecha de creación descendente. */
export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const { database } = getContext();
  const constraints = status
    ? [where('status', '==', status), orderBy('createdAt', 'desc'), queryLimit(MAX_ORDERS)]
    : [orderBy('createdAt', 'desc'), queryLimit(MAX_ORDERS)];
  const snapshot = await getDocs(query(collection(database, 'orders'), ...constraints));
  return snapshot.docs.map(toOrder);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { database } = getContext();
  const snapshot = await getDoc(doc(database, 'orders', orderId));
  return snapshot.exists() ? toOrder(snapshot) : null;
}

export async function listOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const { database } = getContext();
  const snapshot = await getDocs(
    query(
      collection(database, `orders/${orderId}/events`),
      orderBy('createdAt', 'desc'),
      queryLimit(MAX_EVENTS),
    ),
  );
  return snapshot.docs.map(toOrderEvent);
}

/**
 * Transiciona el estado de un pedido, validado por la misma máquina de
 * estados que usa la Cloud Function (`canTransition`) y por las Security
 * Rules. Agrega un evento `cambio_estado` y, al cancelar, repone stock con
 * movimientos `anulacion` — todo en una única transacción.
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  note?: string,
): Promise<void> {
  const { database, uid } = getContext();
  const trimmedNote = note?.trim();

  await runTransaction(database, async (transaction) => {
    const orderRef = doc(database, 'orders', orderId);
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new OrderError(['El pedido ya no existe.']);
    }
    const orderData = orderSnapshot.data();
    const fromStatus = orderData.status as OrderStatus;
    if (!canTransition(fromStatus, toStatus)) {
      throw new OrderError([`No se puede pasar de "${fromStatus}" a "${toStatus}".`]);
    }

    const items = Array.isArray(orderData.items) ? orderData.items.map(toOrderItem) : [];
    const restocking = toStatus === 'cancelado';

    const productSnapshots: DocumentSnapshot[] = [];
    if (restocking) {
      for (const item of items) {
        productSnapshots.push(await transaction.get(doc(database, 'products', item.productId)));
      }
    }

    transaction.update(orderRef, {
      status: toStatus,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });

    const eventRef = doc(collection(database, `orders/${orderId}/events`));
    transaction.set(eventRef, {
      type: 'cambio_estado',
      fromStatus,
      toStatus,
      ...(trimmedNote ? { note: trimmedNote } : {}),
      createdAt: serverTimestamp(),
      createdBy: uid,
    });

    if (restocking) {
      items.forEach((item, index) => {
        const productSnapshot = productSnapshots[index];
        if (!productSnapshot?.exists() || item.quantity <= 0) return;
        const product = productSnapshot.data();
        if (product?.trackStock !== true) return;

        const previousStock = typeof product.stock === 'number' ? product.stock : 0;
        const resultingStock = previousStock + item.quantity;
        transaction.update(productSnapshot.ref, {
          stock: resultingStock,
          updatedAt: serverTimestamp(),
          updatedBy: uid,
        });

        const movementRef = doc(collection(database, 'stockMovements'));
        transaction.set(movementRef, {
          productId: item.productId,
          type: 'anulacion',
          orderId,
          quantity: item.quantity,
          previousStock,
          resultingStock,
          reason: `Cancelación — pedido ${String(orderData.number ?? orderId)}`,
          createdAt: serverTimestamp(),
          createdBy: uid,
        });
      });
    }
  });
}
