import { HttpsError } from 'firebase-functions/https';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import {
  computeOrderTotals,
  formatOrderNumber,
  isValidParaguayMobile,
  normalizeParaguayPhone,
  PAYMENT_METHODS,
  type DeliveryMethod,
  type OrderItem,
  type OrderStatus,
  type OrderTotals,
  type PaymentMethod,
} from './order-core';

/** Origen de los cambios que no vienen de un admin autenticado. */
export const SYSTEM_ACTOR = 'system:createOrder';

export const MAX_ORDER_ITEMS = 50;
export const MAX_ORDER_ITEM_QUANTITY = 99;
export const MAX_CUSTOMER_NAME_LENGTH = 120;
export const MAX_CUSTOMER_EMAIL_LENGTH = 160;
export const MAX_CUSTOMER_ADDRESS_LENGTH = 300;
export const MAX_ORDER_NOTES_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  customer: CreateOrderCustomerInput;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CreateOrderResult {
  orderId: string;
  number: string;
  status: OrderStatus;
  items: OrderItem[];
  totals: OrderTotals;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  paymentMethod: PaymentMethod;
  customer: {
    name: string;
    phoneDisplay: string;
    phoneNormalized: string;
    email?: string;
    address?: string;
  };
}

interface NormalizedRequest {
  items: CreateOrderItemInput[];
  customerName: string;
  customerPhoneDisplay: string;
  customerPhoneNormalized: string;
  customerEmail?: string;
  customerAddress?: string;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

function invalidArgument(message: string): never {
  throw new HttpsError('invalid-argument', message);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Valida la forma del payload y lo normaliza. Fusiona líneas repetidas del
 * mismo producto (defensivo: el carrito ya agrega por productId) para que la
 * transacción lea cada producto una sola vez.
 */
export function validateCreateOrderPayload(payload: unknown): NormalizedRequest {
  if (typeof payload !== 'object' || payload === null) {
    invalidArgument('El pedido es inválido.');
  }
  const data = payload as Record<string, unknown>;

  if (!Array.isArray(data.items) || data.items.length === 0) {
    invalidArgument('El pedido no tiene productos.');
  }
  if (data.items.length > MAX_ORDER_ITEMS) {
    invalidArgument(`Un pedido no puede tener más de ${MAX_ORDER_ITEMS} líneas.`);
  }

  const merged = new Map<string, number>();
  for (const rawItem of data.items) {
    if (typeof rawItem !== 'object' || rawItem === null) {
      invalidArgument('Hay un producto inválido en el pedido.');
    }
    const item = rawItem as Record<string, unknown>;
    if (!isNonEmptyString(item.productId) || item.productId.length > 100) {
      invalidArgument('Hay un producto inválido en el pedido.');
    }
    const quantity = item.quantity;
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ORDER_ITEM_QUANTITY
    ) {
      invalidArgument('Hay una cantidad inválida en el pedido.');
    }
    const productId = item.productId as string;
    merged.set(
      productId,
      Math.min(MAX_ORDER_ITEM_QUANTITY, (merged.get(productId) ?? 0) + quantity),
    );
  }

  const customer = data.customer;
  if (typeof customer !== 'object' || customer === null) {
    invalidArgument('Los datos del comprador son obligatorios.');
  }
  const customerData = customer as Record<string, unknown>;

  if (!isNonEmptyString(customerData.name) || customerData.name.length > MAX_CUSTOMER_NAME_LENGTH) {
    invalidArgument('El nombre del comprador es obligatorio.');
  }
  if (!isNonEmptyString(customerData.phone)) {
    invalidArgument('El teléfono del comprador es obligatorio.');
  }
  const phoneNormalized = normalizeParaguayPhone(customerData.phone as string);
  if (!isValidParaguayMobile(customerData.phone as string)) {
    invalidArgument('El teléfono debe ser un número móvil paraguayo válido.');
  }
  if (
    customerData.email !== undefined &&
    (typeof customerData.email !== 'string' ||
      (customerData.email !== '' &&
        (!EMAIL_PATTERN.test(customerData.email) ||
          customerData.email.length > MAX_CUSTOMER_EMAIL_LENGTH)))
  ) {
    invalidArgument('El correo del comprador no es válido.');
  }
  if (
    customerData.address !== undefined &&
    (typeof customerData.address !== 'string' ||
      customerData.address.length > MAX_CUSTOMER_ADDRESS_LENGTH)
  ) {
    invalidArgument('La dirección es demasiado larga.');
  }

  if (data.deliveryMethod !== 'pickup' && data.deliveryMethod !== 'delivery') {
    invalidArgument('El método de entrega es inválido.');
  }
  const deliveryMethod = data.deliveryMethod as DeliveryMethod;

  let deliveryZoneId: string | undefined;
  if (deliveryMethod === 'delivery') {
    if (!isNonEmptyString(data.deliveryZoneId) || data.deliveryZoneId.length > 100) {
      invalidArgument('Elegí una zona de entrega válida.');
    }
    deliveryZoneId = data.deliveryZoneId as string;
  }

  if (!PAYMENT_METHODS.includes(data.paymentMethod as PaymentMethod)) {
    invalidArgument('El medio de pago es inválido.');
  }
  const paymentMethod = data.paymentMethod as PaymentMethod;

  if (
    data.notes !== undefined &&
    (typeof data.notes !== 'string' || data.notes.length > MAX_ORDER_NOTES_LENGTH)
  ) {
    invalidArgument('La nota del pedido es demasiado larga.');
  }

  const trimmedEmail =
    typeof customerData.email === 'string' ? customerData.email.trim() : undefined;
  const trimmedAddress =
    typeof customerData.address === 'string' ? customerData.address.trim() : undefined;
  const trimmedNotes = typeof data.notes === 'string' ? data.notes.trim() : undefined;

  return {
    items: [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity })),
    customerName: (customerData.name as string).trim().replace(/\s+/gu, ' '),
    customerPhoneDisplay: (customerData.phone as string).trim(),
    customerPhoneNormalized: phoneNormalized,
    ...(trimmedEmail ? { customerEmail: trimmedEmail } : {}),
    ...(trimmedAddress ? { customerAddress: trimmedAddress } : {}),
    deliveryMethod,
    ...(deliveryZoneId ? { deliveryZoneId } : {}),
    paymentMethod,
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
  };
}

