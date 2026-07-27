export interface Category {
  id: string;
  name: string;
  normalizedName: string;
  slug: string;
  description: string;
  imageUrl?: string;
  imagePath?: string;
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
