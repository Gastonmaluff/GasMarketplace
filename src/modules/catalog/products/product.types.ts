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
  stock: number;
  lowStockThreshold?: number;
  trackStock: boolean;
  allowBackorder: boolean;
  images: ProductImage[];
  featured: boolean;
  active: boolean;
  updatedAtMillis?: number;
}

export interface ProductPrivate {
  productId: string;
  costPrice?: number;
  /** Referencia al proveedor en la colección `suppliers`. */
  supplierId?: string;
  /** Nombre del proveedor denormalizado (snapshot para mostrar aunque se borre). */
  supplierName?: string;
  internalNotes?: string;
  updatedAtMillis?: number;
}

export type AdminProduct = Product & ProductPrivate;

/** Campos editables del formulario; las imagenes viajan aparte. */
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
  supplierId: string;
  supplierName: string;
  internalNotes: string;
  stock: number | null;
  lowStockThreshold: number | null;
  trackStock: boolean;
  allowBackorder: boolean;
  featured: boolean;
  active: boolean;
}

/** Imagen en edicion: puede ser existente (url/path) o pendiente (file). */
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

export type StockMovementType = 'ajuste' | 'venta' | 'anulacion';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  /** Solo presente en movimientos `venta`/`anulacion`, vinculados a un pedido. */
  orderId?: string;
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
export const MAX_PRIVATE_FIELD_LENGTH = 1000;
export const MAX_PRICE = 1_000_000_000;
export const MAX_STOCK = 1_000_000;
