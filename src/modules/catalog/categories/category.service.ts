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
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { normalizeText } from '../../../utils/normalizers/text';
import {
  buildImagePath,
  deleteImageQuietly,
  uploadImage,
  validateImageFile,
} from '../shared/images';
import { CatalogError, getCatalogContext } from '../shared/catalog-context';
import { validateCategoryDraft } from './category.validation';
import type { Category, CategoryDraft } from './category.types';

const MAX_CATEGORIES = 200;

export function toCategory(snapshot: DocumentSnapshot): Category {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name : '',
    normalizedName: typeof data.normalizedName === 'string' ? data.normalizedName : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    description: typeof data.description === 'string' ? data.description : '',
    order: typeof data.order === 'number' ? data.order : 0,
    active: data.active === true,
    ...(typeof data.imageUrl === 'string' && data.imageUrl !== ''
      ? { imageUrl: data.imageUrl }
      : {}),
    ...(typeof data.imagePath === 'string' && data.imagePath !== ''
      ? { imagePath: data.imagePath }
      : {}),
    ...(typeof data.iconUrl === 'string' && data.iconUrl !== '' ? { iconUrl: data.iconUrl } : {}),
    ...(typeof data.iconPath === 'string' && data.iconPath !== ''
      ? { iconPath: data.iconPath }
      : {}),
  };
}

/** Listado administrativo completo (activas e inactivas), ordenado por orden. */
export async function listCategories(): Promise<Category[]> {
  const { database } = getCatalogContext();
  const snapshot = await getDocs(
    query(collection(database, 'categories'), orderBy('order'), limit(MAX_CATEGORIES)),
  );
  return snapshot.docs.map(toCategory);
}

export async function getCategory(categoryId: string): Promise<Category | null> {
  const { database } = getCatalogContext();
  const snapshot = await getDoc(doc(database, 'categories', categoryId));
  return snapshot.exists() ? toCategory(snapshot) : null;
}

interface SaveCategoryInput {
  categoryId?: string;
  draft: CategoryDraft;
  /** Imagen grande nueva a subir; undefined = sin cambios, null = quitar la actual. */
  imageFile?: File | null;
  /** Ícono chico nuevo a subir; undefined = sin cambios, null = quitar el actual. */
  iconFile?: File | null;
  onImageProgress?: (percent: number) => void;
  onIconProgress?: (percent: number) => void;
}

/**
 * Crea o actualiza una categoría garantizando unicidad de slug mediante el
 * índice categorySlugs/{slug} dentro de una transacción. Las imágenes nuevas
 * (grande e ícono) se suben antes de la transacción y se limpian si Firestore
 * falla; las anteriores se borran solo después de guardar con éxito.
 */
