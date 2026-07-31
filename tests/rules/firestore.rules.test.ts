import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'gasmarketplace-rules-test';
const ADMIN_UID = 'admin-user';
const PLAIN_UID = 'plain-user';

let testEnv: RulesTestEnvironment;

function adminDb() {
  return testEnv.authenticatedContext(ADMIN_UID, { admin: true }).firestore();
}
function plainDb() {
  return testEnv.authenticatedContext(PLAIN_UID).firestore();
}
function visitorDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function validCategory(uid: string) {
  return {
    name: 'Bebidas',
    normalizedName: 'bebidas',
    slug: 'bebidas',
    description: '',
    imageUrl: '',
    imagePath: '',
    order: 0,
    active: true,
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

function validSupplier(uid: string) {
  return {
    name: 'Distribuidora Sur',
    normalizedName: 'distribuidora sur',
    contactName: 'Ana',
    phone: '0981 000 000',
    notes: '',
    active: true,
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

function validProduct(uid: string) {
  return {
    name: 'Yerba Mate Selecta 1kg',
    normalizedName: 'yerba mate selecta 1kg',
    slug: 'yerba-mate-selecta-1kg',
    shortDescription: '',
    description: '',
    sku: '',
    barcode: '',
    categoryIds: [],
    primaryCategoryId: '',
    price: 25000,
    compareAtPrice: null,
    stock: 10,
    lowStockThreshold: null,
    trackStock: true,
    allowBackorder: false,
    images: [],
    featured: false,
    active: true,
    searchTokens: ['yerba', 'mate'],
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

function validProductPrivate(uid: string, productId = 'ok') {
  return {
    productId,
    costPrice: 18000,
    supplierId: '',
    supplierName: 'Proveedor demo',
    internalNotes: 'Solo visible para administradores.',
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

const seededTimestamp = Timestamp.fromMillis(1_700_000_000_000);

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('settings', () => {
  it('settings/public se lee públicamente', async () => {
    await seed('settings/public', { storeName: 'GasMarket' });
    await assertSucceeds(getDoc(doc(visitorDb(), 'settings/public')));
  });

  it('settings/private queda bloqueado para visitantes y usuarios sin claim', async () => {
    await seed('settings/private', { allowNegativeStock: false });
    await assertFails(getDoc(doc(visitorDb(), 'settings/private')));
    await assertFails(getDoc(doc(plainDb(), 'settings/private')));
    await assertSucceeds(getDoc(doc(adminDb(), 'settings/private')));
  });

  it('solo un admin escribe settings válidos', async () => {
    const validPublic = {
      storeName: 'GasMarket',
      storeDescription: '',
      whatsappNumberDisplay: '',
      whatsappNumberNormalized: '',
      supportEmail: '',
      address: '',
      city: '',
      country: 'Paraguay',
      currency: 'PYG',
      locale: 'es-PY',
      timezone: 'America/Asuncion',
      pickupEnabled: true,
      deliveryEnabled: false,
      acceptedPaymentMethods: ['cash'],
      deliveryZones: [],
      orderConfirmationMessage: '',
      active: true,
      updatedAt: serverTimestamp(),
      updatedBy: ADMIN_UID,
    };
    await assertSucceeds(setDoc(doc(adminDb(), 'settings/public'), validPublic));
    await assertFails(
      setDoc(doc(plainDb(), 'settings/public'), { ...validPublic, updatedBy: PLAIN_UID }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'settings/public'), { ...validPublic, currency: 'USD' }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'settings/public'), {
        ...validPublic,
        acceptedPaymentMethods: ['cash', 'crypto'],
      }),
    );
    await assertSucceeds(
      setDoc(doc(adminDb(), 'settings/public'), {
        ...validPublic,
        acceptedPaymentMethods: ['cash', 'bank_transfer', 'pay_on_pickup', 'cash_on_delivery'],
      }),
    );
  });
});

describe('categories', () => {
  it('una categoría activa se lee públicamente; una inactiva no', async () => {
    await seed('categories/active-cat', { ...validCategory(ADMIN_UID), active: true });
    await seed('categories/inactive-cat', {
      ...validCategory(ADMIN_UID),
      slug: 'otra',
      active: false,
    });
    await assertSucceeds(getDoc(doc(visitorDb(), 'categories/active-cat')));
    await assertFails(getDoc(doc(visitorDb(), 'categories/inactive-cat')));
    await assertSucceeds(getDoc(doc(adminDb(), 'categories/inactive-cat')));
  });

  it('el listado público exige el filtro active == true', async () => {
    await seed('categories/active-cat', { ...validCategory(ADMIN_UID), active: true });
    await assertSucceeds(
      getDocs(query(collection(visitorDb(), 'categories'), where('active', '==', true))),
    );
    await assertFails(getDocs(collection(visitorDb(), 'categories')));
    await assertSucceeds(getDocs(collection(adminDb(), 'categories')));
  });

  it('visitantes y usuarios sin claim no escriben categorías', async () => {
    await assertFails(setDoc(doc(visitorDb(), 'categories/x'), validCategory('anon')));
    await assertFails(setDoc(doc(plainDb(), 'categories/x'), validCategory(PLAIN_UID)));
  });

  it('un admin crea una categoría válida y no una con esquema inválido', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'categories/ok'), validCategory(ADMIN_UID)));
    await assertFails(
      setDoc(doc(adminDb(), 'categories/extra'), {
        ...validCategory(ADMIN_UID),
        campoExtra: 'malicioso',
      }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'categories/bad-slug'), {
        ...validCategory(ADMIN_UID),
        slug: 'Con Mayúsculas',
      }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'categories/bad-order'), {
        ...validCategory(ADMIN_UID),
        order: 'primero',
      }),
    );
  });

  it('createdAt y createdBy son inmutables en updates', async () => {
    await seed('categories/frozen', {
      ...validCategory(ADMIN_UID),
      createdAt: seededTimestamp,
      updatedAt: seededTimestamp,
    });
    await assertFails(
      setDoc(doc(adminDb(), 'categories/frozen'), {
        ...validCategory(ADMIN_UID),
        createdAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(adminDb(), 'categories/frozen'), {
        ...validCategory(ADMIN_UID),
        createdAt: seededTimestamp,
        name: 'Bebidas frías',
      }),
    );
  });
});

describe('suppliers', () => {
  it('los proveedores son solo administrativos (nunca públicos)', async () => {
    await seed('suppliers/one', validSupplier(ADMIN_UID));
    await assertFails(getDoc(doc(visitorDb(), 'suppliers/one')));
    await assertFails(getDoc(doc(plainDb(), 'suppliers/one')));
    await assertSucceeds(getDoc(doc(adminDb(), 'suppliers/one')));
  });

  it('un admin crea un proveedor válido y no uno con esquema inválido', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'suppliers/ok'), validSupplier(ADMIN_UID)));
    await assertFails(setDoc(doc(plainDb(), 'suppliers/x'), validSupplier(PLAIN_UID)));
    await assertFails(
      setDoc(doc(adminDb(), 'suppliers/extra'), {
        ...validSupplier(ADMIN_UID),
        campoExtra: 'malicioso',
      }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'suppliers/no-name'), { ...validSupplier(ADMIN_UID), name: '' }),
    );
  });
});

