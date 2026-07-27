# Despliegue y entornos

Este documento describe los entornos de GasMarketplace y cómo publicar previews. La regla de oro:
**cada comando de Firebase debe indicar el proyecto de forma explícita** (`--project staging` o
`--project production`) y verificarse antes de ejecutar.

## Entornos

| Entorno    | Dónde corre                          | Firebase                      | Datos                     |
| ---------- | ------------------------------------ | ----------------------------- | ------------------------- |
| localhost  | `npm run dev` + Emulator Suite       | Emuladores locales            | Volátiles, del emulador   |
| staging    | Firebase Hosting **preview channel** | `gasmarketplace-staging-7c3a` | Ficticios (seed)          |
| producción | (futuro) Hosting **live**            | `gasmarketplace-65156`        | Reales (aún no publicado) |

> La **preview de Hosting usa el Firestore y (si se provisiona) el Storage del proyecto staging** —
> NO usa los emuladores locales. Los emuladores solo se usan en `localhost`.

## Aliases de Firebase

`.firebaserc` define aliases explícitos, sin un `default` ambiguo:

```json
{
  "projects": {
    "production": "gasmarketplace-65156",
    "staging": "gasmarketplace-staging-7c3a"
  }
}
```

Antes de cualquier comando, verificá el proyecto activo:

```bash
npx -y firebase-tools@latest use            # muestra el proyecto/alias activo
npx -y firebase-tools@latest use staging    # cambia a staging
```

Nunca ejecutes `firebase deploy` sin `--only` y sin `--project`. Producción
(`gasmarketplace-65156`) no debe modificarse desde este flujo.

## Variables de entorno

- `.env.local` — desarrollo local contra emuladores (no se versiona).
- `.env.staging.local` — configuración pública del SDK web de **staging** + `USE_EMULATORS=false`
  (no se versiona; ignorado por `.gitignore`).
- `.env.staging.example` — plantilla con los nombres de variables y valores vacíos (sí se versiona).

Para recrear `.env.staging.local`, copiá `.env.staging.example` y completá con la config del SDK web
de staging:

```bash
npx -y firebase-tools@latest apps:sdkconfig WEB --project staging
```

Los valores del SDK web son públicos por diseño. **Nunca** se versionan cuentas de servicio, tokens
ni claves privadas.

## Build de staging

```bash
npm run build:staging
```

Usa `vite build --mode staging`, que carga `.env.staging.local` (prioridad más alta) sobre
`.env.local`. El bundle resultante apunta al proyecto staging y **excluye** el código de emuladores
(Vite lo elimina como dead-code porque `VITE_FIREBASE_USE_EMULATORS=false`). Verificaciones tras el
build: `dist/` existe, sin `.env`, sin sourcemaps, sin referencias a `localhost`/`127.0.0.1`, sin el
projectId de producción.

## Seed de datos demostrativos (staging)

```bash
npm run seed:staging
```

- Idempotente: usa IDs fijos y `PATCH`, no duplica al re-ejecutarse.
- Guardas: aborta si el projectId no contiene `staging` o si es `gasmarketplace-65156`.
- Escribe con el token del usuario logueado en la CLI (acceso de owner, omite las Security Rules).
- Colecciones que modifica: `settings/public`, `categories`, `categorySlugs`, `products`,
  `productSlugs`.
- Imágenes: SVG generados localmente como data URI (sin descargas externas, sin Storage). Datos 100%
  ficticios; **nunca** `costPrice` ni información sensible.

### Limpiar y volver a sembrar

