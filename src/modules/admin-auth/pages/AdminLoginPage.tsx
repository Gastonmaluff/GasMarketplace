import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { isAuthError } from '@gaston/auth';

import { appConfig } from '../../../config/app.config';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { getAdminAuthService, isCurrentUserAdmin } from '../services/admin-auth.service';

const ACCESS_DENIED_MESSAGE = 'La cuenta no tiene permisos de administración.';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const service = getAdminAuthService();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (service === null || submitting) return;

    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await service.signIn({ email, password });
      if (await isCurrentUserAdmin()) {
        navigate('/admin', { replace: true });
        return;
      }
      await service.signOut();
      setError(ACCESS_DENIED_MESSAGE);
    } catch (cause) {
      setError(isAuthError(cause) ? cause.message : 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    if (service === null || submitting) return;

    setError(null);
    setInfo(null);
    if (email.trim() === '') {
      setError('Ingresá tu correo electrónico para recuperar la contraseña.');
      return;
    }
    try {
      await service.sendPasswordReset({ email });
      setInfo('Te enviamos un correo con instrucciones para restablecer la contraseña.');
    } catch (cause) {
      setError(isAuthError(cause) ? cause.message : 'Ocurrió un error inesperado.');
    }
  }

  return (
    <main className="admin-auth" id="main-content">
      <section aria-labelledby="admin-login-title" className="admin-auth__card">
        <header className="admin-auth__header">
          <img alt="" height="40" src={appConfig.branding.logoCompact} width="40" />
          <h1 id="admin-login-title">Panel administrativo</h1>
          <p>{appConfig.name}</p>
        </header>
        {service === null ? (
          <Alert title="Firebase pendiente" tone="warning">
            La autenticación no está disponible porque Firebase todavía no fue configurado en este
            entorno.
          </Alert>
        ) : (
          <form className="admin-auth__form" onSubmit={(event) => void handleSubmit(event)}>
            {error ? (
              <Alert
                onDismiss={() => setError(null)}
                title="No se pudo iniciar sesión"
                tone="danger"
              >
                {error}
              </Alert>
            ) : null}
            {info ? (
              <Alert onDismiss={() => setInfo(null)} title="Correo enviado" tone="success">
                {info}
              </Alert>
            ) : null}
            <TextField
              autoComplete="email"
              label="Correo electrónico"
              name="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              type="email"
              value={email}
            />
            <TextField
              autoComplete="current-password"
              label="Contraseña"
              name="password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
            <Button loading={submitting} loadingLabel="Ingresando" type="submit">
              Ingresar
            </Button>
            <Button onClick={() => void handlePasswordReset()} size="small" variant="ghost">
              ¿Olvidaste tu contraseña?
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