export async function saveCategory({
  categoryId,
  draft,
  imageFile,
  iconFile,
  onImageProgress,
  onIconProgress,
}: SaveCategoryInput): Promise<string> {
  const errors = validateCategoryDraft(draft);
  if (errors.length > 0) throw new CatalogError(errors);

  const { database, storage, uid } = getCatalogContext();
  const categoryRef = categoryId
    ? doc(database, 'categories', categoryId)
    : doc(collection(database, 'categories'));

  let uploadedImage: { url: string; path: string } | undefined;
  let uploadedIcon: { url: string; path: string } | undefined;
  try {
    if (imageFile) {
      const fileError = validateImageFile(imageFile);
      if (fileError) throw new CatalogError([fileError]);
      uploadedImage = await uploadImage(
        storage,
        buildImagePath(`categories/${categoryRef.id}`, imageFile),
        imageFile,
        onImageProgress,
      );
    }
    if (iconFile) {
      const fileError = validateImageFile(iconFile);
      if (fileError) throw new CatalogError([fileError]);
      uploadedIcon = await uploadImage(
        storage,
        buildImagePath(`categories/${categoryRef.id}`, iconFile),
        iconFile,
        onIconProgress,
      );
    }
  } catch (error) {
    if (uploadedImage) await deleteImageQuietly(storage, uploadedImage.path);
    if (uploadedIcon) await deleteImageQuietly(storage, uploadedIcon.path);
    throw error;
  }

  let previousImagePath: string | undefined;
  let previousIconPath: string | undefined;
  try {
    await runTransaction(database, async (transaction) => {
      const slugRef = doc(database, 'categorySlugs', draft.slug);
      const [slugSnapshot, existingSnapshot] = await Promise.all([
        transaction.get(slugRef),
        categoryId ? transaction.get(categoryRef) : Promise.resolve(null),
      ]);

      if (slugSnapshot.exists() && slugSnapshot.data().categoryId !== categoryRef.id) {
        throw new CatalogError(['Ya existe una categoría con ese slug.']);
      }
      if (categoryId && !existingSnapshot?.exists()) {
        throw new CatalogError(['La categoría que intentás editar ya no existe.']);
      }

      const existing = existingSnapshot?.data() ?? {};
      const previousSlug = typeof existing.slug === 'string' ? existing.slug : undefined;
      const currentImageUrl = typeof existing.imageUrl === 'string' ? existing.imageUrl : '';
      const currentImagePath = typeof existing.imagePath === 'string' ? existing.imagePath : '';
      const currentIconUrl = typeof existing.iconUrl === 'string' ? existing.iconUrl : '';
      const currentIconPath = typeof existing.iconPath === 'string' ? existing.iconPath : '';

      const nextImage = uploadedImage
        ? uploadedImage
        : imageFile === null
          ? { url: '', path: '' }
          : { url: currentImageUrl, path: currentImagePath };
      if (currentImagePath && nextImage.path !== currentImagePath) {
        previousImagePath = currentImagePath;
      }

      const nextIcon = uploadedIcon
        ? uploadedIcon
        : iconFile === null
          ? { url: '', path: '' }
          : { url: currentIconUrl, path: currentIconPath };
      if (currentIconPath && nextIcon.path !== currentIconPath) {
        previousIconPath = currentIconPath;
      }

      transaction.set(categoryRef, {
        name: draft.name.trim().replace(/\s+/gu, ' '),
        normalizedName: normalizeText(draft.name, 'lowercase'),
        slug: draft.slug,
        description: draft.description.trim(),
        imageUrl: nextImage.url,
        imagePath: nextImage.path,
        iconUrl: nextIcon.url,
        iconPath: nextIcon.path,
        order: draft.order,
        active: draft.active,
        createdAt: categoryId ? existing.createdAt : serverTimestamp(),
        createdBy: categoryId ? existing.createdBy : uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
      transaction.set(slugRef, { categoryId: categoryRef.id });
      if (previousSlug && previousSlug !== draft.slug) {
        transaction.delete(doc(database, 'categorySlugs', previousSlug));
      }
    });
  } catch (error) {
    if (uploadedImage) await deleteImageQuietly(storage, uploadedImage.path);
    if (uploadedIcon) await deleteImageQuietly(storage, uploadedIcon.path);
    throw error;
  }

  if (previousImagePath) await deleteImageQuietly(storage, previousImagePath);
  if (previousIconPath) await deleteImageQuietly(storage, previousIconPath);

  return categoryRef.id;
}

export async function setCategoryActive(categoryId: string, active: boolean): Promise<void> {
  const { database, uid } = getCatalogContext();
  await runTransaction(database, async (transaction) => {
    const categoryRef = doc(database, 'categories', categoryId);
    const snapshot = await transaction.get(categoryRef);
    if (!snapshot.exists()) throw new CatalogError(['La categoría ya no existe.']);
    transaction.update(categoryRef, { active, updatedAt: serverTimestamp(), updatedBy: uid });
  });
}

export async function countProductsInCategory(categoryId: string): Promise<number> {
  const { database } = getCatalogContext();
  const snapshot = await getDocs(
    query(
      collection(database, 'products'),
      where('categoryIds', 'array-contains', categoryId),
      limit(1),
    ),
  );
  return snapshot.size;
}

/**
 * Eliminación física, permitida solo sin productos asociados. Borra el índice
 * de slug en la misma transacción y la imagen de Storage después del éxito.
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  const { database, storage } = getCatalogContext();

  const productsUsingCategory = await countProductsInCategory(categoryId);
  if (productsUsingCategory > 0) {
    throw new CatalogError([
      'La categoría tiene productos asociados. Desactivala o reasigná los productos antes de eliminarla.',
    ]);
  }

  let imagePath = '';
  await runTransaction(database, async (transaction) => {
    const categoryRef = doc(database, 'categories', categoryId);
    const snapshot = await transaction.get(categoryRef);
    if (!snapshot.exists()) throw new CatalogError(['La categoría ya no existe.']);
    const data = snapshot.data();
    imagePath = typeof data.imagePath === 'string' ? data.imagePath : '';
    const slug = typeof data.slug === 'string' ? data.slug : '';
    transaction.delete(categoryRef);
    if (slug) transaction.delete(doc(database, 'categorySlugs', slug));
  });

  if (imagePath) {
    await deleteImageQuietly(storage, imagePath);
  }
}
