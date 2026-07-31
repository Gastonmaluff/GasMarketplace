/**
 * Asigna el custom claim { admin: true } a un usuario de Firebase Authentication.
 *
 * Uso (desde functions/):
 *   node scripts/set-admin-claim.cjs <email> [password] --project <projectId>
 *
 * - Contra el emulador: definir FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099.
 *   Si el usuario no existe y se pasa password, se crea.
 * - Contra un proyecto real: exige --project explicito y credenciales
 *   privilegiadas de entorno (GOOGLE_APPLICATION_CREDENTIALS o gcloud ADC).
 * - Contra produccion (gasmarketplace-65156): exige ademas --confirm-production.
 *
 * El script no imprime contrasenas, tokens ni credenciales.
 */
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const rawArgs = process.argv.slice(2);
const PRODUCTION_PROJECT = 'gasmarketplace-65156';
const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
const confirmProduction = rawArgs.includes('--confirm-production');

function argValue(name) {
  const raw = rawArgs.find((arg) => arg.startsWith(`${name}=`));
  if (raw) return raw.slice(name.length + 1);
  const index = rawArgs.indexOf(name);
  return index >= 0 ? rawArgs[index + 1] : undefined;
}

const positionalArgs = rawArgs.filter(
  (arg, index) =>
    arg !== '--confirm-production' &&
    arg !== '--project' &&
    rawArgs[index - 1] !== '--project' &&
    !arg.startsWith('--project='),
);
const [email, password] = positionalArgs;
const projectId = usingEmulator
  ? (argValue('--project') ?? 'gasmarketplace-local')
  : argValue('--project');

if (!email || !projectId) {
  console.error(
    'Uso: node scripts/set-admin-claim.cjs <email> [password] --project <projectId> [--confirm-production]',
  );
  process.exit(1);
}

if (!usingEmulator && projectId === PRODUCTION_PROJECT && !confirmProduction) {
  console.error(
    'ABORT: el projectId es PRODUCCION. Repeti con --confirm-production si realmente queres continuar.',
  );
  process.exit(1);
}

initializeApp({ projectId });

async function main() {
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    if (!usingEmulator) {
      console.error(
        `El usuario ${email} no existe. En un proyecto real el script no crea usuarios.`,
      );
      process.exit(1);
    }
    if (!password) {
      console.error(`El usuario ${email} no existe. Pasa una contrasena para crearlo.`);
      process.exit(1);
    }
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Usuario creado: ${user.uid}`);
  }

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(
    `Claim admin asignado a ${email} (${user.uid}) en ${usingEmulator ? 'el emulador' : projectId}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
