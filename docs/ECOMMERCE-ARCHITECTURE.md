# Arquitectura funcional del comercio electrónico (GasMarket)

Este documento define la arquitectura funcional aprobada para el MVP de GasMarket. Complementa a
[ARCHITECTURE.md](ARCHITECTURE.md), que describe la base técnica de la plantilla. Ante un conflicto,
este documento manda sobre el dominio de comercio electrónico y aquel sobre el núcleo reutilizable.

Estado: arquitectura aprobada, implementación pendiente. Firebase todavía no está conectado y no
existen colecciones reales.

## Alcance del MVP

Área pública: inicio, catálogo, categorías, búsqueda, ficha de producto, carrito, checkout como
invitado y confirmación de pedido. Panel administrativo: login, productos, categorías, pedidos,
clientes, stock básico y configuración.

Pagos del MVP (offline): efectivo, transferencia y pago al retirar cuando corresponda.

Fuera del alcance por ahora: pasarela de pagos, cupones, reseñas, favoritos, cuentas de compradores,
marketplace, múltiples depósitos y facturación electrónica.

## Módulos

Cada módulo vive en `src/modules/<nombre>`, agrupa rutas, componentes, servicios, tipos y pruebas, y
expone una API pública pequeña. Los módulos consumen el núcleo reutilizable (`src/components/ui`,
`src/components/shell`, `src/utils`) y nunca lo modifican para introducir reglas comerciales.

| Módulo           | Responsabilidad                                                                          | Área                     |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| `catalog`        | Productos y categorías: listado, ficha, búsqueda y filtrado. Solo lectura en lo público. | Pública y administrativa |
| `cart`           | Estado del carrito, persistencia local y cálculo de totales. No conoce Firestore.        | Pública                  |
| `checkout`       | Formulario de invitado, revalidación contra catálogo y llamada a `createOrder`.          | Pública                  |
| `orders`         | Gestión de pedidos: listado, detalle, transición de estados e historial de eventos.      | Administrativa           |
| `customers`      | Clientes derivados de los pedidos: listado, detalle e historial.                         | Administrativa           |
| `inventory`      | Stock básico: ajustes manuales y trazabilidad de movimientos.                            | Administrativa           |
| `admin-auth`     | Login, sesión, guard de rutas `/admin` y verificación del claim de administrador.        | Administrativa           |
| `store-settings` | Configuración operativa: datos del comercio, zonas de entrega y medios de pago.          | Administrativa           |

## Entidades principales

- **Product**: `id`, `slug`, `name`, `description`, `price` (entero en PYG, sin decimales),
  `images[]`, `categoryIds[]`, `stock`, `active`, `searchTokens[]`, `createdAt`, `updatedAt`.
- **Category**: `id`, `slug`, `name`, `order`, `active`.
- **CartItem** (solo cliente, nunca persiste en Firestore): `productId`, `name`, `price`, `image`,
  `quantity`.
- **Order**: `id`, `number` (`YYYY-000001`), `status`, `customer` embebido (`name`, `phoneDisplay`,
  `phoneNormalized`, `email` opcional, dirección o zona), `items[]` como snapshot (`productId`,
  `name`, `unitPrice`, `quantity`, `subtotal`), `deliveryMethod`, `deliveryZoneId` opcional,
  `deliveryCost`, `total`, `paymentMethod`, `notes` opcional, `customerId`, `status`, `updatedAt`,
  `updatedBy`, `createdAt`.
- **OrderEvent** (subcolección del pedido): `type`, `fromStatus` opcional, `toStatus` opcional,
  `note` opcional, `createdAt`, `createdBy`.
- **Customer**: `id` generado, `phoneNormalized`, `phoneDisplay`, `name`, `email` opcional,
  `ordersCount`, `totalSpent`, `lastOrderAt`.
- **StockMovement**: `id`, `productId`, `type` (`ajuste` | `venta` | `anulacion`), `quantity` con
  signo, `orderId` opcional, `reason` opcional, `createdAt`, `createdBy`.
- **StoreSettings**: documento público y documento privado (ver estructura de Firestore).
- **DeliveryZone** (dentro de la configuración pública): `id`, `name`, `cost`, `active`, `order`,
  `description` opcional.

Los items del pedido son snapshots: copian nombre y precio al momento de la compra para que editar
un producto nunca altere pedidos históricos. Los montos se almacenan siempre como números limpios,
sin separadores ni símbolos (regla 17 de AGENTS.md). Los teléfonos guardan la versión visual y la
normalizada `+595…` por separado (regla 18).

