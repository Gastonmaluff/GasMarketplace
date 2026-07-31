import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { normalizeText } from '../../../utils/normalizers/text';
import { CatalogError, getCatalogContext, toCatalogError } from '../shared/catalog-context';
import { validateSupplierDraft } from './supplier.validation';
import type { Supplier, SupplierDraft } from './supplier.types';

const MAX_SUPPLIERS = 300;

export function toSupplier(snapshot: DocumentSnapshot): Supplier {
  const data = snapshot.data() ?? {};
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name : '',
    normalizedName: typeof data.normalizedName === 'string' ? data.normalizedName : '',
    active: data.active === true,
    ...(typeof data.contactName === 'string' && data.contactName !== ''
      ? { contactName: data.contactName }
      : {}),
    ...(typeof data.phone === 'string' && data.phone !== '' ? { phone: data.phone } : {}),
    ...(typeof data.notes === 'string' && data.notes !== '' ? { notes: data.notes } : {}),
    ...(updatedAt && typeof updatedAt.toMillis === 'function'
      ? { updatedAtMillis: updatedAt.toMillis() }
      : {}),
  };
}

/** Listado administrativo completo (activos e inactivos), ordenado por nombre. */
export async function listSuppliers(): Promise<Supplier[]> {
  try {
    const { database } = getCatalogContext();
    const snapshot = await getDocs(
      query(collection(database, 'suppliers'), orderBy('normalizedName'), limit(MAX_SUPPLIERS)),
    );
    return snapshot.docs.map(toSupplier);
  } catch (cause) {
    throw toCatalogError(cause, 'No se pudieron cargar los proveedores.');
  }
}

export async function getSupplier(supplierId: string): Promise<Supplier | null> {
  const { database } = getCatalogContext();
  const snapshot = await getDoc(doc(database, 'suppliers', supplierId));
  return snapshot.exists() ? toSupplier(snapshot) : null;
}

interface SaveSupplierInput {
  supplierId?: string;
  draft: SupplierDraft;
}

/** Crea o actualiza un proveedor. No usa índice de unicidad: los nombres pueden repetirse. */
export async function saveSupplier({ supplierId, draft }: SaveSupplierInput): Promise<string> {
  const errors = validateSupplierDraft(draft);
  if (errors.length > 0) throw new CatalogError(errors);

  const { database, uid } = getCatalogContext();
  const supplierRef = supplierId
    ? doc(database, 'suppliers', supplierId)
    : doc(collection(database, 'suppliers'));

  try {
    await runTransaction(database, async (transaction) => {
      const existingSnapshot = supplierId ? await transaction.get(supplierRef) : null;
      if (supplierId && !existingSnapshot?.exists()) {
        throw new CatalogError(['El proveedor que intentás editar ya no existe.']);
      }
      const existing = existingSnapshot?.data() ?? {};

      transaction.set(supplierRef, {
        name: draft.name.trim().replace(/\s+/gu, ' '),
        normalizedName: normalizeText(draft.name, 'lowercase'),
        contactName: draft.contactName.trim(),
        phone: draft.phone.trim(),
        notes: draft.notes.trim(),
        active: draft.active,
        createdAt: supplierId ? (existing.createdAt ?? serverTimestamp()) : serverTimestamp(),
        createdBy: supplierId ? (existing.createdBy ?? uid) : uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    });
  } catch (cause) {
    throw toCatalogError(cause, 'No se pudo guardar el proveedor.');
  }

  return supplierRef.id;
}

export async function setSupplierActive(supplierId: string, active: boolean): Promise<void> {
  const { database, uid } = getCatalogContext();
  await runTransaction(database, async (transaction) => {
    const supplierRef = doc(database, 'suppliers', supplierId);
    const snapshot = await transaction.get(supplierRef);
    if (!snapshot.exists()) throw new CatalogError(['El proveedor ya no existe.']);
    transaction.update(supplierRef, { active, updatedAt: serverTimestamp(), updatedBy: uid });
  });
}

/**
 * Eliminación física. Los productos guardan el nombre del proveedor como
 * snapshot en `productPrivate`, así que borrar el proveedor no rompe su
 * visualización; solo deja de estar disponible para nuevas asignaciones.
 */
export async function deleteSupplier(supplierId: string): Promise<void> {
  const { database } = getCatalogContext();
  await runTransaction(database, async (transaction) => {
    const supplierRef = doc(database, 'suppliers', supplierId);
    const snapshot = await transaction.get(supplierRef);
    if (!snapshot.exists()) throw new CatalogError(['El proveedor ya no existe.']);
    transaction.delete(supplierRef);
  });
}
