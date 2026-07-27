import { useEffect, useState } from 'react';

import { listActiveCategories, type Category } from '../../catalog';
import {
  createDefaultPublicSettings,
  loadPublicStoreSettings,
  type PublicStoreSettings,
} from '../../store-settings';
import type { StorefrontData } from './storefront-context';

type State = { status: 'loading' } | StorefrontData;

/**
 * Carga inicial del storefront: settings/public y categorías activas en
 * paralelo. Cae a defaults seguros ante fallos parciales para que la tienda
 * siempre renderice.
 */
export function useStorefrontData(): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([loadPublicStoreSettings(), listActiveCategories()]).then((results) => {
      if (cancelled) return;
      const settings: PublicStoreSettings =
        results[0].status === 'fulfilled' ? results[0].value : createDefaultPublicSettings();
      const categories: Category[] = results[1].status === 'fulfilled' ? results[1].value : [];
      setState({ status: 'ready', settings, categories });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
