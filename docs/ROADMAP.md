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

## FASE 3 — Catálogo

- ✓ StoreSettings (configuración pública/privada, zonas de entrega).
- ✓ Categorías (CRUD administrativo, slugs únicos, imágenes).
- ✓ Productos (CRUD administrativo, unicidad slug/SKU/barcode, precios PYG).
- ✓ Imágenes (Storage, principal, orden, límites y limpieza).
- ✓ Stock básico (trackStock, allowBackorder, umbrales, ajustes con movimientos).
- ✓ Security Rules de catálogo con pruebas contra el emulador.
- ○ Catálogo público (inicio, catálogo, categorías, búsqueda, ficha).

## FASE 4 — Carrito (pendiente)

- ☐ Módulo `cart` con persistencia local y revalidación.

## FASE 5 — Backend de pedidos (pendiente)

- ☐ Cloud Function `createOrder` transaccional con pruebas contra el emulador.

## FASE 6 — Checkout (pendiente)

- ☐ Formulario de invitado, zonas de entrega, confirmación.

## FASE 7 — Panel administrativo restante (pendiente)

- ☐ Pedidos con historial, clientes, inventario por venta.

## FASE 8 — Seguridad completa (pendiente)

- ☐ Security Rules de pedidos/clientes con validadores y ataque sistemático.
- ☐ Índices confirmados en producción.

## FASE 9 — Cierre del MVP (pendiente)

- ☐ Datos reales, accesibilidad, rendimiento, despliegue.
