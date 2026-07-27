import { defineConfig } from 'vitest/config';

// Configuración exclusiva de las pruebas de Security Rules. Corre en Node
// contra Emulator Suite mediante: npm run test:rules
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
