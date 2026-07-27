import { useEffect, useState } from 'react';

import { getAdminAuthService, isCurrentUserAdmin } from '../services/admin-auth.service';

export type AdminSession =
  | { status: 'unavailable' }
  | { status: 'initializing' }
  | { status: 'unauthenticated' }
  | { status: 'checking-claims' }
  | { status: 'admin'; email: string | null }
  | { status: 'not-admin' }
  | { status: 'error'; message: string };

/**
 * Estado de sesión administrativo: combina el estado de @gaston/auth con la
 * verificación del custom claim admin.
 */
export function useAdminSession(): AdminSession {
  const service = getAdminAuthService();
  const [session, setSession] = useState<AdminSession>(() =>
    service === null ? { status: 'unavailable' } : { status: 'initializing' },
  );

  useEffect(() => {
    if (service === null) return undefined;

    let cancelled = false;
    const unsubscribe = service.onSessionStateChanged((state) => {
      if (state.status === 'initializing') {
        setSession({ status: 'initializing' });
        return;
      }
      if (state.status === 'unauthenticated') {
        setSession({ status: 'unauthenticated' });
        return;
      }
      if (state.status === 'error') {
        setSession({ status: 'error', message: state.error.message });
        return;
      }

      setSession({ status: 'checking-claims' });
      const email = state.user.email;
      void isCurrentUserAdmin()
        .then((admin) => {
          if (cancelled) return;
          setSession(admin ? { status: 'admin', email } : { status: 'not-admin' });
        })
        .catch(() => {
          if (!cancelled) setSession({ status: 'not-admin' });
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [service]);

  return session;
}
