/**
 * Asigna el custom claim { admin: true } a un usuario de Firebase Authentication.
 *
 * Uso (desde functions/):
 *   node scripts/set-admin-claim.cjs <email> [password]
 *
 * - Contra el emulador: definir FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099.
 *   Si el usuario no existe y se pasa password, se crea (útil para seed local).
 * - Contra el proyecto real: exige el flag --confirm-production además de
 *   credenciales privilegiadas de entorno (GOOGLE_APPLICATION_CREDENTIALS o
 *   gcloud ADC). Nunca versionar claves ni rutas a credenciales.
 *
 * El script no imprime contraseñas, tokens ni credenciales.
 */
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const args = process.argv.slice(2).filter((arg) => arg !== '--confirm-production');
const confirmProduction = process.argv.includes('--confirm-production');
const [email, password] = args;
const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

if (!email) {
  console.error('Uso: node scripts/set-admin-claim.cjs <email> [password] [--confirm-production]');
  process.exit(1);
}

if (!usingEmulator && !confirmProduction) {
  console.error(
    'FIREBASE_AUTH_EMULATOR_HOST no está definido: esto operaría sobre el proyecto REAL.',
  );
  console.error('Para continuar en producción, repetí el comando con --confirm-production.');
  process.exit(1);
}

initializeApp({ projectId: 'gasmarketplace-65156' });

async function main() {
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    if (!usingEmulator) {
      console.error(`El usuario ${email} no existe. En producción el script no crea usuarios.`);
      process.exit(1);
    }
    if (!password) {
      console.error(`El usuario ${email} no existe. Pasá una contraseña para crearlo.`);
      process.exit(1);
    }
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Usuario creado: ${user.uid}`);
  }

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(
    `Claim admin asignado a ${email} (${user.uid}) en ${usingEmulator ? 'el emulador' : 'PRODUCCIÓN'}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
