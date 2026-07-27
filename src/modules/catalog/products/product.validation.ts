import { isValidSlug } from '../shared/text';
import {
  MAX_CODE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_PRICE,
  MAX_PRODUCT_CATEGORIES,
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_SHORT_DESCRIPTION_LENGTH,
  MAX_STOCK,
  type EditableProductImage,
  type ProductDraft,
} from './product.types';

export interface ProductValidationOptions {
  allowNegativeStock: boolean;
}

export function validateProductDraft(
  draft: ProductDraft,
  images: readonly EditableProductImage[],
  { allowNegativeStock }: ProductValidationOptions,
): string[] {
  const errors: string[] = [];

  if (draft.name.trim() === '') {
    errors.push('El nombre del producto es obligatorio.');
  }
  if (draft.name.length > MAX_PRODUCT_NAME_LENGTH) {
    errors.push(`El nombre no puede superar ${MAX_PRODUCT_NAME_LENGTH} caracteres.`);
  }
  if (draft.slug === '' || !isValidSlug(draft.slug)) {
    errors.push('El slug debe usar minúsculas, números y guiones.');
  }
  if (draft.shortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH) {
    errors.push(
      `La descripción breve no puede superar ${MAX_SHORT_DESCRIPTION_LENGTH} caracteres.`,
    );
  }
  if (draft.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`);
  }
  if (draft.sku.length > MAX_CODE_LENGTH || draft.barcode.length > MAX_CODE_LENGTH) {
    errors.push(`SKU y código de barras no pueden superar ${MAX_CODE_LENGTH} caracteres.`);
  }

  if (draft.price === null || !Number.isInteger(draft.price) || draft.price < 0) {
    errors.push('El precio debe ser un entero en guaraníes mayor o igual a 0.');
  } else if (draft.price > MAX_PRICE) {
    errors.push('El precio supera el máximo permitido.');
  }

  if (draft.compareAtPrice !== null) {
    if (!Number.isInteger(draft.compareAtPrice) || draft.compareAtPrice <= 0) {
      errors.push('El precio anterior debe ser un entero positivo.');
    } else if (draft.price !== null && draft.compareAtPrice <= draft.price) {
      errors.push('El precio anterior debe ser mayor que el precio actual.');
    }
  }

  if (draft.costPrice !== null && (!Number.isInteger(draft.costPrice) || draft.costPrice < 0)) {
    errors.push('El costo interno debe ser un entero mayor o igual a 0.');
  }

  if (draft.stock === null || !Number.isInteger(draft.stock)) {
    errors.push('El stock debe ser un número entero.');
  } else {
    if (draft.stock < 0 && !allowNegativeStock) {
      errors.push(
        'El stock no puede ser negativo (activá esa opción en Configuración si la necesitás).',
      );
    }
    if (Math.abs(draft.stock) > MAX_STOCK) {
      errors.push('El stock supera el máximo permitido.');
    }
  }

  if (
    draft.lowStockThreshold !== null &&
    (!Number.isInteger(draft.lowStockThreshold) || draft.lowStockThreshold < 0)
  ) {
    errors.push('El umbral de stock bajo debe ser un entero mayor o igual a 0.');
  }

  if (draft.categoryIds.length > MAX_PRODUCT_CATEGORIES) {
    errors.push(`Un producto puede tener como máximo ${MAX_PRODUCT_CATEGORIES} categorías.`);
  }
  if (new Set(draft.categoryIds).size !== draft.categoryIds.length) {
    errors.push('Hay categorías repetidas.');
  }
  if (draft.primaryCategoryId !== '' && !draft.categoryIds.includes(draft.primaryCategoryId)) {
    errors.push('La categoría principal debe estar entre las categorías seleccionadas.');
  }

  errors.push(...validateProductImages(images));

  return errors;
}

export function validateProductImages(images: readonly EditableProductImage[]): string[] {
  const errors: string[] = [];

  if (images.length > MAX_PRODUCT_IMAGES) {
    errors.push(`Un producto puede tener como máximo ${MAX_PRODUCT_IMAGES} imágenes.`);
  }
  if (images.length > 0) {
    const primaryCount = images.filter((image) => image.isPrimary).length;
    if (primaryCount !== 1) {
      errors.push('Debe existir exactamente una imagen principal.');
    }
  }
  for (const image of images) {
    if (image.alt.length > 200) {
      errors.push('El texto alternativo de una imagen es demasiado largo.');
    }
    if (!image.file && !image.url) {
      errors.push('Hay una imagen inválida sin archivo ni URL.');
    }
  }

  return errors;
}

export function isLowStock(
  product: {
    stock: number;
    trackStock: boolean;
    lowStockThreshold?: number;
  },
  defaultThreshold: number,
): boolean {
  if (!product.trackStock) return false;
  const threshold = product.lowStockThreshold ?? defaultThreshold;
  return product.stock <= threshold;
}
