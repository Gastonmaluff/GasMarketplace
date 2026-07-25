/**
 * Asigna el custom claim { admin: true } a un usuario de Firebase Authentication.
 *
 * Uso (desde functions/):
 *   node scripts/set-admin-claim.cjs <email> [password]
 *
 * - Contra el emulador: definir FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099.
 *   Si el usuario no existe y se pasa password, se crea (útil para seed local).
 * - Contra el proyecto real: requiere credenciales de entorno privilegiadas
 *   (GOOGLE_APPLICATION_CREDENTIALS o gcloud ADC). Nunca versionar claves.
 */
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const [email, password] = process.argv.slice(2);

if (!email) {
  console.error('Uso: node scripts/set-admin-claim.cjs <email> [password]');
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
    if (!password) {
      console.error(`El usuario ${email} no existe. Pasá una contraseña para crearlo.`);
      process.exit(1);
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.error(
        'La creación de usuarios desde este script solo se permite contra el emulador.',
      );
      process.exit(1);
    }
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Usuario creado: ${user.uid}`);
  }

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`Claim admin asignado a ${email} (${user.uid}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
