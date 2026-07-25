import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="not-found__code">404</p>
      <p className="eyebrow">Página no encontrada</p>
      <h1>Esta ruta no forma parte de la plantilla.</h1>
      <p>Puede que el enlace sea incorrecto o que el contenido todavía no exista.</p>
      <Link className="button button--primary" to="/">
        Volver al inicio
      </Link>
    </section>
  );
}