## Estructura de Firestore

```
products/{productId}              lectura pública solo con active == true
productPrivate/{productId}        costo, proveedor y notas internas; solo admin
productSlugs/{slug}               índice de unicidad { productId } — solo admin
productSkus/{sku}                 índice de unicidad { productId } — solo admin
productBarcodes/{barcode}         índice de unicidad { productId } — solo admin
categories/{categoryId}           lectura pública solo con active == true
categorySlugs/{slug}              índice de unicidad { categoryId } — solo admin
orders/{orderId}                  solo administración; creado por la Function
orders/{orderId}/events/{eventId} historial de eventos del pedido
customers/{customerId}            solo administración
stockMovements/{movementId}       solo administración
settings/public                   lo que el checkout necesita: zonas de entrega y medios de pago
settings/private                  configuración interna del panel
counters/orders-YYYY              contador anual del correlativo de pedidos
```

Decisiones estructurales:

- Colecciones raíz planas, salvo `orders/{orderId}/events`: el historial es una subcolección para
  mantener liviano el documento principal y permitir un registro de eventos sin límite práctico.
- `settings` se divide en `public` y `private` porque las reglas de seguridad aplican al documento
  completo: no se puede exponer un campo y ocultar otro dentro del mismo documento.
- El documento principal del pedido guarda solo `status`, `updatedAt` y `updatedBy`; cada cambio
  agrega un documento en `events`.
- **Unicidad por documento índice**: Firestore no garantiza unicidad de campos. Cada valor único
  (slug de categoría y producto, SKU y código de barras normalizados) se respalda con un documento
  índice cuyo ID es el propio valor y cuyo contenido apunta al documento dueño. La creación,
  edición y liberación de estas reservas ocurre dentro de la misma transacción que escribe la
  entidad, de modo que dos entidades nunca comparten un valor y no quedan reservas huérfanas. Un
  SKU o código de barras vacío no crea índice.
- Los documentos de producto y categoría guardan además `normalizedName` (minúsculas, para
  filtrado en el cliente) junto al `name` visible que conserva mayúsculas y tildes.
- El stock básico se materializa en el propio producto (`stock`, `trackStock`, `allowBackorder`,
  `lowStockThreshold`); cada ajuste manual escribe el nuevo stock y un `stockMovements` de tipo
  `ajuste` en una única transacción, con `previousStock`/`resultingStock` consistentes. Los
  descuentos por venta y las reposiciones por cancelación llegan con la fase de pedidos.
- Los campos internos del producto viven en `productPrivate/{productId}` (`costPrice`,
  `supplierName`, `internalNotes`). El documento público `products/{productId}` no almacena datos de
  margen, proveedor ni notas privadas, aunque el panel admin los cargue junto al producto.
- Búsqueda: Firestore no ofrece full-text. El MVP usa `searchTokens[]` (tokens en minúsculas
  derivados del nombre y los códigos, generados siempre en el servicio y nunca aceptados del
  formulario) con `array-contains`. Si queda corto, se integrará un buscador externo sin afectar a
  los consumidores del módulo `catalog`.

## Rutas

### Públicas

```
/                         inicio (destacados y categorías)
/catalogo                 catálogo completo con paginación
/categoria/:slug          productos de una categoría
/buscar?q=...             resultados de búsqueda
/producto/:slug           ficha de producto
/carrito                  carrito
/checkout                 datos del invitado, entrega y medio de pago
/pedido/:number/gracias   confirmación del pedido
/demo, /demo/componentes  demostración interna del UI Kit (se mantiene)
```

### Administrativas

```
/admin/login
/admin                    resumen: pedidos pendientes y stock bajo
/admin/productos          listado y creación
/admin/productos/:id      edición
/admin/categorias
/admin/pedidos            listado con filtro por estado
/admin/pedidos/:id        detalle, cambio de estado e historial
/admin/clientes
/admin/clientes/:id       historial del cliente
/admin/stock              stock actual, ajustes y movimientos
/admin/configuracion
```

Todas las rutas `/admin` (excepto el login) pasan por el guard de `admin-auth`.

## Consultas públicas del catálogo

Las Security Rules no filtran resultados: rechazan por completo cualquier consulta que pueda
devolver documentos no permitidos. Por lo tanto, toda consulta pública sobre `products` y
`categories` debe incluir explícitamente `active == true`; de lo contrario Firestore la rechaza
aunque todos los resultados reales estén activos.

