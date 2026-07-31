# Fase 4 — Checkout / Pedidos · Plan de implementación

Estado: **en progreso**. Este documento guía el resto de la fase para que se
apruebe antes de tocar las partes sensibles (Cloud Function, dinero, stock).

Base ya construida (módulo `src/modules/orders/`):

- Modelo de dominio (`order.types.ts`): `Order`, `OrderItem` (snapshot),
  `OrderCustomer`, `OrderEvent`, estados y métodos de entrega/pago.
- Lógica pura testeable (`order.core.ts`): cálculo de totales del lado servidor,
  máquina de estados (`canTransition`/`nextStatuses`), correlativo `YYYY-000001`.
- Tests unitarios (`order.core.test.ts`).

## Pasos siguientes (cada uno, su propio PR verificado)

1. **`createOrder` (Cloud Function callable, en `functions/`).** El cliente solo
   envía `items[{productId, quantity}]`, datos del cliente, `deliveryMethod`,
   `deliveryZoneId?`, `paymentMethod`, `notes?`. La Function, en una transacción:
   revalida producto activo + precio vigente + stock; recalcula totales con
   `computeOrderTotals` (nunca confía en montos del cliente); resuelve el costo de
   envío desde `settings/public.deliveryZones`; incrementa `counters/orders-YYYY`;
   crea el pedido `pendiente`, su primer `event` y descuenta stock con movimiento
   `venta`. Devuelve número + resumen. Tests con el emulador.

2. **Security Rules de `orders` / `orders/*/events` / `counters` / `customers`.**
   Create solo la Function; update solo admin con transición válida (reusar la
   máquina de estados); delete: nadie. Sumar tests de reglas.

3. **Checkout público (`src/modules/checkout/`, ruta `/checkout`).** Formulario de
   invitado (nombre, teléfono PY, email opcional), elección de entrega (pickup /
   zona) y medio de pago (desde `settings`), revalidación y llamada a
   `createOrder`. Vaciar carrito solo ante éxito. Confirmación en
   `/pedido/:number/gracias` con el resumen del servidor.

4. **Panel admin de pedidos (`/admin/pedidos`, `/admin/pedidos/:id`).** Listado con
   filtro por estado; detalle con cambio de estado (validado por la máquina de
   estados) e historial de eventos. Cancelar repone stock (`anulacion`).

## Decisiones que conviene confirmar con el usuario

- **Zonas de entrega**: hoy `settings/public.deliveryZones` existe en el modelo
  pero está vacío. Para probar `delivery` habrá que cargar zonas (nombre + costo).
- **Medios de pago**: se usan los de `settings.acceptedPaymentMethods`
  (`cash` | `bank_transfer` | `pay_on_pickup`).
- **Notificación de pedido**: además del panel, ¿aviso por WhatsApp/email al
  confirmar? (`settings/private.internalOrderNotificationEmails` ya existe.)
