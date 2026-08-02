export interface Category {
  id: string;
  name: string;
  normalizedName: string;
  slug: string;
  description: string;
  /** Imagen grande de la categoría (tarjetas del home y cabecera). */
  imageUrl?: string;
  imagePath?: string;
  /** Ícono chico subido por el admin, usado en el menú desplegable del storefront. */
  iconUrl?: string;
  iconPath?: string;
  order: number;
  active: boolean;
}

export interface CategoryDraft {
  name: string;
  slug: string;
  description: string;
  order: number;
  active: boolean;
}

export const MAX_CATEGORY_NAME_LENGTH = 80;
export const MAX_CATEGORY_DESCRIPTION_LENGTH = 500;
