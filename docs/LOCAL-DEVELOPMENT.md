# Desarrollo local

Guía para levantar GasMarketplace en una máquina de desarrollo. Nada de esta guía toca el proyecto
Firebase real: todo ocurre contra Firebase Emulator Suite.

## Requisitos

- Node.js 22.12 o superior.
- npm 11 o superior.
- Java 17 o superior (lo exigen los emuladores de Firestore y Storage).
- Firebase CLI vía `npx -y firebase-tools@latest` (no requiere instalación global).

## Primer arranque

```bash
npm ci
cp .env.example .env.local
```

Completá `.env.local` con la configuración pública del SDK web (visible con
`npx -y firebase-tools@latest apps:sdkconfig WEB --project gasmarketplace-65156`) y activá los
emuladores:

```
VITE_FIREBASE_USE_EMULATORS=true
```

`.env.local` no se versiona nunca. Los valores del SDK web son públicos por diseño; las credenciales
privilegiadas (cuentas de servicio, Admin SDK) no deben existir en el repositorio bajo ninguna
forma.

## Emulator Suite

```bash
npx -y firebase-tools@latest emulators:start
```

| Emulador    | Puerto |
| ----------- | ------ |
| Auth        | 9099   |
| Firestore   | 8080   |
| Functions   | 5001   |
| Storage     | 9199   |
| Emulator UI | 4000   |

Los datos del emulador son volátiles y locales; no exportar datos al repositorio.

## Cloud Functions

El workspace `functions/` es independiente y compila con TypeScript estricto:

```bash
cd functions
npm ci
npm run build
```

La función `healthCheck` permite verificar el emulador de Functions:

```bash
curl http://127.0.0.1:5001/gasmarketplace-65156/us-central1/healthCheck
```

## Primer administrador

El panel exige el custom claim `admin`, que solo se asigna con Firebase Admin SDK. Contra el
emulador (crea el usuario si no existe):

```bash
cd functions
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/set-admin-claim.cjs admin@ejemplo.com contraseña
```

En PowerShell: `$env:FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"` antes de ejecutar el script.
Contra el proyecto real, el script exige credenciales privilegiadas de entorno y confirmación
explícita; nunca guardar claves en el repositorio.

## Aplicación

```bash
npm run dev
```

- Tienda pública: http://localhost:5173/
- Login administrativo: http://localhost:5173/admin/login
- Panel: http://localhost:5173/admin (configuración, categorías y productos)

## Storefront público

Rutas públicas (no requieren sesión; solo muestran datos con `active == true`):

| Ruta               | Contenido                                                |
| ------------------ | -------------------------------------------------------- |
| `/`                | Home: hero, categorías, destacados, beneficios, CTA.     |
| `/catalogo`        | Catálogo con filtros, orden y paginación por cursor.     |
| `/categoria/:slug` | Productos de una categoría activa (404 si no existe).    |
| `/buscar?q=texto`  | Búsqueda MVP por `searchTokens`.                         |
| `/producto/:slug`  | Ficha con galería, disponibilidad y WhatsApp.            |
| `/carrito`         | Placeholder "Próximamente" (el carrito llega en Fase 4). |

### Sembrar un catálogo local de prueba

Con los emuladores y la app corriendo, iniciá sesión como administrador y cargá datos demostrativos
(claramente locales, nunca datos reales de clientes):

1. `/admin/configuracion`: guardá la configuración (define WhatsApp para que aparezcan los botones).
2. `/admin/categorias/nueva`: creá 3+ categorías activas.
3. `/admin/productos/nuevo`: creá 8+ productos variados — activos, alguno inactivo (no debe verse en la
   tienda), destacados, con y sin stock, uno con "permitir venta sin stock" (backorder), alguno con
   precio anterior y con varias imágenes.
4. Abrí `/` y recorré home → categoría → catálogo → ficha.

### Consultas Firestore del storefront

Todas incluyen `active == true` (las Security Rules rechazan, no filtran, cualquier consulta que
pueda devolver inactivos — también la lectura por slug o por ID):

- Categorías activas: `where active == true, orderBy order`.
- Categoría por slug: `where active == true, where slug == :slug, limit 1`.
- Productos: `where active == true` + filtro opcional de categoría (`array-contains`) o destacados,
  con orden (destacados, recientes, precio, nombre) y **paginación por cursor** (`startAfter`, no
  offset). El filtro de disponibilidad se aplica en el cliente sobre la página traída, porque no hay
  una consulta Firestore razonable que lo exprese (depende de `trackStock`/`stock`/`allowBackorder`).
- Producto por slug: `where active == true, where slug == :slug, limit 1`.
- Búsqueda: `where active == true, where searchTokens array-contains :token`. Es un MVP: usa el
  primer token normalizado del término, **no** es full-text (sin Algolia/Typesense/Meilisearch).

