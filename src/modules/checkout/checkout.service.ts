import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '../../lib/firebase/client';
import type { CheckoutRequest, CheckoutResult } from './checkout.types';

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/**
 * Llama a la Cloud Function `createOrder`, la única vía de creación de
 * pedidos. El servidor revalida todo (stock, precios, envío) y nunca confía
 * en los montos que se le envíen.
 */
export async function submitOrder(request: CheckoutRequest): Promise<CheckoutResult> {
  const services = getFirebaseServices();
  if (!services) {
    throw new CheckoutError('La tienda no está disponible en este momento.');
  }
  const callCreateOrder = httpsCallable<CheckoutRequest, CheckoutResult>(
    services.functions,
    'createOrder',
  );
  try {
    const response = await callCreateOrder(request);
    return response.data;
  } catch (cause) {
    const message =
      cause instanceof Error && cause.message
        ? cause.message
        : 'No se pudo crear el pedido. Intentá nuevamente.';
    throw new CheckoutError(message);
  }
}
