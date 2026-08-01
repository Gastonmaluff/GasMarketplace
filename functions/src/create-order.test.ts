import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createOrderHandler, validateCreateOrderPayload } from './create-order';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT ?? 'gasmarketplace-rules-test';

let app: App;
let db: Firestore;

beforeAll(() => {
  app = initializeApp({ projectId: 'gasmarketplace-rules-test' }, 'create-order-tests');
  db = getFirestore(app);
});

afterAll(async () => {
  await deleteApp(app);
});

async function clearFirestore() {
  const collections = ['products', 'settings', 'counters', 'customers', 'orders', 'stockMovements'];
  for (const name of collections) {
    const snapshot = await db.collection(name).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
}

beforeEach(async () => {
  await clearFirestore();
  await db.doc('settings/public').set({
    pickupEnabled: true,
    deliveryEnabled: true,
    acceptedPaymentMethods: ['cash', 'bank_transfer', 'pay_on_pickup', 'cash_on_delivery'],
    deliveryZones: [
      { id: 'z-local', name: 'Delivery local', cost: 25000, active: true, order: 0 },
      { id: 'z-inactive', name: 'Inactiva', cost: 10000, active: false, order: 1 },
    ],
  });
  await db.doc('settings/private').set({ allowNegativeStock: false });
});

async function seedProduct(id: string, overrides: Record<string, unknown> = {}) {
  await db.doc(`products/${id}`).set({
    name: 'Yerba Mate Selecta',
    active: true,
    price: 25000,
    stock: 10,
    trackStock: true,
    allowBackorder: false,
    ...overrides,
  });
}

const basePayload = () => ({
  items: [{ productId: 'p1', quantity: 2 }],
  customer: { name: 'Ana Gómez', phone: '0981 123 456' },
  deliveryMethod: 'pickup' as const,
  paymentMethod: 'cash' as const,
});

describe('validateCreateOrderPayload', () => {
  it('acepta un payload válido', () => {
    expect(() => validateCreateOrderPayload(basePayload())).not.toThrow();
  });

  it('rechaza sin items', () => {
    expect(() => validateCreateOrderPayload({ ...basePayload(), items: [] })).toThrow();
  });

  it('rechaza cantidad inválida', () => {
    expect(() =>
      validateCreateOrderPayload({ ...basePayload(), items: [{ productId: 'p1', quantity: 0 }] }),
    ).toThrow();
  });

  it('rechaza teléfono inválido', () => {
    expect(() =>
      validateCreateOrderPayload({
        ...basePayload(),
        customer: { name: 'Ana', phone: '123' },
      }),
    ).toThrow();
  });

  it('fusiona líneas duplicadas del mismo producto', () => {
    const result = validateCreateOrderPayload({
      ...basePayload(),
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p1', quantity: 3 },
      ],
    });
    expect(result.items).toEqual([{ productId: 'p1', quantity: 5 }]);
  });

  it('exige deliveryZoneId cuando el método es delivery', () => {
    expect(() =>
      validateCreateOrderPayload({ ...basePayload(), deliveryMethod: 'delivery' }),
    ).toThrow();
  });
});