interface DeliveryZoneData {
  id: string;
  name: string;
  cost: number;
  active: boolean;
}

function readDeliveryZones(
  publicSettings: Record<string, unknown> | undefined,
): DeliveryZoneData[] {
  const zones = publicSettings?.deliveryZones;
  if (!Array.isArray(zones)) return [];
  return zones.filter(
    (zone): zone is DeliveryZoneData =>
      typeof zone === 'object' &&
      zone !== null &&
      typeof (zone as Record<string, unknown>).id === 'string' &&
      typeof (zone as Record<string, unknown>).cost === 'number',
  );
}

/**
 * Orquesta la creación del pedido dentro de una única transacción de
 * Firestore: revalida catálogo y stock, recalcula precios y envío desde el
 * servidor, reserva el correlativo anual y actualiza/crea el cliente por
 * teléfono. No confía en ningún monto enviado por el cliente.
 */
export async function createOrderHandler(
  db: Firestore,
  payload: unknown,
): Promise<CreateOrderResult> {
  const request = validateCreateOrderPayload(payload);

  return db.runTransaction(async (transaction: Transaction) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const counterRef = db.doc(`counters/orders-${year}`);
    const publicSettingsRef = db.doc('settings/public');
    const privateSettingsRef = db.doc('settings/private');

    const settingsAndCounterSnaps = await transaction.getAll(
      counterRef,
      publicSettingsRef,
      privateSettingsRef,
    );
    const counterSnap = settingsAndCounterSnaps[0]!;
    const publicSnap = settingsAndCounterSnaps[1]!;
    const privateSnap = settingsAndCounterSnaps[2]!;

    const customerQuery = db
      .collection('customers')
      .where('phoneNormalized', '==', request.customerPhoneNormalized)
      .limit(1);
    const customerQuerySnap = await transaction.get(customerQuery);

    const productRefs = request.items.map((item) => db.doc(`products/${item.productId}`));
    const productSnaps = productRefs.length > 0 ? await transaction.getAll(...productRefs) : [];

    const publicSettings = publicSnap.exists
      ? (publicSnap.data() as Record<string, unknown>)
      : undefined;
    const privateSettings = privateSnap.exists
      ? (privateSnap.data() as Record<string, unknown>)
      : undefined;
    const allowNegativeStock = privateSettings?.allowNegativeStock === true;
    const acceptedPaymentMethods = Array.isArray(publicSettings?.acceptedPaymentMethods)
      ? (publicSettings.acceptedPaymentMethods as string[])
      : [];
    if (!acceptedPaymentMethods.includes(request.paymentMethod)) {
      throw new HttpsError('failed-precondition', 'El medio de pago elegido no está disponible.');
    }

    let deliveryCost = 0;
    if (request.deliveryMethod === 'delivery') {
      if (publicSettings?.deliveryEnabled !== true) {
        throw new HttpsError('failed-precondition', 'El delivery no está disponible.');
      }
      const zones = readDeliveryZones(publicSettings);
      const zone = zones.find((candidate) => candidate.id === request.deliveryZoneId);
      if (!zone || !zone.active) {
        throw new HttpsError('failed-precondition', 'La zona de entrega elegida no existe.');
      }
      deliveryCost = zone.cost;
    } else if (publicSettings?.pickupEnabled !== true) {
      throw new HttpsError('failed-precondition', 'El retiro en local no está disponible.');
    }

    const orderItems: OrderItem[] = [];
    const stockUpdates: { ref: FirebaseFirestore.DocumentReference; newStock: number }[] = [];
    const stockMovements: {
      productId: string;
      quantity: number;
      previousStock: number;
      resultingStock: number;
    }[] = [];

    productSnaps.forEach((snapshot, index) => {
      const item = request.items[index]!;
      if (!snapshot.exists) {
        throw new HttpsError('failed-precondition', 'Uno de los productos ya no existe.');
      }
      const product = snapshot.data() as Record<string, unknown>;
      if (product.active !== true) {
        throw new HttpsError(
          'failed-precondition',
          `El producto "${String(product.name ?? item.productId)}" ya no está disponible.`,
        );
      }
      const trackStock = product.trackStock === true;
      const allowBackorder = product.allowBackorder === true;
      const currentStock = typeof product.stock === 'number' ? product.stock : 0;

      if (trackStock) {
        const resultingStock = currentStock - item.quantity;
        if (!allowBackorder && !allowNegativeStock && resultingStock < 0) {
          throw new HttpsError(
            'failed-precondition',
            `No hay stock suficiente de "${String(product.name ?? item.productId)}".`,
          );
        }
        stockUpdates.push({ ref: snapshot.ref, newStock: resultingStock });
        stockMovements.push({
          productId: item.productId,
          quantity: -item.quantity,
          previousStock: currentStock,
          resultingStock,
        });
      }

      const unitPrice = typeof product.price === 'number' ? product.price : 0;
      orderItems.push({
        productId: item.productId,
        name: typeof product.name === 'string' ? product.name : item.productId,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
      });
    });

    const totals = computeOrderTotals(orderItems, deliveryCost);

    const previousSequence =
      counterSnap.exists && typeof counterSnap.data()?.sequence === 'number'
        ? (counterSnap.data()!.sequence as number)
        : 0;
    const nextSequence = previousSequence + 1;
    const number = formatOrderNumber(year, nextSequence);

    const existingCustomerDoc = customerQuerySnap.empty ? null : customerQuerySnap.docs[0]!;
    const customerRef = existingCustomerDoc
      ? existingCustomerDoc.ref
      : db.collection('customers').doc();
    const existingCustomerData = existingCustomerDoc?.data() as Record<string, unknown> | undefined;
    const previousOrdersCount =
      typeof existingCustomerData?.ordersCount === 'number' ? existingCustomerData.ordersCount : 0;
    const previousTotalSpent =
      typeof existingCustomerData?.totalSpent === 'number' ? existingCustomerData.totalSpent : 0;

    const orderRef = db.collection('orders').doc();
    const eventRef = orderRef.collection('events').doc();

    // ---- Escrituras: a partir de acá no se puede volver a leer. ----

    transaction.set(orderRef, {
      number,
      status: 'pendiente',
      customer: {
        name: request.customerName,
        phoneDisplay: request.customerPhoneDisplay,
        phoneNormalized: request.customerPhoneNormalized,
        ...(request.customerEmail ? { email: request.customerEmail } : {}),
        ...(request.customerAddress ? { address: request.customerAddress } : {}),
      },
      customerId: customerRef.id,
      items: orderItems,
      deliveryMethod: request.deliveryMethod,
      ...(request.deliveryZoneId ? { deliveryZoneId: request.deliveryZoneId } : {}),
      deliveryCost: totals.deliveryCost,
      total: totals.total,
      paymentMethod: request.paymentMethod,
      ...(request.notes ? { notes: request.notes } : {}),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: SYSTEM_ACTOR,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: SYSTEM_ACTOR,
    });

    transaction.set(eventRef, {
      type: 'creado',
      toStatus: 'pendiente',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: SYSTEM_ACTOR,
    });

    transaction.set(counterRef, { sequence: nextSequence });

    transaction.set(customerRef, {
      phoneNormalized: request.customerPhoneNormalized,
      phoneDisplay: request.customerPhoneDisplay,
      name: request.customerName,
      ...(request.customerEmail ? { email: request.customerEmail } : {}),
      ordersCount: previousOrdersCount + 1,
      totalSpent: previousTotalSpent + totals.total,
      lastOrderAt: FieldValue.serverTimestamp(),
    });

    for (const { ref, newStock } of stockUpdates) {
      transaction.update(ref, {
        stock: newStock,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: SYSTEM_ACTOR,
      });
    }
    for (const movement of stockMovements) {
      const movementRef = db.collection('stockMovements').doc();
      transaction.set(movementRef, {
        productId: movement.productId,
        type: 'venta',
        orderId: orderRef.id,
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        resultingStock: movement.resultingStock,
        reason: `Venta — pedido ${number}`,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: SYSTEM_ACTOR,
      });
    }

    return {
      orderId: orderRef.id,
      number,
      status: 'pendiente' as OrderStatus,
      items: orderItems,
      totals,
      deliveryMethod: request.deliveryMethod,
      ...(request.deliveryZoneId ? { deliveryZoneId: request.deliveryZoneId } : {}),
      paymentMethod: request.paymentMethod,
      customer: {
        name: request.customerName,
        phoneDisplay: request.customerPhoneDisplay,
        phoneNormalized: request.customerPhoneNormalized,
        ...(request.customerEmail ? { email: request.customerEmail } : {}),
        ...(request.customerAddress ? { address: request.customerAddress } : {}),
      },
    };
  });
}
