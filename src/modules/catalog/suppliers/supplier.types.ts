export interface Supplier {
  id: string;
  name: string;
  normalizedName: string;
  contactName?: string;
  phone?: string;
  notes?: string;
  active: boolean;
  updatedAtMillis?: number;
}

export interface SupplierDraft {
  name: string;
  contactName: string;
  phone: string;
  notes: string;
  active: boolean;
}

export const MAX_SUPPLIER_NAME_LENGTH = 120;
export const MAX_SUPPLIER_PHONE_LENGTH = 40;
export const MAX_SUPPLIER_FIELD_LENGTH = 500;
