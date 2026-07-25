import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { appConfig } from '../../config/app.config';
import { isFirebaseConfigured } from '../../lib/firebase/config';

export function DemoPage() {
  return (
    <div className="demo-page">
      <PageHeader
        breadcrumbs={[{ label: 'Demo', href: '/demo' }, { label: 'Resumen' }]}
        description="Una carcasa interna profesional para acelerar futuros sistemas sin anticipar decisiones de negocio."
        eyebrow="Área interna"
        primaryAction={
          <a className="button button--primary button--medium" href="/demo/componentes">
            <span className="button__content">Explorar UI Kit</span>
          </a>
        }
        secondaryActions={
          <span className="badge badge--neutral">
            {appConfig.locale} · {appConfig.currency}
          </span>
        }
        title="Resumen de la plantilla"
      />
      <section className="metrics" aria-label="Resumen técnico">
        <article>
          <span>Configuración</span>
          <strong>Centralizada</strong>
          <small>Lista para personalizar</small>
        </article>
        <article>
          <span>Firebase</span>
          <strong>{isFirebaseConfigured ? 'Conectado' : 'Sin conectar'}</strong>
          <small>Integración opcional segura</small>
        </article>
        <article>
          <span>Zona horaria</span>
          <strong>{appConfig.timezone}</strong>
          <small>Definida en app.config.ts</small>
        </article>
      </section>
      <div className="demo-grid">
        <EmptyState
          title="Sin módulos instalados"
          description="Este espacio está preparado para agregar módulos reutilizables cuando un sistema real los necesite."
        />
        <div className="component-sample">
          <p className="eyebrow">Componente reutilizable</p>
          <LoadingState label="Ejemplo de estado de carga" />
        </div>
      </div>
    </div>
  );
}
