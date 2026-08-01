# Fase 4 — Checkout / Pedidos · Plan de implementación

Estado: **completa**. Los cuatro pasos del plan están implementados,
validados y desplegados a staging.

Base ya construida (módulo `src/modules/orders/`):

- Modelo de dominio (`order.types.ts`): `Order`, `OrderItem` (snapshot),
  `OrderCustomer`, `OrderEvent`, estados y métodos de entrega/pago.
- Lógica pura testeable (`order.core.ts`): cálculo de totales del lado servidor,
  máquina de estados (`canTransition`/`nextStatuses`), correlativo `YYYY-000001`.
- Tests unitarios (`order.core.test.ts`).
- Zonas de entrega con ciudades/transportadora y medio de pago "cobro en
  destino" (`cash_on_delivery`) — ver `settings.types.ts` y el seed de staging.

## Pasos siguientes (cada uno, su propio PR verificado)

1. ✅ **`createOrder` (Cloud Function callable, en `functions/`).** Implementada en
   `functions/src/create-order.ts` (+ `order-core.ts`, espejo sin dependencias de
   Firebase de la lógica pura del frontend, porque `functions/` se empaqueta y
   despliega por separado). El cliente solo envía
   `items[{productId, quantity}]`, datos del comprador, `deliveryMethod`,
   `deliveryZoneId?`, `paymentMethod`, `notes?`. La Function, en una única
   transacción: revalida producto activo + precio vigente + stock (respeta
   `allowBackorder` y `settings/private.allowNegativeStock`); recalcula totales
   con `computeOrderTotals` (nunca confía en montos del cliente); resuelve el
   costo de envío desde `settings/public.deliveryZones` (rechaza zona inactiva o
   inexistente) y valida el medio de pago contra `acceptedPaymentMethods`;
   incrementa `counters/orders-YYYY`; crea/actualiza el cliente por
   `phoneNormalized`; crea el pedido `pendiente`, su primer `event` ("creado") y
   descuenta stock con movimiento `venta`. Devuelve número + resumen calculado
   por el servidor. 17 tests contra el emulador
   (`npx firebase-tools emulators:exec --only firestore "npm --prefix functions run test"`).

2. ✅ **Security Rules de `orders` / `orders/*/events` / `counters` / `customers`.**
   `orders`: create siempre `false` (única vía es la Function, que usa Admin SDK
   y bypassa las reglas); update solo admin con transición de estado válida
   (`canTransitionOrderStatus`, espejo de la máquina de estados) e inmutabilidad
   del resto de campos vía `.diff().affectedKeys()`; delete: nadie. `events`:
   create solo admin (schema `creado`/`cambio_estado`/`nota`), inmutable.
   `customers`: solo admin, schema validado. `counters`: `write: if false`
   siempre (solo la Function, transaccional). `stockMovements` ahora acepta
   `type` `venta`/`anulacion` con `orderId` opcional además de `ajuste`. 33 tests
   de reglas (antes 21).

3. ✅ **Checkout público (`src/modules/checkout/`, ruta `/checkout`).** Formulario
   de invitado (nombre, WhatsApp con `ParaguayPhoneInput`, email opcional),
   elección de entrega (pickup / zona) y medio de pago (desde `settings`,
   incluye "cobro en destino"), revalidación contra Firestore al entrar
   (`getActiveProductById` + `buildRevalidationOutcome`: quita productos
   inactivos/agotados, ajusta cantidades por stock, avisa cambios de precio) y
   llamada a `createOrder` vía `httpsCallable`. Carrito se vacía solo ante
   éxito. Confirmación en `/pedido/:number/gracias` con el resumen que devuelve
   la Function (nunca lee `orders` desde Firestore; usa `location.state`).
   Verificado end-to-end contra el Emulator Suite completo (pickup+cash y
   delivery+cobro-en-destino): correlativo, costo de envío, descuento de
   stock, alta de cliente y evento, todo correcto. 15 tests unitarios de la
   lógica pura (`checkout.validation`/`checkout.revalidation`).

4. ✅ **Panel admin de pedidos (`/admin/pedidos`, `/admin/pedidos/:id`).** Listado
   con filtros (búsqueda, estado) y métricas (total, pendientes, en curso,
   facturado), en `AdminOrdersPage`. Detalle (`AdminOrderDetailPage`): datos del
   cliente (con link directo a WhatsApp), entrega/pago (resuelve el nombre de
   la zona desde `settings`), items y totales, e historial de eventos. Cambio
   de estado con los botones válidos según `nextStatuses` (mismo `canTransition`
   del módulo `orders`); cancelar pide motivo en un modal y repone stock con
   movimientos `anulacion`, todo en una única transacción cliente
   (`transitionOrderStatus` en `order.service.ts`) validada por las mismas
   Security Rules del paso 2. Verificado end-to-end contra el Emulator Suite:
   listado con métricas correctas, transición normal (pendiente→confirmado) y
   cancelación con reposición de stock confirmada en Firestore
   (8→9 tras cancelar 1 unidad, movimiento `anulacion` con `previousStock`/
   `resultingStock` correctos).

## Decisiones ya confirmadas con el usuario

- **Zonas de entrega**: base en Ciudad del Este; delivery propio en CDE /
  Hernandarias / Presidente Franco (₲25.000) y transportadora para el resto del
  país (placeholder ₲35.000, ajustable). Cada zona declara `cities[]` y
  `carrierName?` — base para resolver zona por ciudad en el checkout.
- **Medios de pago**: `cash` | `bank_transfer` | `pay_on_pickup` |
  `cash_on_delivery` (cobro en destino, el más usado por marketplaces en PY).
- **Notificación de pedido**: pendiente de decidir (WhatsApp/email al
  confirmar); `settings/private.internalOrderNotificationEmails` ya existe.
