/**
 * Siembra un catálogo DEMOSTRATIVO en el proyecto Firebase de STAGING.
 *
 * - Idempotente: usa IDs fijos y PATCH (crea o sobrescribe, sin duplicar).
 * - Guardas: aborta si el projectId no contiene "staging" o si es producción
 *   (gasmarketplace-65156).
 * - No usa emuladores: escribe en el Firestore real del proyecto staging.
 * - Autentica con el token del usuario logueado en la CLI de Firebase (owner);
 *   ese acceso administrativo omite las Security Rules, igual que el Admin SDK.
 * - Imágenes: SVG generados localmente como data URI (sin descargas externas,
 *   sin Storage). Datos 100% ficticios; nunca costPrice ni información sensible.
 *
 * Uso:
 *   npm run seed:staging
 *   (o) node scripts/seed-staging-catalog.mjs [projectId]
 *
 * Colecciones que modifica: settings/public, categories, categorySlugs,
 * products, productSlugs. Para limpiar staging, borrá esas colecciones desde la
 * consola de Firebase del proyecto staging (ver docs/DEPLOYMENT.md).
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PRODUCTION_PROJECT = 'gasmarketplace-65156';
// Credenciales públicas del cliente OAuth de firebase-tools (no son secretas).
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function resolveProjectId() {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  try {
    const rc = JSON.parse(readFileSync('.firebaserc', 'utf8'));
    return rc.projects?.staging;
  } catch {
    return undefined;
  }
}

const projectId = resolveProjectId();
if (!projectId) {
  console.error('No se pudo determinar el projectId (alias staging en .firebaserc o argumento).');
  process.exit(1);
}
if (projectId === PRODUCTION_PROJECT) {
  console.error(`ABORT: ${projectId} es PRODUCCIÓN. El seed nunca corre contra producción.`);
  process.exit(1);
}
if (!projectId.includes('staging')) {
  console.error(`ABORT: el projectId "${projectId}" no contiene "staging". Seed cancelado.`);
  process.exit(1);
}

function readRefreshToken() {
  const path = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  const cfg = JSON.parse(readFileSync(path, 'utf8'));
  const token = cfg.tokens?.refresh_token;
  if (!token) throw new Error('No hay refresh_token en el configstore de firebase-tools.');
  return token;
}

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: readRefreshToken(),
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`No se pudo obtener access token: ${res.status}`);
  return (await res.json()).access_token;
}

// ---- Conversión a valores tipados de Firestore REST ----
function toValue(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  throw new Error(`Tipo no soportado: ${typeof v}`);
}
function toFields(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = toValue(val);
  return fields;
}

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

async function patchDoc(token, path, data) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok)
    throw new Error(`PATCH ${path} falló: ${res.status} ${(await res.text()).slice(0, 200)}`);
}

// ---- Imágenes SVG generadas localmente (data URI) ----
function svgImage(label, hue) {
  const s =
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'>` +
    `<rect width='600' height='600' fill='hsl(${hue},58%,88%)'/>` +
    `<rect x='48' y='48' width='504' height='504' rx='28' fill='hsl(${hue},52%,74%)'/>` +
    `<text x='300' y='318' font-family='Arial,Helvetica,sans-serif' font-size='40' font-weight='700' ` +
    `fill='hsl(${hue},45%,24%)' text-anchor='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
}

const now = new Date();
const UID = 'staging-seed';

function tokens(name) {
  const set = new Set();
  for (const w of name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/u)) {
    if (w.length >= 2 && w.length <= 30) set.add(w);
  }
  return [...set].slice(0, 30);
}

function image(id, label, hue, order, isPrimary) {
  return { id, url: svgImage(label, hue), path: '', alt: label, order, isPrimary };
}

const categories = [
  { id: 'cat-bebidas', name: 'Bebidas', slug: 'bebidas', order: 0, hue: 205, active: true },
  { id: 'cat-almacen', name: 'Almacén', slug: 'almacen', order: 1, hue: 35, active: true },
  { id: 'cat-limpieza', name: 'Limpieza', slug: 'limpieza', order: 2, hue: 150, active: true },
  { id: 'cat-snacks', name: 'Snacks', slug: 'snacks', order: 3, hue: 320, active: true },
  {
    id: 'cat-oculta',
    name: 'Descontinuados',
    slug: 'descontinuados',
    order: 4,
    hue: 0,
    active: false,
  },
];

const catHue = Object.fromEntries(categories.map((c) => [c.id, c.hue]));

// 12 productos activos + 1 inactivo, con la variedad pedida.
const products = [
  {
    id: 'p-cola',
    name: 'Gaseosa Cola 2L',
    cat: 'cat-bebidas',
    price: 12000,
    compareAtPrice: 15000,
    stock: 40,
    featured: true,
    images: 3,
  },
  {
    id: 'p-agua',
    name: 'Agua Mineral 1.5L',
    cat: 'cat-bebidas',
    price: 5000,
    stock: 120,
    featured: false,
    images: 1,
  },
  {
    id: 'p-jugo',
    name: 'Jugo de Naranja 1L',
    cat: 'cat-bebidas',
    price: 8500,
    compareAtPrice: 10000,
    stock: 30,
    featured: true,
    images: 2,
  },
  {
    id: 'p-yerba',
    name: 'Yerba Mate Selecta 1kg',
    cat: 'cat-almacen',
    price: 25000,
    compareAtPrice: 32000,
    stock: 18,
    featured: true,
    images: 3,
  },
  {
    id: 'p-azucar',
    name: 'Azúcar Refinada 1kg',
    cat: 'cat-almacen',
    price: 6500,
    stock: 0,
    allowBackorder: true,
    featured: false,
    images: 1,
  },
  {
    id: 'p-aceite',
    name: 'Aceite de Girasol 900ml',
    cat: 'cat-almacen',
    price: 14000,
    stock: 0,
    allowBackorder: false,
    featured: false,
    images: 1,
  },
  {
    id: 'p-fideos',
    name: 'Fideos Spaghetti 500g',
    cat: 'cat-almacen',
    price: 4500,
    stock: 75,
    featured: false,
    images: 2,
  },
  {
    id: 'p-detergente',
    name: 'Detergente Líquido 500ml',
    cat: 'cat-limpieza',
    price: 9000,
    compareAtPrice: 11000,
    stock: 22,
    featured: true,
    images: 2,
  },
  {
    id: 'p-lavandina',
    name: 'Lavandina 1L',
    cat: 'cat-limpieza',
    price: 7000,
    stock: 5,
    featured: false,
    images: 1,
  },
  {
    id: 'p-jabon',
    name: 'Jabón en Pan x3',
    cat: 'cat-limpieza',
    price: 8000,
    stock: 60,
    featured: false,
    images: 1,
  },
  {
    id: 'p-papas',
    name: 'Papas Fritas 150g',
    cat: 'cat-snacks',
    price: 7500,
    stock: 48,
    featured: true,
    images: 2,
  },
  {
    id: 'p-mani',
    name: 'Maní Salado 200g',
    cat: 'cat-snacks',
    price: 6000,
    compareAtPrice: 7500,
    stock: 33,
    featured: false,
    images: 1,
  },
  {
    id: 'p-oculto',
    name: 'Producto Descontinuado',
    cat: 'cat-almacen',
    price: 1000,
    stock: 4,
    featured: false,
    images: 1,
    active: false,
  },
];

async function main() {
  console.log(`Sembrando catálogo demostrativo en staging: ${projectId}`);
  const token = await accessToken();

  await patchDoc(token, 'settings/public', {
    storeName: 'Mercado 48',
    storeDescription:
      'Lo pedís hoy, lo tenés en 48 horas. Datos demostrativos para revisión (staging).',
    whatsappNumberDisplay: '0981 000 000',
    whatsappNumberNormalized: '+595981000000',
    supportEmail: 'demo@gasmarket.example',
    address: 'Calle Demostración 123',
    city: 'Asunción',
    country: 'Paraguay',
    currency: 'PYG',
    locale: 'es-PY',
    timezone: 'America/Asuncion',
    pickupEnabled: true,
    deliveryEnabled: true,
    acceptedPaymentMethods: ['cash', 'bank_transfer', 'pay_on_pickup'],
    deliveryZones: [
      { id: 'z-centro', name: 'Centro', cost: 15000, active: true, order: 0 },
      { id: 'z-periferia', name: 'Periferia', cost: 25000, active: true, order: 1 },
    ],
    orderConfirmationMessage:
      'Gracias por tu compra en la tienda demostrativa. Te contactamos por WhatsApp.',
    active: true,
    updatedAt: now,
    updatedBy: UID,
  });

  for (const c of categories) {
    await patchDoc(token, `categories/${c.id}`, {
      name: c.name,
      normalizedName: c.name.toLowerCase(),
      slug: c.slug,
      description: `Productos de ${c.name.toLowerCase()} (demostración).`,
      imageUrl: svgImage(c.name, c.hue),
      imagePath: '',
      order: c.order,
      active: c.active,
      createdAt: now,
      createdBy: UID,
      updatedAt: now,
      updatedBy: UID,
    });
    await patchDoc(token, `categorySlugs/${c.slug}`, { categoryId: c.id });
  }

  for (const p of products) {
    const hue = catHue[p.cat] ?? 210;
    const images = Array.from({ length: p.images }, (_, i) =>
      image(
        `${p.id}-${i}`,
        `${p.name}${p.images > 1 ? ` (${i + 1})` : ''}`,
        (hue + i * 18) % 360,
        i,
        i === 0,
      ),
    );
    const slug = p.id.replace(/^p-/, '');
    await patchDoc(token, `products/${p.id}`, {
      name: p.name,
      normalizedName: p.name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase(),
      slug,
      shortDescription: `${p.name} — presentación demostrativa.`,
      description: `${p.name}.\n\nProducto ficticio de demostración para la preview de GasMarketplace. Sin datos comerciales reales.`,
      sku: '',
      barcode: '',
      categoryIds: [p.cat],
      primaryCategoryId: p.cat,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      // Sin costPrice: nunca se siembran datos internos en la preview.
      costPrice: null,
      stock: p.stock,
      lowStockThreshold: null,
      trackStock: true,
      allowBackorder: p.allowBackorder === true,
      images,
      featured: p.featured === true,
      active: p.active !== false,
      searchTokens: tokens(p.name),
      createdAt: now,
      createdBy: UID,
      updatedAt: now,
      updatedBy: UID,
    });
    await patchDoc(token, `productSlugs/${slug}`, { productId: p.id });
  }

  const activeProducts = products.filter((p) => p.active !== false).length;
  console.log(
    `Listo: settings/public, ${categories.length} categorías (${categories.filter((c) => c.active).length} activas), ${products.length} productos (${activeProducts} activos).`,
  );
}

main().catch((e) => {
  console.error(String(e).slice(0, 400));
  process.exit(1);
});