### Imágenes públicas

Se sirven desde Storage (`categories/{id}/…`, `products/{id}/…`) con lectura pública. El componente
`ProductImage` muestra un placeholder accesible si falta la URL o la imagen falla, y usa
`loading="lazy"` en grillas y miniaturas.

### WhatsApp

Los botones usan `whatsappNumberNormalized` de `settings/public` con enlaces `https://wa.me/…`; en la
ficha el mensaje ("Hola, quiero consultar por …") se codifica. Si no hay número configurado, los
botones se ocultan.

### Limitación SEO (SPA)

El storefront ajusta `title`, `description`, Open Graph, canonical y `robots` por ruta desde el
cliente (`useDocumentMeta`). Al ser una SPA sin SSR/prerendering, los crawlers que **no** ejecutan
JavaScript ven el HTML inicial, no el contenido por ruta. Las rutas `/buscar`, `/carrito` y las 404
se marcan `noindex`. Un SSR/prerender queda para una fase posterior si se necesita indexación
completa.

> Los correos de recuperación de contraseña no se envían realmente: el emulador los captura y se ven
> en la Emulator UI (pestaña Authentication) o vía
> `http://127.0.0.1:9099/emulator/v1/projects/gasmarketplace-65156/oobCodes`.

## Administración del catálogo

Con la app corriendo y los emuladores activos, iniciá sesión como administrador y seguí este orden:

1. **Configuración** (`/admin/configuracion`): la primera vez se cargan valores por defecto seguros
   (PYG, es-PY, America/Asuncion). Definí nombre, WhatsApp, medios de pago y, si usás delivery,
   activá el toggle y agregá zonas con su costo entero en guaraníes. Guardar crea `settings/public`
   y `settings/private`.
2. **Categorías** (`/admin/categorias/nueva`): el slug se sugiere desde el nombre y se puede editar;
   es único (respaldado por `categorySlugs/{slug}`). La imagen es opcional. Una categoría con
   productos asociados no se puede eliminar físicamente: desactivala.
3. **Productos** (`/admin/productos/nuevo`): nombre, slug, precio entero en PYG, categorías (hasta 5,
   con una principal), stock y hasta 10 imágenes (JPEG/PNG/WebP, 5 MB) con una principal y orden
   arrastrable. En edición, el stock se corrige con **ajuste manual**, que registra un movimiento en
   `stockMovements`.

### Rutas de Storage e imágenes

- Categorías: `categories/{categoryId}/{nombreGenerado}`
- Productos: `products/{productId}/{nombreGenerado}`
- Solo JPEG, PNG y WebP; máximo 5 MB por archivo; nombres generados (nunca el original). Lectura
  pública (storefront), escritura solo admin. Las imágenes reemplazadas se borran únicamente después
  de guardar con éxito; si Firestore falla, las nuevas se limpian.

### Reiniciar los datos locales

Los datos del emulador son volátiles: se borran al detenerlo. Para empezar de cero sin reiniciar,
usá la Emulator UI (http://127.0.0.1:4000) → cada emulador tiene su acción de limpieza. Después
volvé a asignar el claim admin con `set-admin-claim.cjs`.

### Limitaciones conocidas

- Firestore y Storage no comparten transacción: si el borrado de un archivo falla tras eliminar el
  documento, queda un huérfano inofensivo en Storage (documentado en `product.service.ts`).
- Las reglas no iteran arrays: el contenido de `deliveryZones` e `images` se valida en el cliente y
  las reglas solo limitan su tamaño. Ambas colecciones son de escritura exclusiva admin.
- La eliminación de productos usa el contrato `canDeleteProduct`, que hoy siempre permite; cuando
  existan pedidos deberá consultar si alguno referencia el producto.

## Validación

Antes de cerrar cualquier cambio:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
```

Las pruebas no dependen de `.env.local`: el setup de Vitest anula las variables de Firebase para
que el suite sea determinista en cualquier máquina.

### Pruebas de Security Rules

Corren aparte, contra el emulador de Firestore (no forman parte de `npm run test` ni de CI). Con los
emuladores activos:

```bash
npm run test:rules
```

Cubren las consultas reales del storefront (lectura pública de `settings/public`, categorías y
productos activos, por slug y por categoría, y búsqueda por `searchTokens`), y el bloqueo de
`settings/private`, documentos inactivos, consultas sin `active == true`, índices de unicidad y
`stockMovements`.

## @gaston/auth

Se instala desde el tarball versionado `vendor/gaston-auth-0.2.0.tgz` (no requiere acceso al
monorepo privado `gaston-modules`). Para actualizarlo: construir y empaquetar la nueva versión en
el monorepo (`npm run build && npm pack` dentro de `packages/auth`), reemplazar el tarball en
`vendor/` y correr `npm install ./vendor/gaston-auth-<versión>.tgz`.