La consulta por slug debe ser:

```
where('active', '==', true)
where('slug', '==', requestedSlug)
limit(1)
```

### Implementación del storefront público

La API pública del catálogo vive en `src/modules/catalog/public` y la consume el módulo
`src/modules/storefront` (que solo importa la API pública de `catalog` y `store-settings`, nunca
detalles internos de administración). Precisiones de implementación:

- **Paginación por cursor** (`startAfter` con el último `DocumentSnapshot`), no offset. Se pide un
  elemento extra por página para saber si hay más (`hasMore`).
- **Orden**: destacados (`featured desc, updatedAt desc`), recientes (`updatedAt desc`), precio
  (`price asc/desc`) y nombre (`normalizedName asc`). Firestore agrega `__name__` ascendente como
  desempate implícito, suficiente para un orden total estable con cursor.
- **Filtro de disponibilidad**: se resuelve en el cliente sobre la página traída, porque depende de
  `trackStock`/`stock`/`allowBackorder` y no existe una consulta Firestore de un solo criterio que
  lo exprese. Los demás filtros (categoría, destacados) y el orden sí van al servidor.
- **Búsqueda**: MVP sobre `searchTokens` con `array-contains` del primer token normalizado del
  término. No es full-text; un buscador externo se integraría detrás de la misma función pública sin
  afectar al storefront.
- **Lectura pública de `settings/public`** mediante `loadPublicStoreSettings()`, que no exige sesión
  y cae a defaults seguros; el storefront nunca lee `settings/private`.
- **Campos internos** (`costPrice`, proveedor y notas) se leen desde `productPrivate/{productId}`,
  colección exclusiva para administradores. El storefront solo consulta `products`, donde permanecen
  los campos necesarios para listados, ficha, disponibilidad y búsqueda.

## Flujo del carrito

1. El carrito vive en el cliente: estado en memoria más persistencia en `localStorage` con clave
   versionada `gasmarket:cart:v1`. No existe documento de carrito en Firestore: un invitado no tiene
   identidad estable y persistirlo en el servidor no aporta valor en el MVP.
2. Agregar desde la ficha o el catálogo guarda `productId`, snapshot de nombre, precio e imagen, y
   la cantidad.
3. En `/carrito` se modifican cantidades, se quitan items y se ven subtotales y total con los
   formatters `es-PY`/PYG existentes.
4. Al entrar al checkout se revalida contra Firestore: precio vigente, producto activo y stock. Si
   algo cambió, se informa y se actualiza el carrito antes de continuar.
5. El carrito se vacía únicamente cuando `createOrder` respondió con éxito.

## Flujo de `createOrder` (Cloud Function callable)

El cliente nunca escribe pedidos directamente. Envía solamente:

- `items[]`: pares `productId` y `quantity`;
- datos permitidos del comprador: `name`, `phone`, `email` opcional, dirección o referencia;
- `deliveryMethod` (`pickup` | `delivery`) y `deliveryZoneId` cuando corresponde;
- `paymentMethod`;
- `notes` opcional.

La Function nunca confía en precios, subtotales, totales ni costos de entrega enviados por el
cliente. Pasos:

1. Validar forma y límites del payload (cantidades enteras positivas, longitudes máximas, medio de
   pago permitido).
2. Consultar los productos vigentes por `productId`.
3. Rechazar el pedido si algún producto no existe o está inactivo.
4. Verificar stock disponible para cada item.
5. Recalcular precios unitarios, subtotales y total desde Firestore.
6. Calcular el costo de entrega desde `settings/public` según la zona elegida (o cero para retiro);
   rechazar zonas inexistentes o inactivas.
7. Normalizar el teléfono y buscar el cliente por `phoneNormalized`: actualizar sus agregados
   (`ordersCount`, `totalSpent`, `lastOrderAt`) o crear el documento.
8. Incrementar el contador anual `counters/orders-YYYY` y componer el número `YYYY-000001`.
9. Crear el pedido con estado `pendiente`, su primer evento en `events` y el snapshot de items.
10. Descontar stock y registrar un `StockMovement` de tipo `venta` por cada item.

Los pasos críticos (verificación de stock, contador, creación del pedido y del evento, descuento de
stock, movimientos y actualización del cliente) se ejecutan dentro de una única transacción de
Firestore: o se confirma todo o no se confirma nada.

