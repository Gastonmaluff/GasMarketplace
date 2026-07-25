import { Button } from '../../../components/ui/Button';
import { useAdminSession } from '../hooks/useAdminSession';
import { getAdminAuthService } from '../services/admin-auth.service';

/**
 * Página inicial mínima del panel. Las secciones reales (productos, pedidos,
 * clientes, stock, configuración) llegan en la fase de panel administrativo
 * del roadmap.
 */
export function AdminHomePage() {
  const session = useAdminSession();
  const email = session.status === 'admin' ? session.email : null;

  return (
    <main className="admin-auth" id="main-content">
      <section className="admin-auth__card">
        <header className="admin-auth__header">
          <h1>Panel administrativo</h1>
          {email ? <p>Sesión iniciada como {email}</p> : null}
        </header>
        <p>
          La autenticación administrativa está activa. Los módulos de productos, pedidos, clientes,
          stock y configuración se implementarán en las próximas fases del roadmap.
        </p>
        <Button onClick={() => void getAdminAuthService()?.signOut()} variant="secondary">
          Cerrar sesión
        </Button>
      </section>
    </main>
  );
}
