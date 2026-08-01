import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Las pruebas de Security Rules y de Cloud Functions corren aparte
    // contra el emulador (npm run test:rules; npm --prefix functions run
    // test); no forman parte del suite estándar ni de CI.
    exclude: [...configDefaults.exclude, 'tests/rules/**', 'functions/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/main.tsx', 'src/test/**'],
    },
  },
});