La respuesta al cliente incluye el número de pedido y el resumen calculado por el servidor, que la
página `/pedido/:number/gracias` muestra sin leer `orders` desde Firestore.

## Máquina de estados del pedido

```
pendiente → confirmado → en_preparacion → enviado → entregado
    │            │              │
    └────────────┴──────────────┴──→ cancelado
```

- `pendiente`: recién creado, sin revisar.
- `confirmado`: disponibilidad y pago acordados con el cliente.
- `en_preparacion`: el pedido se está armando.
- `enviado`: en camino, o listo para retirar según el método de entrega.
- `entregado`: cerrado.
- `cancelado`: alcanzable desde `pendiente`, `confirmado` o `en_preparacion`; nunca desde
  `entregado`. Cancelar repone stock mediante movimientos de tipo `anulacion`.

Las transiciones válidas se implementan como función pura en el módulo `orders` (testeable de forma
aislada) y se validan también en las Security Rules, de modo que ni un error del panel permita un
salto inválido. Cada transición actualiza `status`, `updatedAt` y `updatedBy` en el pedido y agrega
un documento a `orders/{orderId}/events`.

## Reglas de seguridad (diseño)

Principios: denegación por defecto, mínimo privilegio, validación estricta de esquema (campos
permitidos, tipos, rangos y tamaños máximos en todo string, lista y mapa) y administración por
custom claim.

| Colección                                                     | Lectura                                              | Escritura                                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `products`, `categories`                                      | Pública solo con `active == true`; admin sin filtro. | Solo admin, con validación de esquema (precio entero positivo, límites de tamaño).           |
| `orders` y `orders/*/events`                                  | Solo admin.                                          | Create: solo la Function. Update: solo admin con transición de estado válida. Delete: nadie. |
| `customers`, `stockMovements`, `settings/private`, `counters` | Solo admin.                                          | Solo admin o la Function.                                                                    |
| `settings/public`                                             | Pública.                                             | Solo admin.                                                                                  |

Detalles clave:

- **Administradores**: se identifican exclusivamente con el custom claim
  `request.auth.token.admin == true`. El claim solo puede asignarse mediante Firebase Admin SDK
  desde un entorno privilegiado; ningún cliente puede escribir ni modificar roles. Más adelante se
  preparará un script local seguro para asignar el primer administrador, sin versionar credenciales.
- **Pedidos**: contienen PII (nombre, teléfono, dirección), por eso su lectura es exclusiva del
  admin. El invitado ve su confirmación con los datos que devolvió `createOrder`; no necesita leer
  Firestore.
- **Inmutabilidad**: en updates de pedidos, los items, totales, datos del cliente, `number` y
  `createdAt` son inmutables; solo cambian `status`, `updatedAt` y `updatedBy` con una transición
  válida.
- Las reglas definitivas se redactarán con el proceso completo de la guía de Firestore (validadores
  por colección, ataque sistemático "devil's advocate" y auditoría) y deben tratarse como prototipo
  a revisar antes de abrir la tienda al público.

## Cloud Functions previstas

