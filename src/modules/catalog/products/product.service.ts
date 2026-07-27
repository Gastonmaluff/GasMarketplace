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
  type DocumentReference,
  type DocumentSnapshot,
  type Timestamp,
  type Transaction,
} from 'firebase/firestore';

import { normalizeText } from '../../../utils/normalizers/text';
import { buildSearchTokens, normalizeCode } from '../shared/text';
import {
  buildImagePath,
  deleteImageQuietly,
  uploadImage,
  validateImageFile,
  type StoredImage,
} from '../shared/images';
import { CatalogError, getCatalogContext } from '../shared/catalog-context';
import { validateProductDraft } from './product.validation';
import type {
  EditableProductImage,
  Product,
  ProductDraft,
  ProductImage,
  StockAdjustmentInput,
  StockMovement,
} from './product.types';

const MAX_PRODUCTS = 300;
const MAX_MOVEMENTS = 20;

function toProduct(snapshot: DocumentSnapshot): Product {
  const data = snapshot.data() ?? {};
  const images = Array.isArray(data.images)
    ? data.images.filter(
        (image): image is ProductImage =>
          typeof image === 'object' && image !== null && typeof image.url === 'string',
      )
    : [];
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name : '',
    normalizedName: typeof data.normalizedName === 'string' ? data.normalizedName : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    shortDescription: typeof data.shortDescription === 'string' ? data.shortDescription : '',
    description: typeof data.description === 'string' ? data.description : '',
    categoryIds: Array.isArray(data.categoryIds)
      ? data.categoryIds.filter((id): id is string => typeof id === 'string')
      : [],
    price: typeof data.price === 'number' ? data.price : 0,
    stock: typeof data.stock === 'number' ? data.stock : 0,
    trackStock: data.trackStock === true,
    allowBackorder: data.allowBackorder === true,
    images,
    featured: data.featured === true,
    active: data.active === true,
    ...(typeof data.sku === 'string' && data.sku !== '' ? { sku: data.sku } : {}),
    ...(typeof data.barcode === 'string' && data.barcode !== '' ? { barcode: data.barcode } : {}),
    ...(typeof data.primaryCategoryId === 'string' && data.primaryCategoryId !== ''
      ? { primaryCategoryId: data.primaryCategoryId }
      : {}),
    ...(typeof data.compareAtPrice === 'number' ? { compareAtPrice: data.compareAtPrice } : {}),
    ...(typeof data.costPrice === 'number' ? { costPrice: data.costPrice } : {}),
    ...(typeof data.lowStockThreshold === 'number'
      ? { lowStockThreshold: data.lowStockThreshold }
      : {}),
    ...(updatedAt && typeof updatedAt.toMillis === 'function'
      ? { updatedAtMillis: updatedAt.toMillis() }
      : {}),
  };
}

/** Listado administrativo completo, ordenado por última actualización. */
export async function listProducts(): Promise<Product[]> {
  const { database } = getCatalogContext();
  const snapshot = await getDocs(
    query(collection(database, 'products'), orderBy('updatedAt', 'desc'), queryLimit(MAX_PRODUCTS)),
  );
  return snapshot.docs.map(toProduct);
}

export async function getProduct(productId: string): Promise<Product | null> {
  const { database } = getCatalogContext();
  const snapshot = await getDoc(doc(database, 'products', productId));
  return snapshot.exists() ? toProduct(snapshot) : null;
}

async function readAllowNegativeStock(): Promise<boolean> {
  const { database } = getCatalogContext();
  const snapshot = await getDoc(doc(database, 'settings', 'private'));
  return snapshot.exists() && snapshot.data().allowNegativeStock === true;
}

interface UniquenessSpec {
  collectionName: 'productSlugs' | 'productSkus' | 'productBarcodes';
  value: string;
  previousValue: string;
  conflictMessage: string;
}

/**
 * Reserva de unicidad dentro de la transacción: verifica el índice, lo crea
 * para el valor nuevo y libera el anterior cuando cambió. Valores vacíos no
 * crean índice.
 */
async function reserveUnique(
  transaction: Transaction,
  productRef: DocumentReference,
  spec: UniquenessSpec,
): Promise<() => void> {
  const { collectionName, value, previousValue, conflictMessage } = spec;
  const nextRef = value ? doc(productRef.firestore, collectionName, value) : null;

  if (nextRef && value !== previousValue) {
    const existing = await transaction.get(nextRef);
    if (existing.exists() && existing.data().productId !== productRef.id) {
      throw new CatalogError([conflictMessage]);
    }
  }

  return () => {
    if (nextRef) transaction.set(nextRef, { productId: productRef.id });
    if (previousValue && previousValue !== value) {
      transaction.delete(doc(productRef.firestore, collectionName, previousValue));
    }
  };
}

interface SaveProductInput {
  productId?: string;
  draft: ProductDraft;
  images: EditableProductImage[];
  onImageProgress?: (imageId: string, percent: number) => void;
}

