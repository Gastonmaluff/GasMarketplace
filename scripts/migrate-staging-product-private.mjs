/**
 * Migra campos internos desde products/{id} hacia productPrivate/{id} en STAGING.
 *
 * Seguro por defecto:
 * - dry-run salvo que se pase --apply.
 * - aborta si el projectId es produccion o no contiene "staging".
 * - idempotente: sobrescribe productPrivate/{id} y elimina costPrice de products/{id}.
 *
 * Uso:
 *   node scripts/migrate-staging-product-private.mjs
 *   node scripts/migrate-staging-product-private.mjs --apply
 *   node scripts/migrate-staging-product-private.mjs --project gasmarketplace-staging-7c3a --apply
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PRODUCTION_PROJECT = 'gasmarketplace-65156';
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');

function argValue(name) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (raw) return raw.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function resolveProjectId() {
  const fromArg = argValue('--project');
  if (fromArg) return fromArg;
  const rc = JSON.parse(readFileSync('.firebaserc', 'utf8'));
  return rc.projects?.staging;
}

const projectId = resolveProjectId();
if (!projectId) {
  console.error('No se pudo determinar el projectId.');
  process.exit(1);
}
if (projectId === PRODUCTION_PROJECT || !projectId.includes('staging')) {
  console.error(`ABORT: "${projectId}" no es un proyecto staging permitido.`);
  process.exit(1);
}

function readRefreshToken() {
  const path = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  const cfg = JSON.parse(readFileSync(path, 'utf8'));
  const token = cfg.tokens?.refresh_token;
  if (!token) throw new Error('No hay refresh_token en firebase-tools.');
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

function fromValue(value) {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromValue);
  if ('mapValue' in value) return fromFields(value.mapValue.fields ?? {});
  return undefined;
}

function fromFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromValue(value)]));
}

function toValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'number')
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  throw new Error(`Tipo no soportado: ${typeof value}`);
}

function toFields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, toValue(value)]));
}

const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

async function request(token, path, init = {}) {
  const res = await fetch(`${base}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok)
    throw new Error(
      `${init.method ?? 'GET'} ${path} fallo: ${res.status} ${(await res.text()).slice(0, 240)}`,
    );
  return res.json();
}

function docId(name) {
  return name.split('/').pop();
}

async function main() {
  console.log(`${apply ? 'Aplicando' : 'Dry-run'} migracion productPrivate en ${projectId}`);
  const token = await accessToken();
  const list = await request(token, 'products?pageSize=300');
  const products = list.documents ?? [];
  let migrated = 0;
  let skipped = 0;

  for (const document of products) {
    const id = docId(document.name);
    const data = fromFields(document.fields ?? {});
    const hasPrivate = Object.prototype.hasOwnProperty.call(data, 'costPrice');
    if (!hasPrivate) {
      skipped += 1;
      continue;
    }
    migrated += 1;
    console.log(`- ${id}: costPrice -> productPrivate/${id}`);
    if (!apply) continue;

    const now = new Date();
    await request(token, `productPrivate/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: toFields({
          productId: id,
          costPrice: data.costPrice,
          supplierName: '',
          internalNotes: '',
          createdAt: now,
          createdBy: 'staging-migration',
          updatedAt: now,
          updatedBy: 'staging-migration',
        }),
      }),
    });
    await request(token, `products/${id}?updateMask.fieldPaths=costPrice`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: {} }),
    });
  }

  console.log(`Listo. Candidatos: ${migrated}. Sin cambios: ${skipped}.`);
  if (!apply) console.log('No se escribio nada. Ejecuta con --apply para aplicar.');
}

main().catch((error) => {
  console.error(String(error).slice(0, 500));
  process.exit(1);
});
