import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Las pruebas nunca deben depender del .env.local del desarrollador ni
// inicializar el SDK real: Firebase queda "sin configurar" en todo el suite.
vi.stubEnv('VITE_FIREBASE_API_KEY', '');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', '');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '');
vi.stubEnv('VITE_FIREBASE_APP_ID', '');
vi.stubEnv('VITE_FIREBASE_USE_EMULATORS', '');

afterEach(cleanup);
