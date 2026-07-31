import {
  MAX_SUPPLIER_FIELD_LENGTH,
  MAX_SUPPLIER_NAME_LENGTH,
  MAX_SUPPLIER_PHONE_LENGTH,
  type SupplierDraft,
} from './supplier.types';

export function validateSupplierDraft(draft: SupplierDraft): string[] {
  const errors: string[] = [];

  if (draft.name.trim() === '') {
    errors.push('El nombre del proveedor es obligatorio.');
  }
  if (draft.name.length > MAX_SUPPLIER_NAME_LENGTH) {
    errors.push(`El nombre no puede superar ${MAX_SUPPLIER_NAME_LENGTH} caracteres.`);
  }
  if (draft.contactName.length > MAX_SUPPLIER_NAME_LENGTH) {
    errors.push(`El contacto no puede superar ${MAX_SUPPLIER_NAME_LENGTH} caracteres.`);
  }
  if (draft.phone.length > MAX_SUPPLIER_PHONE_LENGTH) {
    errors.push(`El teléfono no puede superar ${MAX_SUPPLIER_PHONE_LENGTH} caracteres.`);
  }
  if (draft.notes.length > MAX_SUPPLIER_FIELD_LENGTH) {
    errors.push(`Las notas no pueden superar ${MAX_SUPPLIER_FIELD_LENGTH} caracteres.`);
  }

  return errors;
}
