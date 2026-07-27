import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { applyAppTheme } from './utils/apply-app-theme';
import './styles/global.css';
import './styles/storefront.css';

applyAppTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