Los datos de staging se limpian desde la consola de Firebase del proyecto staging
(https://console.firebase.google.com/project/gasmarketplace-staging-7c3a/firestore) borrando las
colecciones `settings`, `categories`, `categorySlugs`, `products`, `productSlugs`. Después,
`npm run seed:staging` para volver a sembrar. No se versionan exports de Firestore ni Storage.

## Desplegar reglas e índices a staging

```bash
npx -y firebase-tools@latest use staging
npm run test:rules                                              # con el emulador de Firestore activo
npx -y firebase-tools@latest deploy --only firestore --project staging   # rules + indexes
```

> **Storage**: `firebase-storage` no está provisionado en el proyecto staging. Activarlo en proyectos
> nuevos requiere plan **Blaze**, que no se acepta automáticamente. La preview no usa Storage (las
> imágenes son SVG inline), así que `storage.rules` queda en el repo y se desplegará
> (`--only storage --project staging`) cuando Storage se provisione. Ver la advertencia de datos más
> abajo.

Los índices compuestos tardan unos minutos en construirse tras el deploy; hasta que estén `READY`,
las consultas del catálogo pueden fallar temporalmente.

## Publicar / actualizar la preview de Hosting

```bash
# construir primero
npm run build:staging

# publicar (o re-publicar) el mismo canal de preview
npx -y firebase-tools@latest hosting:channel:deploy storefront-review --expires 7d --project staging
```

Antes de ejecutar, confirmá: projectId destino, alias `staging`, canal `storefront-review`,
expiración, directorio `dist`, que **NO** es el canal live, y que producción no se toca.

- **Actualizar la misma preview**: volvé a correr el mismo comando (mismo nombre de canal) tras un
  nuevo `build:staging`. Se sobrescribe el contenido y se renueva la expiración.
- **Expiración**: `--expires 7d` (máximo 30 días). El canal se elimina solo al expirar.
- **Eliminar el canal manualmente**:
  ```bash
  npx -y firebase-tools@latest hosting:channel:delete storefront-review --project staging
  ```

### Configuración de Hosting

`firebase.json` → `hosting`:

- `public: "dist"`.
- Rewrite de SPA: `** → /index.html` (todas las rutas, públicas y admin, sirven la SPA; la recarga
  directa de `/catalogo`, `/producto/:slug`, `/admin/login`, etc. funciona).
- Cache: `index.html` sin caché; assets con hash con `max-age=31536000, immutable`.
- `ignore`: `firebase.json`, dotfiles y `node_modules` no se publican.

## Seguridad de despliegue (evitar accidentes)

- Aliases explícitos (`production` / `staging`), sin `default`.
- Todo comando lleva `--project <alias>` y `--only <recurso>`.
- El seed se niega a correr contra producción o contra un projectId sin `staging`.
- Nunca `firebase deploy` a secas.
- El canal **live** de Hosting NO se publica en este flujo.

## ⚠️ Requisito antes de producción: separar datos públicos y privados del producto

Firestore entrega **documentos completos**. Hoy `products/{id}` es legible por cualquiera cuando
`active == true`, así que campos internos (por ejemplo `costPrice`, márgenes, notas internas) serían
visibles por inspección de red aunque la interfaz no los muestre.

En la preview esto **no** es un problema porque los datos son ficticios y el seed nunca carga
`costPrice` ni información sensible. **Antes de publicar producción con datos reales**, hay que
separar:

```
products/{productId}         → datos públicos (nombre, precio, imágenes, stock, etc.)
productPrivate/{productId}   → costo y datos administrativos (solo admin)
```

con reglas que restrinjan `productPrivate` a administradores. Este cambio no bloquea la preview, pero
es obligatorio antes de exponer datos comerciales reales.

## Procedimiento futuro para producción (pendiente)

1. Implementar la separación público/privado del producto (arriba).
2. Completar las fases de venta (carrito, checkout, `createOrder`, pedidos) y su seguridad.
3. Desplegar reglas/índices a `production` (`--project production`), con pruebas de reglas.
4. `firebase deploy --only hosting --project production` para publicar el canal **live**.
5. Verificar exhaustivamente antes de anunciar.

## Procedimiento futuro para dominio propio (pendiente)

Una vez validado el canal live, conectar un dominio personalizado desde la consola de Firebase
Hosting (Hosting → Add custom domain), siguiendo la verificación DNS. No se conecta dominio en esta
fase.
