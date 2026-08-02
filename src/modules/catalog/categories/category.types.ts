import type { IconName } from '../../../components/ui/Icon';

/** Íconos disponibles para representar una categoría en el menú desplegable del storefront. */
export const CATEGORY_ICON_OPTIONS = [
  'box',
  'drink',
  'spray',
  'snack',
  'toy',
  'paw',
  'sparkle',
  'home',
  'monitor',
  'baby',
  'tag',
] as const satisfies readonly IconName[];

export type CategoryIcon = (typeof CATEGORY_ICON_OPTIONS)[number];

export interface Category {
  id: string;
  name: string;
  normalizedName: string;
  slug: string;
  description: string;
  imageUrl?: string;
  imagePath?: string;
  icon?: CategoryIcon;
  order: number;
  active: boolean;
}

export interface CategoryDraft {
  name: string;
  slug: string;
  description: string;
  icon: CategoryIcon | '';
  order: number;
  active: boolean;
}

export const MAX_CATEGORY_NAME_LENGTH = 80;
export const MAX_CATEGORY_DESCRIPTION_LENGTH = 500;
