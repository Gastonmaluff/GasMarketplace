/**
 * Punto de entrada de Cloud Functions de GasMarket.
 *
 * createOrder se implementará en la fase de backend de pedidos del roadmap
 * (docs/ECOMMERCE-ARCHITECTURE.md).
 */
import { onRequest } from 'firebase-functions/https';

/** Verificación simple de que el runtime de Functions responde. */
export const healthCheck = onRequest((_request, response) => {
  response.json({
    status: 'ok',
    service: 'gasmarket-functions',
    timestamp: new Date().toISOString(),
  });
});