describe('products', () => {
  it('un producto activo se lee públicamente; uno inactivo no', async () => {
    await seed('products/active-prod', { ...validProduct(ADMIN_UID), active: true });
    await seed('products/inactive-prod', {
      ...validProduct(ADMIN_UID),
      slug: 'otro',
      active: false,
    });
    await assertSucceeds(getDoc(doc(visitorDb(), 'products/active-prod')));
    await assertFails(getDoc(doc(visitorDb(), 'products/inactive-prod')));
    await assertSucceeds(getDoc(doc(adminDb(), 'products/inactive-prod')));
  });

  it('el listado público exige el filtro active == true', async () => {
    await assertSucceeds(
      getDocs(query(collection(visitorDb(), 'products'), where('active', '==', true))),
    );
    await assertFails(getDocs(collection(visitorDb(), 'products')));
  });

  it('solo un admin escribe productos válidos', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'products/ok'), validProduct(ADMIN_UID)));
    await assertFails(setDoc(doc(plainDb(), 'products/x'), validProduct(PLAIN_UID)));
    await assertFails(
      setDoc(doc(adminDb(), 'products/neg'), { ...validProduct(ADMIN_UID), price: -1 }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'products/private-field'), {
        ...validProduct(ADMIN_UID),
        costPrice: 1000,
      }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'products/cmp'), {
        ...validProduct(ADMIN_UID),
        compareAtPrice: 20000,
      }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'products/primary'), {
        ...validProduct(ADMIN_UID),
        primaryCategoryId: 'no-esta-en-la-lista',
      }),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'products/extra'), {
        ...validProduct(ADMIN_UID),
        campoExtra: true,
      }),
    );
  });

  it('los índices de unicidad son exclusivamente administrativos', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'productSlugs/yerba'), { productId: 'p1' }));
    await assertFails(setDoc(doc(plainDb(), 'productSlugs/otro'), { productId: 'p1' }));
    await assertFails(getDoc(doc(visitorDb(), 'productSlugs/yerba')));
  });

  it('productPrivate es solo administrativo y exige coincidir con el productId', async () => {
    await assertSucceeds(
      setDoc(doc(adminDb(), 'productPrivate/ok'), validProductPrivate(ADMIN_UID, 'ok')),
    );
    await assertFails(getDoc(doc(visitorDb(), 'productPrivate/ok')));
    await assertFails(
      setDoc(doc(plainDb(), 'productPrivate/x'), validProductPrivate(PLAIN_UID, 'x')),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'productPrivate/mismatch'), validProductPrivate(ADMIN_UID, 'otro')),
    );
    await assertFails(
      setDoc(doc(adminDb(), 'productPrivate/extra'), {
        ...validProductPrivate(ADMIN_UID, 'extra'),
        visible: true,
      }),
    );
  });
});

