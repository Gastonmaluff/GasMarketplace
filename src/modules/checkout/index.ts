export { buildRevalidationOutcome, type RevalidationIssue } from './checkout.revalidation';
export { CheckoutError, submitOrder } from './checkout.service';
export {
  MAX_CUSTOMER_ADDRESS_LENGTH,
  MAX_CUSTOMER_EMAIL_LENGTH,
  MAX_CUSTOMER_NAME_LENGTH,
  MAX_ORDER_NOTES_LENGTH,
  validateCheckoutForm,
  type CheckoutFormState,
} from './checkout.validation';
export type { CheckoutRequest, CheckoutResult } from './checkout.types';
