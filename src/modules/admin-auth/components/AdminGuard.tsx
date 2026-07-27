import { Navigate, Outlet } from 'react-router-dom';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useAdminSession } from '../hooks/useAdminSession';
import { getAdminAuthService } from '../services/admin-auth.service';

/**
 * Guard de las rutas /admin: exige sesión autenticada con custom claim admin.
 */
export function AdminGuard() {
  const session = useAdminSession();

  if (session.status === 'unavailable') {
    return (
      <main className="admin-auth" id="main-content">
        <Alert title="Firebase pendiente" tone="warning">
          El panel administrativo no está disponible porque Firebase todavía no fue configurado en
          este entorno.
        </Alert>
      </main>
    );
  }

  if (session.status === 'initializing' || session.status === 'checking-claims') {
    return (
      <main className="admin-auth" id="main-content">
        <LoadingState label="Verificando sesión" />
      </main>
    );
  }

  if (session.status === 'not-admin') {
    return (
      <main className="admin-auth" id="main-content">
        <div className="admin-auth__card">
          <Alert title="Acceso denegado" tone="danger">
            La cuenta autenticada no tiene permisos de administración.
          </Alert>
          <Button onClick={() => void getAdminAuthService()?.signOut()} variant="secondary">
            Cerrar sesión
          </Button>
        </div>
      </main>
    );
  }

  if (session.status !== 'admin') {
    return <Navigate replace to="/admin/login" />;
  }

  return <Outlet />;
}
