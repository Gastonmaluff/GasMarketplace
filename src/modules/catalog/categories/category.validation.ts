import { isValidSlug } from '../shared/text';
import {
  CATEGORY_ICON_OPTIONS,
  MAX_CATEGORY_DESCRIPTION_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
  type CategoryDraft,
} from './category.types';

export function validateCategoryDraft(draft: CategoryDraft): string[] {
  const errors: string[] = [];

  if (draft.name.trim() === '') {
    errors.push('El nombre de la categoría es obligatorio.');
  }
  if (draft.name.length > MAX_CATEGORY_NAME_LENGTH) {
    errors.push(`El nombre no puede superar ${MAX_CATEGORY_NAME_LENGTH} caracteres.`);
  }
  if (draft.slug === '' || !isValidSlug(draft.slug)) {
    errors.push('El slug debe usar minúsculas, números y guiones (ej.: lacteos-y-fiambres).');
  }
  if (draft.description.length > MAX_CATEGORY_DESCRIPTION_LENGTH) {
    errors.push(`La descripción no puede superar ${MAX_CATEGORY_DESCRIPTION_LENGTH} caracteres.`);
  }
  if (!Number.isInteger(draft.order) || draft.order < 0 || draft.order > 10_000) {
    errors.push('El orden debe ser un entero entre 0 y 10000.');
  }
  if (draft.icon !== '' && !CATEGORY_ICON_OPTIONS.includes(draft.icon)) {
    errors.push('El ícono elegido no es válido.');
  }

  return errors;
}