describe('createOrderHandler', () => {
  it('crea un pedido de retiro en local y descuenta stock', async () => {
    await seedProduct('p1', { stock: 10 });

    const result = await createOrderHandler(db, basePayload());

    expect(result.status).toBe('pendiente');
    expect(result.totals).toEqual({
      itemCount: 2,
      itemsSubtotal: 50000,
      deliveryCost: 0,
      total: 50000,
    });
    expect(result.number).toMatch(/^\d{4}-000001$/);

    const orderSnap = await db.doc(`orders/${result.orderId}`).get();
    expect(orderSnap.exists).toBe(true);
    expect(orderSnap.data()?.status).toBe('pendiente');

    const eventsSnap = await db.collection(`orders/${result.orderId}/events`).get();
    expect(eventsSnap.size).toBe(1);
    expect(eventsSnap.docs[0]?.data().type).toBe('creado');

    const productSnap = await db.doc('products/p1').get();
    expect(productSnap.data()?.stock).toBe(8);

    const movementsSnap = await db
      .collection('stockMovements')
      .where('productId', '==', 'p1')
      .get();
    expect(movementsSnap.size).toBe(1);
    expect(movementsSnap.docs[0]?.data()).toMatchObject({
      type: 'venta',
      quantity: -2,
      previousStock: 10,
      resultingStock: 8,
      orderId: result.orderId,
    });

    const customerSnap = await db
      .collection('customers')
      .where('phoneNormalized', '==', '+595981123456')
      .get();
    expect(customerSnap.size).toBe(1);
    expect(customerSnap.docs[0]?.data()).toMatchObject({ ordersCount: 1, totalSpent: 50000 });
  });

  it('incrementa el correlativo y acumula al mismo cliente en el segundo pedido', async () => {
    await seedProduct('p1', { stock: 10 });

    const first = await createOrderHandler(db, basePayload());
    const second = await createOrderHandler(db, basePayload());

    expect(first.number).toMatch(/-000001$/);
    expect(second.number).toMatch(/-000002$/);

    const customerSnap = await db
      .collection('customers')
      .where('phoneNormalized', '==', '+595981123456')
      .get();
    expect(customerSnap.docs[0]?.data()).toMatchObject({ ordersCount: 2, totalSpent: 100000 });
  });

  it('calcula el costo de envío desde la zona elegida', async () => {
    await seedProduct('p1', { stock: 10 });

    const result = await createOrderHandler(db, {
      ...basePayload(),
      deliveryMethod: 'delivery',
      deliveryZoneId: 'z-local',
    });

    expect(result.totals.deliveryCost).toBe(25000);
    expect(result.totals.total).toBe(75000);
  });

  it('rechaza una zona de entrega inactiva o inexistente', async () => {
    await seedProduct('p1', { stock: 10 });

    await expect(
      createOrderHandler(db, {
        ...basePayload(),
        deliveryMethod: 'delivery',
        deliveryZoneId: 'z-inactive',
      }),
    ).rejects.toThrow();

    await expect(
      createOrderHandler(db, {
        ...basePayload(),
        deliveryMethod: 'delivery',
        deliveryZoneId: 'no-existe',
      }),
    ).rejects.toThrow();
  });

  it('rechaza un producto inactivo', async () => {
    await seedProduct('p1', { active: false });
    await expect(createOrderHandler(db, basePayload())).rejects.toThrow();
  });

  it('rechaza un producto inexistente', async () => {
    await expect(createOrderHandler(db, basePayload())).rejects.toThrow();
  });

  it('rechaza si no hay stock suficiente', async () => {
    await seedProduct('p1', { stock: 1 });
    await expect(createOrderHandler(db, basePayload())).rejects.toThrow();
  });

  it('permite backorder aunque el stock quede negativo', async () => {
    await seedProduct('p1', { stock: 1, allowBackorder: true });
    const result = await createOrderHandler(db, basePayload());
    expect(result.status).toBe('pendiente');
    const productSnap = await db.doc('products/p1').get();
    expect(productSnap.data()?.stock).toBe(-1);
  });

  it('permite stock negativo cuando la configuración lo habilita', async () => {
    await db.doc('settings/private').set({ allowNegativeStock: true });
    await seedProduct('p1', { stock: 1, allowBackorder: false });
    const result = await createOrderHandler(db, basePayload());
    expect(result.status).toBe('pendiente');
  });

  it('rechaza un medio de pago no aceptado por la tienda', async () => {
    await db.doc('settings/public').set({ acceptedPaymentMethods: ['cash'] }, { merge: true });
    await seedProduct('p1', { stock: 10 });
    await expect(
      createOrderHandler(db, { ...basePayload(), paymentMethod: 'bank_transfer' }),
    ).rejects.toThrow();
  });

  it('fusiona líneas duplicadas y descuenta la cantidad combinada', async () => {
    await seedProduct('p1', { stock: 10 });
    const result = await createOrderHandler(db, {
      ...basePayload(),
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p1', quantity: 3 },
      ],
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.quantity).toBe(5);
    const productSnap = await db.doc('products/p1').get();
    expect(productSnap.data()?.stock).toBe(5);
  });
});
