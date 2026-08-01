/**
 * Punto de entrada de Cloud Functions de GasMarket.
 * Ver docs/ECOMMERCE-ARCHITECTURE.md para el diseño del backend de pedidos.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/https';

import { createOrderHandler } from './create-order';

initializeApp();

/** Verificación simple de que el runtime de Functions responde. */
export const healthCheck = onRequest((_request, response) => {
  response.json({
    status: 'ok',
    service: 'gasmarket-functions',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Única vía de creación de pedidos. El cliente solo envía items, datos de
 * invitado, método de entrega/pago y notas; el servidor revalida catálogo,
 * stock y precios, y calcula todos los montos. Ver create-order.ts.
 */
export const createOrder = onCall(async (request) => {
  try {
    return await createOrderHandler(getFirestore(), request.data);
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('createOrder falló de forma inesperada', error);
    throw new HttpsError('internal', 'No se pudo crear el pedido. Intentá nuevamente.');
  }
});
