import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { buildSearchTokens } from '../shared/text';
import { getPublicCatalogDatabase } from '../shared/catalog-context';
import { toCategory } from '../categories/category.service';
import { toProduct } from '../products/product.service';
import type { Category } from '../categories/category.types';
import type { Product } from '../products/product.types';

/**
 * Consultas públicas del storefront. Todas incluyen `active == true`: las
 * Security Rules rechazan (no filtran) cualquier consulta que pueda devolver
 * documentos inactivos, así que el filtro es obligatorio incluso para una
 * lectura por slug o por ID.
 */

export type ProductSort = 'featured' | 'recent' | 'price-asc' | 'price-desc' | 'name-asc';

export const DEFAULT_PAGE_SIZE = 24;
const MAX_ACTIVE_CATEGORIES = 100;
const MAX_SEARCH_RESULTS = 48;

export interface ProductPage {
  products: Product[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/** Categorías activas ordenadas para la home y la navegación. */
export async function listActiveCategories(): Promise<Category[]> {
  const database = getPublicCatalogDatabase();
  const snapshot = await getDocs(
    query(
      collection(database, 'categories'),
      where('active', '==', true),
      orderBy('order'),
      queryLimit(MAX_ACTIVE_CATEGORIES),
    ),
  );
  return snapshot.docs.map(toCategory);
}

/** Categoría pública por slug (única). Devuelve null si no existe o está inactiva. */
export async function getActiveCategoryBySlug(slug: string): Promise<Category | null> {
  const database = getPublicCatalogDatabase();
  const snapshot = await getDocs(
    query(
      collection(database, 'categories'),
      where('active', '==', true),
      where('slug', '==', slug),
      queryLimit(1),
    ),
  );
  const doc = snapshot.docs[0];
  return doc ? toCategory(doc) : null;
}

// Firestore agrega __name__ ascendente como desempate implícito, suficiente
// para un orden total estable con paginación por cursor.
function sortConstraints(sort: ProductSort): QueryConstraint[] {
  switch (sort) {
    case 'price-asc':
      return [orderBy('price', 'asc')];
    case 'price-desc':
      return [orderBy('price', 'desc')];
    case 'name-asc':
      return [orderBy('normalizedName', 'asc')];
    case 'featured':
      return [orderBy('featured', 'desc'), orderBy('updatedAt', 'desc')];
    case 'recent':
    default:
      return [orderBy('updatedAt', 'desc')];
  }
}

export interface ProductQueryOptions {
  categoryId?: string;
  featuredOnly?: boolean;
  sort?: ProductSort;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot | null;
}

/**
 * Página de productos activos con filtros y orden. Usa paginación por cursor
 * (`startAfter`), no offset. `hasMore` se calcula pidiendo un elemento extra.
 */
export async function listActiveProducts({
  categoryId,
  featuredOnly = false,
  sort = 'featured',
  pageSize = DEFAULT_PAGE_SIZE,
  cursor = null,
}: ProductQueryOptions = {}): Promise<ProductPage> {
  const database = getPublicCatalogDatabase();
  const constraints: QueryConstraint[] = [where('active', '==', true)];

  if (categoryId) {
    constraints.push(where('categoryIds', 'array-contains', categoryId));
  }
  if (featuredOnly) {
    constraints.push(where('featured', '==', true));
  }
  constraints.push(...sortConstraints(sort));
  if (cursor) {
    constraints.push(startAfter(cursor));
  }
  constraints.push(queryLimit(pageSize + 1));

  const snapshot = await getDocs(query(collection(database, 'products'), ...constraints));
  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    products: pageDocs.map(toProduct),
    cursor: pageDocs.length > 0 ? (pageDocs[pageDocs.length - 1] ?? null) : null,
    hasMore,
  };
}

/** Producto público por slug (único). Devuelve null si no existe o está inactivo. */
export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const database = getPublicCatalogDatabase();
  const snapshot = await getDocs(
    query(
      collection(database, 'products'),
      where('active', '==', true),
      where('slug', '==', slug),
      queryLimit(1),
    ),
  );
  const doc = snapshot.docs[0];
  return doc ? toProduct(doc) : null;
}

/**
 * Producto público por ID, para revalidar el carrito antes del checkout.
 * Devuelve null si no existe, está inactivo (las reglas deniegan la lectura
 * en ese caso) o la lectura falla por cualquier otro motivo.
 */
export async function getActiveProductById(productId: string): Promise<Product | null> {
  const database = getPublicCatalogDatabase();
  try {
    const snapshot = await getDoc(doc(database, 'products', productId));
    return snapshot.exists() ? toProduct(snapshot) : null;
  } catch {
    return null;
  }
}

/**
 * Búsqueda MVP sobre `searchTokens` (no es full-text). Usa el primer token
 * normalizado del término con `array-contains`. Devuelve [] si el término
 * queda vacío tras normalizar.
 */
export async function searchActiveProducts(term: string): Promise<Product[]> {
  const tokens = buildSearchTokens([term]);
  const firstToken = tokens[0];
  if (!firstToken) return [];

  const database = getPublicCatalogDatabase();
  const snapshot = await getDocs(
    query(
      collection(database, 'products'),
      where('active', '==', true),
      where('searchTokens', 'array-contains', firstToken),
      orderBy('updatedAt', 'desc'),
      queryLimit(MAX_SEARCH_RESULTS),
    ),
  );
  return snapshot.docs.map(toProduct);
}

/** Productos relacionados: mismos criterios de categoría, excluyendo el actual. */
export async function listRelatedProducts(product: Product, max = 4): Promise<Product[]> {
  const categoryId = product.primaryCategoryId ?? product.categoryIds[0];
  if (!categoryId) return [];

  const page = await listActiveProducts({
    categoryId,
    sort: 'featured',
    pageSize: max + 1,
  });
  return page.products.filter((candidate) => candidate.id !== product.id).slice(0, max);
}