/**
 * Crea o actualiza un producto. Unicidad de slug/SKU/barcode mediante
 * documentos índice transaccionales; imágenes nuevas se suben antes y se
 * limpian si Firestore falla; las reemplazadas se borran tras el éxito.
 * searchTokens se generan siempre acá, nunca se aceptan del formulario.
 */
export async function saveProduct({
  productId,
  draft,
  images,
  onImageProgress,
}: SaveProductInput): Promise<string> {
  const allowNegativeStock = await readAllowNegativeStock().catch(() => false);
  const errors = validateProductDraft(draft, images, { allowNegativeStock });
  if (errors.length > 0) throw new CatalogError(errors);

  const { database, storage, uid } = getCatalogContext();
  const productRef = productId
    ? doc(database, 'products', productId)
    : doc(collection(database, 'products'));

  const sku = normalizeCode(draft.sku);
  const barcode = normalizeCode(draft.barcode);

  const uploaded = new Map<string, StoredImage>();
  for (const image of images) {
    if (!image.file) continue;
    const fileError = validateImageFile(image.file);
    if (fileError) throw new CatalogError([fileError]);
    const stored = await uploadImage(
      storage,
      buildImagePath(`products/${productRef.id}`, image.file),
      image.file,
      (percent) => onImageProgress?.(image.id, percent),
    );
    uploaded.set(image.id, stored);
  }

  const finalImages: ProductImage[] = images.map((image, index) => {
    const stored = uploaded.get(image.id);
    return {
      id: image.id,
      url: stored?.url ?? image.url ?? '',
      path: stored?.path ?? image.path ?? '',
      alt: image.alt.trim(),
      order: index,
      isPrimary: image.isPrimary,
    };
  });

  const obsoletePaths: string[] = [];
  try {
    await runTransaction(database, async (transaction) => {
      const existingSnapshot = productId ? await transaction.get(productRef) : null;
      if (productId && !existingSnapshot?.exists()) {
        throw new CatalogError(['El producto que intentás editar ya no existe.']);
      }
      const existing = existingSnapshot?.data() ?? {};
      const previousSlug = typeof existing.slug === 'string' ? existing.slug : '';
      const previousSku = typeof existing.sku === 'string' ? existing.sku : '';
      const previousBarcode = typeof existing.barcode === 'string' ? existing.barcode : '';

      for (const categoryId of draft.categoryIds) {
        const categorySnapshot = await transaction.get(doc(database, 'categories', categoryId));
        if (!categorySnapshot.exists()) {
          throw new CatalogError(['Una de las categorías seleccionadas ya no existe.']);
        }
      }

      const commitSlug = await reserveUnique(transaction, productRef, {
        collectionName: 'productSlugs',
        value: draft.slug,
        previousValue: previousSlug,
        conflictMessage: 'Ya existe un producto con ese slug.',
      });
      const commitSku = await reserveUnique(transaction, productRef, {
        collectionName: 'productSkus',
        value: sku,
        previousValue: previousSku ? normalizeCode(previousSku) : '',
        conflictMessage: 'Ya existe un producto con ese SKU.',
      });
      const commitBarcode = await reserveUnique(transaction, productRef, {
        collectionName: 'productBarcodes',
        value: barcode,
        previousValue: previousBarcode ? normalizeCode(previousBarcode) : '',
        conflictMessage: 'Ya existe un producto con ese código de barras.',
      });

      const previousImages: ProductImage[] = Array.isArray(existing.images)
        ? (existing.images as ProductImage[])
        : [];
      const finalPaths = new Set(finalImages.map((image) => image.path));
      for (const image of previousImages) {
        if (image.path && !finalPaths.has(image.path)) obsoletePaths.push(image.path);
      }

      transaction.set(productRef, {
        name: draft.name.trim().replace(/\s+/gu, ' '),
        normalizedName: normalizeText(draft.name, 'lowercase'),
        slug: draft.slug,
        shortDescription: draft.shortDescription.trim(),
        description: draft.description.trim(),
        sku,
        barcode,
        categoryIds: draft.categoryIds,
        primaryCategoryId: draft.primaryCategoryId,
        price: draft.price,
        compareAtPrice: draft.compareAtPrice,
        costPrice: draft.costPrice,
        stock: draft.stock,
        lowStockThreshold: draft.lowStockThreshold,
        trackStock: draft.trackStock,
        allowBackorder: draft.allowBackorder,
        images: finalImages,
        featured: draft.featured,
        active: draft.active,
        searchTokens: buildSearchTokens([draft.name, sku, barcode]),
        createdAt: productId ? existing.createdAt : serverTimestamp(),
        createdBy: productId ? existing.createdBy : uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
      commitSlug();
      commitSku();
      commitBarcode();
    });
  } catch (error) {
    for (const stored of uploaded.values()) {
      await deleteImageQuietly(storage, stored.path);
    }
    throw error;
  }

  for (const path of obsoletePaths) {
    await deleteImageQuietly(storage, path);
  }

  return productRef.id;
}

export async function setProductActive(productId: string, active: boolean): Promise<void> {
  const { database, uid } = getCatalogContext();
  await runTransaction(database, async (transaction) => {
    const productRef = doc(database, 'products', productId);
    const snapshot = await transaction.get(productRef);
    if (!snapshot.exists()) throw new CatalogError(['El producto ya no existe.']);
    transaction.update(productRef, { active, updatedAt: serverTimestamp(), updatedBy: uid });
  });
}

/**
 * Contrato de verificación previa a la eliminación. Los pedidos todavía no
 * existen: cuando se implementen, este chequeo debe consultar si algún pedido
 * referencia al producto y denegar la eliminación física en ese caso.
 */
export async function canDeleteProduct(productId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  void productId;
  return { allowed: true };
}

/**
 * Eliminación física controlada: libera los índices de unicidad en la misma
 * transacción y borra las imágenes de Storage solo tras el éxito. Firestore y
 * Storage no comparten transacciones: si el borrado de archivos falla, quedan
 * huérfanos inofensivos (se documenta como límite conocido).
 */
export async function deleteProduct(productId: string): Promise<void> {
  const { database, storage } = getCatalogContext();

  const gate = await canDeleteProduct(productId);
  if (!gate.allowed) {
    throw new CatalogError([gate.reason ?? 'El producto no se puede eliminar.']);
  }

  const imagePaths: string[] = [];
  await runTransaction(database, async (transaction) => {
    const productRef = doc(database, 'products', productId);
    const snapshot = await transaction.get(productRef);
    if (!snapshot.exists()) throw new CatalogError(['El producto ya no existe.']);
    const data = snapshot.data();

    if (Array.isArray(data.images)) {
      for (const image of data.images) {
        if (typeof image?.path === 'string' && image.path !== '') imagePaths.push(image.path);
      }
    }
    transaction.delete(productRef);
    if (typeof data.slug === 'string' && data.slug !== '') {
      transaction.delete(doc(database, 'productSlugs', data.slug));
    }
    if (typeof data.sku === 'string' && data.sku !== '') {
      transaction.delete(doc(database, 'productSkus', normalizeCode(data.sku)));
    }
    if (typeof data.barcode === 'string' && data.barcode !== '') {
      transaction.delete(doc(database, 'productBarcodes', normalizeCode(data.barcode)));
    }
  });

  for (const path of imagePaths) {
    await deleteImageQuietly(storage, path);
  }
}

/**
 * Ajuste manual de stock: el nuevo stock y el movimiento se escriben en la
 * misma transacción, con previousStock/resultingStock consistentes.
 */
export async function adjustStock({
  productId,
  newStock,
  reason,
}: StockAdjustmentInput): Promise<void> {
  if (!Number.isInteger(newStock)) {
    throw new CatalogError(['El stock debe ser un número entero.']);
  }
  if (reason.trim() === '') {
    throw new CatalogError(['Indicá el motivo del ajuste.']);
  }

  const { database, uid } = getCatalogContext();
  await runTransaction(database, async (transaction) => {
    const productRef = doc(database, 'products', productId);
    const settingsRef = doc(database, 'settings', 'private');
    const [productSnapshot, settingsSnapshot] = await Promise.all([
      transaction.get(productRef),
      transaction.get(settingsRef),
    ]);
    if (!productSnapshot.exists()) throw new CatalogError(['El producto ya no existe.']);

    const allowNegativeStock =
      settingsSnapshot.exists() && settingsSnapshot.data().allowNegativeStock === true;
    if (newStock < 0 && !allowNegativeStock) {
      throw new CatalogError(['El stock no puede quedar negativo según la configuración actual.']);
    }

    const previousStock =
      typeof productSnapshot.data().stock === 'number' ? productSnapshot.data().stock : 0;
    const quantity = newStock - previousStock;
    if (quantity === 0) {
      throw new CatalogError(['El stock nuevo es igual al actual; no hay nada que ajustar.']);
    }

    transaction.update(productRef, {
      stock: newStock,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    transaction.set(doc(collection(database, 'stockMovements')), {
      productId,
      type: 'ajuste',
      quantity,
      previousStock,
      resultingStock: newStock,
      reason: reason.trim(),
      createdAt: serverTimestamp(),
      createdBy: uid,
    });
  });
}

export async function listStockMovements(productId: string): Promise<StockMovement[]> {
  const { database } = getCatalogContext();
  const snapshot = await getDocs(
    query(
      collection(database, 'stockMovements'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      queryLimit(MAX_MOVEMENTS),
    ),
  );
  return snapshot.docs.map((movement) => {
    const data = movement.data();
    const createdAt = data.createdAt as Timestamp | undefined;
    return {
      id: movement.id,
      productId: typeof data.productId === 'string' ? data.productId : '',
      type: 'ajuste',
      quantity: typeof data.quantity === 'number' ? data.quantity : 0,
      previousStock: typeof data.previousStock === 'number' ? data.previousStock : 0,
      resultingStock: typeof data.resultingStock === 'number' ? data.resultingStock : 0,
      reason: typeof data.reason === 'string' ? data.reason : '',
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
      ...(createdAt && typeof createdAt.toMillis === 'function'
        ? { createdAtMillis: createdAt.toMillis() }
        : {}),
    };
  });
}
