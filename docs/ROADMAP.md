# Roadmap de GasMarketplace

Estado real del proyecto. Este archivo debe actualizarse en el mismo cambio que modifique el estado
de una tarea (regla 22 de AGENTS.md).

## FASE 0 — Fundación ✓

Todo terminado.

- ✓ Clonado y personalización del starter (identidad GasMarket).
- ✓ Arquitectura funcional del MVP documentada (`docs/ECOMMERCE-ARCHITECTURE.md`).
- ✓ Rebrand del README.
- ✓ PR #1 fusionado en `main`.

## FASE 1 — Infraestructura ✓

- ✓ Auditoría de dependencias (`docs/DEPENDENCY-AUDIT.md`).
- ✓ Configuración Firebase (`firebase.json`, `.firebaserc`, proyecto `gasmarketplace-65156`).
- ✓ Entorno local (`.env.local` desde `.env.example`, `docs/LOCAL-DEVELOPMENT.md`).
- ✓ Emulator Suite.
- ✓ Auth, Firestore, Storage y Functions.
- ✓ Verificación local.

## FASE 2 — Administración segura ✓

- ✓ Integración @gaston/auth (0.2.0, vendoreado en `vendor/`).
- ✓ Login administrativo (`/admin/login`).
- ✓ Custom claim admin local (`functions/scripts/set-admin-claim.cjs`).
- ✓ Rutas protegidas (`AdminGuard`).
- ✓ Sesión, logout y recuperación.

## FASE 3 — Catálogo ✓

- ✓ StoreSettings (configuración pública/privada, zonas de entrega).
- ✓ Categorías (CRUD administrativo, slugs únicos, imágenes).
- ✓ Productos (CRUD administrativo, unicidad slug/SKU/barcode, precios PYG).
- ✓ Imágenes (Storage, principal, orden, límites y limpieza).
- ✓ Stock básico (trackStock, allowBackorder, umbrales, ajustes con movimientos).
- ✓ Security Rules de catálogo con pruebas contra el emulador.
- ✓ Catálogo público (inicio, catálogo, categorías, búsqueda, ficha, galería, disponibilidad, SEO básico).

## FASE 3.5 — Primera preview pública

- ✓ Proyecto Firebase staging (`gasmarketplace-staging-7c3a`).
- ✓ Aplicación web staging.
- ✓ Firebase Hosting configurado (SPA rewrite, caché).
- ✓ Datos demostrativos (seed idempotente con guardas de projectId).
- ✓ Reglas e índices desplegados en staging.
- ✓ Preview `storefront-review` publicada (Hosting preview channel).
- ✓ Verificación pública (rutas, responsive, consola, seguridad).
- ✓ Rediseño visual "Mercado 48" del storefront (paleta teal/crema, home, listados, ficha).
- ✓ Separar datos públicos y privados del producto (`products` / `productPrivate`).
- ○ Publicar canal live.
- ○ Conectar dominio definitivo.

## FASE 4 — Venta (completa)

- ☑ Carrito (`cart`) client-side con persistencia local (`localStorage`),
  contador real en el header, stepper de cantidades y pedido por WhatsApp.
- ☑ Base del módulo `orders`: modelo de dominio, lógica pura (totales,
  máquina de estados, correlativo) y tests.
- ☑ Checkout de invitado: datos, zonas de entrega, medios de pago (incluye
  "cobro en destino"), revalidación de carrito contra Firestore y
  confirmación (`/checkout`, `/pedido/:number/gracias`).
- ☑ Cloud Function `createOrder` transaccional, con pruebas contra el
  emulador (`functions/src/create-order.ts`).
- ☑ Pedidos (panel: listado con filtros/métricas, detalle, cambio de
  estado, historial de eventos — `/admin/pedidos`).
- ☑ Stock por venta (descuento en `createOrder`, reposición `anulacion` al
  cancelar desde el panel). Ver `docs/FASE-4-PLAN.md`.

## FASE 5 — Panel administrativo restante (completa)

- ☑ Clientes derivados de pedidos: listado con métricas, detalle con
  historial de pedidos (`/admin/clientes`).
- ☑ Inventario: vista unificada de movimientos de stock de todo el
  catálogo (ajuste/venta/anulación), con filtros y links a producto y
  pedido (`/admin/stock`). De paso se corrigió un bug real: el listado
  por producto tenía el `type` de los movimientos hardcodeado a
  `'ajuste'` en vez de leer el campo real.

## FASE 6 — Seguridad completa (en progreso)

- ☑ Security Rules de pedidos/clientes/counters con validadores (33+
  tests en `tests/rules/firestore.rules.test.ts`); falta un ataque
  sistemático formal antes de abrir a tráfico real.
- ☑ Índices desplegados en staging.

## FASE 7 — Cierre del MVP (pendiente)

- ☐ Datos reales, accesibilidad, rendimiento, despliegue.
- ☐ Migrar `react-router` a v8 (vulnerabilidad aceptada temporalmente, ver
  `docs/DEPENDENCY-AUDIT.md`).
- ☐ Notificación de pedido nuevo al admin (WhatsApp o email — decisión
  pendiente del usuario).