describe('stockMovements', () => {
  const validMovement = {
    productId: 'p1',
    type: 'ajuste',
    quantity: 5,
    previousStock: 10,
    resultingStock: 15,
    reason: 'Recuento físico',
    createdAt: serverTimestamp(),
    createdBy: ADMIN_UID,
  };

  it('un admin crea movimientos consistentes; nadie los edita ni borra', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'stockMovements/m1'), validMovement));
    await assertFails(
      setDoc(doc(adminDb(), 'stockMovements/m2'), { ...validMovement, resultingStock: 99 }),
    );
    await assertFails(setDoc(doc(plainDb(), 'stockMovements/m3'), validMovement));
    await seed('stockMovements/frozen', { ...validMovement, createdAt: seededTimestamp });
    await assertFails(updateDoc(doc(adminDb(), 'stockMovements/frozen'), { reason: 'editado' }));
    await assertFails(deleteDoc(doc(adminDb(), 'stockMovements/frozen')));
  });
});

describe('consultas del storefront', () => {
  it('categoría por slug con active == true se permite; sin active se rechaza', async () => {
    await seed('categories/bebidas', { ...validCategory(ADMIN_UID), slug: 'bebidas' });
    await assertSucceeds(
      getDocs(
        query(
          collection(visitorDb(), 'categories'),
          where('active', '==', true),
          where('slug', '==', 'bebidas'),
        ),
      ),
    );
    await assertFails(
      getDocs(query(collection(visitorDb(), 'categories'), where('slug', '==', 'bebidas'))),
    );
  });

  it('producto por slug con active == true se permite; sin active se rechaza', async () => {
    await seed('products/yerba', { ...validProduct(ADMIN_UID), slug: 'yerba' });
    await assertSucceeds(
      getDocs(
        query(
          collection(visitorDb(), 'products'),
          where('active', '==', true),
          where('slug', '==', 'yerba'),
        ),
      ),
    );
    await assertFails(
      getDocs(query(collection(visitorDb(), 'products'), where('slug', '==', 'yerba'))),
    );
  });

  it('productos por categoría con active == true se permiten; sin active se rechazan', async () => {
    await seed('products/yerba', {
      ...validProduct(ADMIN_UID),
      categoryIds: ['cat-1'],
    });
    await assertSucceeds(
      getDocs(
        query(
          collection(visitorDb(), 'products'),
          where('active', '==', true),
          where('categoryIds', 'array-contains', 'cat-1'),
        ),
      ),
    );
    await assertFails(
      getDocs(
        query(collection(visitorDb(), 'products'), where('categoryIds', 'array-contains', 'cat-1')),
      ),
    );
  });

  it('búsqueda pública por searchTokens exige active == true', async () => {
    await seed('products/yerba', { ...validProduct(ADMIN_UID) });
    await assertSucceeds(
      getDocs(
        query(
          collection(visitorDb(), 'products'),
          where('active', '==', true),
          where('searchTokens', 'array-contains', 'yerba'),
        ),
      ),
    );
    await assertFails(
      getDocs(
        query(
          collection(visitorDb(), 'products'),
          where('searchTokens', 'array-contains', 'yerba'),
        ),
      ),
    );
  });
});

describe('colecciones cerradas', () => {
  it('orders, customers y counters siguen bloqueados incluso para admin', async () => {
    await seed('orders/o1', { status: 'pendiente' });
    await assertFails(getDoc(doc(visitorDb(), 'orders/o1')));
    await assertFails(getDoc(doc(adminDb(), 'orders/o1')));
    await assertFails(setDoc(doc(adminDb(), 'customers/c1'), { name: 'x' }));
    await assertFails(setDoc(doc(adminDb(), 'counters/orders-2026'), { value: 1 }));
  });
});
