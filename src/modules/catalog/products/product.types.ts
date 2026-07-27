export interface ProductImage {
  id: string;
  url: string;
  path: string;
  alt: string;
  order: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  slug: string;
  shortDescription: string;
  description: string;
  sku?: string;
  barcode?: string;
  categoryIds: string[];
  primaryCategoryId?: string;
  /** Entero en PYG. */
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  trackStock: boolean;
  allowBackorder: boolean;
  images: ProductImage[];
  featured: boolean;
  active: boolean;
  updatedAtMillis?: number;
}

/** Campos editables del formulario; las imágenes viajan aparte. */
export interface ProductDraft {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  sku: string;
  barcode: string;
  categoryIds: string[];
  primaryCategoryId: string;
  price: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number | null;
  lowStockThreshold: number | null;
  trackStock: boolean;
  allowBackorder: boolean;
  featured: boolean;
  active: boolean;
}

/** Imagen en edición: puede ser existente (url/path) o pendiente (file). */
export interface EditableProductImage {
  id: string;
  alt: string;
  isPrimary: boolean;
  url?: string;
  path?: string;
  file?: File;
  previewUrl?: string;
}

export interface StockAdjustmentInput {
  productId: string;
  newStock: number;
  reason: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'ajuste';
  quantity: number;
  previousStock: number;
  resultingStock: number;
  reason: string;
  createdAtMillis?: number;
  createdBy: string;
}

export const MAX_PRODUCT_IMAGES = 10;
export const MAX_PRODUCT_CATEGORIES = 5;
export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_SHORT_DESCRIPTION_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_CODE_LENGTH = 60;
export const MAX_PRICE = 1_000_000_000;
export const MAX_STOCK = 1_000_000;