| Function      | Tipo     | Responsabilidad                                                                                                                             |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createOrder` | Callable | Única vía de creación de pedidos. Flujo descrito arriba, transaccional.                                                                     |
| `cancelOrder` | Callable | Candidata (no comprometida para el MVP): cancelación admin con reposición de stock en transacción; alternativa: transacción desde el panel. |

El plan del proyecto es Blaze para poder desplegar Functions. No hay funciones programadas (cron) ni
triggers de Firestore previstos para el MVP.

## Índices previstos

Índices compuestos esperados (se confirmarán con los errores de índice de Firestore durante la
implementación, que generan el enlace de creación exacto):

| Colección        | Campos                                                       | Uso                                                            |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `products`       | `active` ASC, `createdAt` DESC                               | Catálogo general paginado                                      |
| `products`       | `active` ASC, `categoryIds` ARRAY_CONTAINS, `createdAt` DESC | Listado por categoría                                          |
| `products`       | `active` ASC, `searchTokens` ARRAY_CONTAINS, `name` ASC      | Búsqueda pública                                               |
| `products`       | `active` ASC, `slug` ASC                                     | Ficha por slug (si el merge automático de índices no la cubre) |
| `orders`         | `status` ASC, `createdAt` DESC                               | Pedidos filtrados por estado                                   |
| `stockMovements` | `productId` ASC, `createdAt` DESC                            | Historial de movimientos por producto                          |

Las consultas de un solo campo (`phoneNormalized`, `lastOrderAt`, `slug` en categorías) usan los
índices automáticos.

## Estrategia de clientes

- `customers/{customerId}` usa un ID generado por Firestore; el teléfono **no** es el ID del
  documento, para tolerar correcciones de número sin migrar documentos.
- `phoneNormalized` (formato `+595…`) es la clave natural de búsqueda: `createOrder` busca por ese
  campo y actualiza el cliente existente o crea uno nuevo dentro de la misma transacción.
- El documento guarda `phoneNormalized`, `phoneDisplay`, `name`, `email` opcional y los agregados
  `ordersCount`, `totalSpent` y `lastOrderAt`.
- El pedido referencia al cliente por `customerId` y además embebe el snapshot de contacto usado en
  esa compra, para que editar un cliente no reescriba pedidos históricos.
- Los compradores no tienen cuenta ni acceso a estos documentos; la colección es exclusivamente
  administrativa.

## Zonas de entrega

- Métodos del MVP: retiro en local y delivery por zonas configurables. No se asume ninguna ciudad
  por defecto.
- Las zonas se administran desde `store-settings` y se guardan en `settings/public` como lista de
  objetos: `id`, `name`, `cost` (entero en PYG), `active`, `order` y `description` opcional.
- El checkout muestra solo zonas activas, ordenadas por `order`.
- `createOrder` recalcula el costo desde `settings/public` y rechaza zonas inexistentes o inactivas;
  el costo enviado por el cliente nunca se usa.
- Sin mapas ni cálculo por distancia en el MVP.

## Decisiones descartadas

| Decisión descartada                                                                                                               | Motivo                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Creación de pedidos por escritura directa del cliente (Opción B)                                                                  | Las reglas no pueden recalcular precios ni descontar stock con integridad; permitía totales falsos.                  |
| `statusHistory[]` embebido en el pedido                                                                                           | Crece sin límite y engorda el documento; se reemplazó por la subcolección `events`.                                  |
| Teléfono normalizado como ID de `customers`                                                                                       | Un cambio o corrección de número obligaría a migrar el documento; se usa ID generado más `phoneNormalized` indexado. |
| Carrito persistido en Firestore                                                                                                   | El invitado no tiene identidad estable; `localStorage` es suficiente y más simple.                                   |
| Lectura del pedido por el invitado                                                                                                | Exigiría darle identidad o tokens de acceso; la confirmación usa la respuesta de `createOrder`.                      |
| Roles en documentos de usuario                                                                                                    | Editable por el cliente en el peor caso; se usan custom claims asignados por Admin SDK.                              |
| Mapas o costo de envío por distancia                                                                                              | Complejidad prematura; zonas configurables cubren el MVP.                                                            |
| Pasarela de pagos, cupones, reseñas, favoritos, cuentas de compradores, marketplace, múltiples depósitos, facturación electrónica | Fuera del alcance aprobado del MVP.                                                                                  |

## Roadmap del MVP

Orden previsto de implementación; cada fase termina con `typecheck`, `lint`, `test` y `build` en
verde.

1. **Fundaciones de dominio**: tipos compartidos de las entidades, máquina de estados del pedido y
   utilidades puras (tokens de búsqueda, correlativo, totales) con sus pruebas.
2. **Conexión de Firebase**: proyecto real, variables de entorno locales, Firestore provisionado y
   emuladores para desarrollo.
3. **Catálogo público**: módulos `catalog` y rutas públicas de inicio, catálogo, categoría, búsqueda
   y ficha, con datos de prueba.
4. **Carrito**: módulo `cart` completo con persistencia local y revalidación.
5. **Backend de pedidos**: Cloud Function `createOrder` transaccional con pruebas contra el emulador.
6. **Checkout**: formulario de invitado, zonas de entrega, integración con `createOrder` y página de
   confirmación.
7. **Panel administrativo**: `admin-auth` (login más guard más script del primer admin), productos,
   categorías, pedidos con historial, clientes, stock y configuración.
8. **Seguridad**: Security Rules completas con validadores, ataque sistemático y auditoría; índices
   confirmados.
9. **Cierre del MVP**: datos reales, revisión de accesibilidad y rendimiento, despliegue.

Las piezas con vocación reutilizable (motor de carrito, máquina de estados, CRUD administrativo,
guard de autenticación, contador transaccional) se implementan dentro de sus módulos y se extraerán
a la plantilla solo cuando un segundo sistema las necesite.
