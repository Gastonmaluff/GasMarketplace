import { createContext, useContext } from 'react';

import type { Category } from '../../catalog';
import type { PublicStoreSettings } from '../../store-settings';

export interface StorefrontData {
  status: 'ready';
  settings: PublicStoreSettings;
  categories: Category[];
}

export const StorefrontDataContext = createContext<StorefrontData | null>(null);

/** Datos compartidos del storefront (settings + categorías activas). */
export function useStorefrontContext(): StorefrontData {
  const context = useContext(StorefrontDataContext);
  if (!context) {
    throw new Error('useStorefrontContext debe usarse dentro de StorefrontLayout.');
  }
  return context;
}
