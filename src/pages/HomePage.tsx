import { Link } from 'react-router-dom';

import { appConfig } from '../config/app.config';
import { isFirebaseConfigured } from '../lib/firebase/config';

const foundations = [
  ['Arquitectura clara', 'Capas pequeñas y predecibles para crecer sin mezclar responsabilidades.'],
  [
    'Calidad integrada',
    'TypeScript estricto, pruebas, lint y build automatizados desde el inicio.',
  ],
  [
    'Personalización central',
    'Nombre, identidad visual y preferencias globales en un único archivo.',
  ],
];

export function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-section__content">
          <p className="eyebrow">Plantilla base profesional</p>
          <h1>Una base sólida para el próximo sistema web.</h1>
          <p className="hero-section__lead">{appConfig.description}</p>
          <div className="button-group">
            <Link className="button button--primary" to="/demo">
              Explorar demostración
            </Link>
            <a className="button button--ghost" href="#fundamentos">
              Ver fundamentos
            </a>
          </div>
        </div>
        <div className="readiness-card" aria-label="Estado de la plantilla">
          <div className="readiness-card__header">
            <span>Estado del entorno</span>
            <span className="badge">Listo</span>
          </div>
          <dl>
            <div>
              <dt>Interfaz base</dt>
              <dd>Disponible</dd>
            </div>
            <div>
              <dt>Rutas públicas e internas</dt>
              <dd>Disponibles</dd>
            </div>
            <div>
              <dt>Firebase</dt>
              <dd>{isFirebaseConfigured ? 'Configurado' : 'Pendiente de configurar'}</dd>
            </div>
          </dl>
          {!isFirebaseConfigured && (
            <p className="notice">
              La aplicación funciona sin credenciales. Copiá <code>.env.example</code> cuando
              quieras conectar Firebase.
            </p>
          )}
        </div>
      </section>
      <section className="foundations" id="fundamentos" aria-labelledby="foundations-title">
        <div className="section-heading">
          <p className="eyebrow">Preparada para evolucionar</p>
          <h2 id="foundations-title">Lo esencial, sin decisiones de negocio prematuras.</h2>
        </div>
        <div className="card-grid">
          {foundations.map(([title, description], index) => (
            <article className="feature-card" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
