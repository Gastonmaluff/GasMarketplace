import { useCallback, useDeferredValue, useMemo, useRef, useState, useEffect } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon } from '../../components/ui/Icon';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { LoadingState } from '../../components/ui/LoadingState';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { TextField } from '../../components/ui/TextField';
import { Toast } from '../../components/ui/Toast';
import { demoTableRows, type DemoTableRow } from '../data/ui-kit.data';
import { LocalizedInputsDemo } from '../components/LocalizedInputsDemo';

const periodOptions = ['Hoy', 'Semana', 'Mes', 'Rango'] as const;
const tableFilters = ['Todos', 'Activos', 'Pendientes'] as const;
const tableStates = ['Con datos', 'Cargando', 'Vacía', 'Error'] as const;

const tableColumns = [
  {
    key: 'name',
    header: 'Elemento',
    render: (row: DemoTableRow) => (
      <>
        <strong>{row.name}</strong>
        <small>Referencia {row.reference}</small>
      </>
    ),
    sortValue: (row: DemoTableRow) => row.name,
  },
  {
    key: 'status',
    header: 'Estado',
    render: (row: DemoTableRow) =>
      row.status === 'active' ? <Badge>Activo</Badge> : <Badge tone="warning">Pendiente</Badge>,
    sortValue: (row: DemoTableRow) => row.status,
  },
  {
    key: 'category',
    header: 'Categoría',
    render: (row: DemoTableRow) => row.category,
    sortValue: (row: DemoTableRow) => row.category,
  },
  {
    key: 'updated',
    header: 'Actualización',
    render: (row: DemoTableRow) => row.updatedLabel,
    sortValue: (row: DemoTableRow) => row.updatedAt,
  },
  {
    key: 'actions',
    header: 'Acciones',
    align: 'right',
    render: () => (
      <Button size="small" variant="ghost">
        Ver detalle
      </Button>
    ),
  },
] satisfies readonly DataTableColumn<DemoTableRow>[];

export function ComponentsDemoPage() {
  const [activePeriod, setActivePeriod] = useState<(typeof periodOptions)[number]>('Hoy');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<(typeof tableFilters)[number]>('Todos');
  const [tableState, setTableState] = useState<(typeof tableStates)[number]>('Con datos');
  const submitTimeoutRef = useRef<number | undefined>(undefined);
  const deferredTableSearch = useDeferredValue(tableSearch);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const closeToast = useCallback(() => setShowToast(false), []);

  useEffect(() => () => window.clearTimeout(submitTimeoutRef.current), []);

  const filteredRows = useMemo(() => {
    const normalizedSearch = deferredTableSearch.trim().toLocaleLowerCase();
    return demoTableRows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        `${row.name} ${row.reference} ${row.category}`
          .toLocaleLowerCase()
          .includes(normalizedSearch);
      const matchesFilter =
        tableFilter === 'Todos' ||
        (tableFilter === 'Activos' ? row.status === 'active' : row.status === 'pending');
      return matchesSearch && matchesFilter;
    });
  }, [deferredTableSearch, tableFilter]);

  const simulateSubmit = () => {
    setFormSubmitting(true);
    setFormError(undefined);
    window.clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = window.setTimeout(() => {
      setFormSubmitting(false);
      setFormError('No pudimos guardar el ejemplo. Revisá los campos indicados.');
    }, 1200);
  };

  const rowsForState = tableState === 'Vacía' ? [] : filteredRows;

  return (
    <div className="demo-page components-page">
      <PageHeader
        breadcrumbs={[{ label: 'Demo', href: '/demo' }, { label: 'Componentes' }]}
        description="Primitivas visuales genéricas, accesibles y listas para combinar en futuros sistemas."
        eyebrow="UI Kit"
        primaryAction={<Button onClick={() => setShowToast(true)}>Mostrar notificación</Button>}
        title="Catálogo de componentes"
      >
        <div className="catalog-toolbar">
          <label className="search-field">
            <span className="sr-only">Buscar componentes</span>
            <Icon name="search" />
            <input placeholder="Buscar en el catálogo…" type="search" />
          </label>
          <div aria-label="Período" className="segmented-control" role="group">
            {periodOptions.map((option) => (
              <button
                aria-pressed={activePeriod === option}
                key={option}
                onClick={() => setActivePeriod(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="catalog-grid">
        <section className="showcase-section" aria-labelledby="buttons-title">
          <header className="showcase-section__header">
            <h2 id="buttons-title">Botones y badges</h2>
            <p>Jerarquías de acción y estados sin usar el verde como acción secundaria.</p>
          </header>
          <div className="component-row">
            <Button>Principal</Button>
            <Button variant="secondary">Secundario neutral</Button>
            <Button variant="ghost">Sutil</Button>
            <Button variant="danger">Eliminar</Button>
            <Button disabled>Deshabilitado</Button>
            <Button loading loadingLabel="Guardando ejemplo">
              Conserva su ancho
            </Button>
          </div>
          <div className="component-row">
            <Badge>Éxito</Badge>
            <Badge tone="info">Información</Badge>
            <Badge tone="warning">Pendiente</Badge>
            <Badge tone="danger">Error</Badge>
            <Badge tone="neutral">Borrador</Badge>
          </div>
        </section>

        <section className="showcase-section catalog-section--wide" aria-labelledby="forms-title">
          <header className="showcase-section__header">
            <h2 id="forms-title">Estados de formulario</h2>
            <p>Etiquetas siempre visibles, mensajes asociados y estados nativos accesibles.</p>
          </header>
          {formError ? (
            <Alert title="Error general del formulario" tone="danger">
              {formError}
            </Alert>
          ) : null}
          <form
            className="form-showcase"
            onSubmit={(event) => {
              event.preventDefault();
              simulateSubmit();
            }}
          >
            <TextField
              helpText="Texto de ayuda para completar el campo."
              label="Campo normal"
              placeholder="Escribí un valor"
            />
            <TextField
              defaultValue="Valor requerido"
              label="Campo requerido"
              placeholder="Este dato es obligatorio"
              required
            />
            <TextField
              defaultValue="Valor incorrecto"
              error="Corregí el contenido antes de continuar."
              label="Campo con error"
            />
            <TextField
              defaultValue="Valor verificado"
              label="Campo válido"
              successMessage="El valor es correcto."
            />
            <TextField defaultValue="No disponible" disabled label="Campo deshabilitado" />
            <TextField
              defaultValue="Contenido informativo"
              label="Campo de solo lectura"
              readOnly
            />
            <div className="field field--full">
              <label htmlFor="demo-description">Descripción</label>
              <textarea id="demo-description" placeholder="Agregá contexto adicional…" rows={3} />
            </div>
            <label className="checkbox-field field--full">
              <input type="checkbox" />
              <span>
                Habilitar esta preferencia<small>Podés cambiarla nuevamente cuando quieras.</small>
              </span>
            </label>
            <div className="form-actions field--full">
              <Button loading={formSubmitting} loadingLabel="Enviando formulario" type="submit">
                Guardar ejemplo
              </Button>
              <span>
                {formSubmitting
                  ? 'El formulario se está enviando…'
                  : 'No se realiza ninguna operación externa.'}
              </span>
            </div>
          </form>
        </section>

        <section
          className="showcase-section catalog-section--wide"
          aria-labelledby="localized-inputs-title"
        >
          <header className="showcase-section__header">
            <h2 id="localized-inputs-title">Formatos y normalización</h2>
            <p>
              El valor presentado puede incluir formato regional mientras el dato interno permanece
              limpio y listo para almacenar.
            </p>
          </header>
          <LocalizedInputsDemo />
        </section>

        <section className="showcase-section" aria-labelledby="states-title">
          <header className="showcase-section__header">
            <h2 id="states-title">Estados de contenido</h2>
            <p>Progreso, ausencia de datos y recuperación.</p>
          </header>
          <div className="states-grid">
            <LoadingState label="Preparando contenido" />
            <EmptyState
              action={<Button size="small">Crear elemento</Button>}
              description="Cuando exista contenido, se mostrará en este espacio."
              title="Todavía no hay elementos"
            />
          </div>
        </section>

        <section className="showcase-section" aria-labelledby="feedback-title">
          <header className="showcase-section__header">
            <h2 id="feedback-title">Alertas y diálogo</h2>
            <p>Mensajes persistentes y retroalimentación temporal.</p>
          </header>
          <div className="stack">
            {showAlert ? (
              <Alert
                onDismiss={() => setShowAlert(false)}
                title="Configuración pendiente"
                tone="warning"
              >
                Este mensaje genérico puede descartarse.
              </Alert>
            ) : (
              <Button onClick={() => setShowAlert(true)} size="small" variant="ghost">
                Restaurar alerta
              </Button>
            )}
            <Alert title="No pudimos completar la acción" tone="danger">
              Revisá los datos e intentá nuevamente.
            </Alert>
            <div>
              <Button onClick={() => setIsModalOpen(true)} variant="secondary">
                Abrir modal
              </Button>
            </div>
          </div>
        </section>

        <section className="showcase-section catalog-section--wide" aria-labelledby="table-title">
          <header className="showcase-section__header">
            <h2 id="table-title">Tabla reutilizable</h2>
            <p>Ordenamiento, paginación y estados básicos sin una dependencia adicional.</p>
          </header>
          <div className="table-demo-controls">
            <label className="search-field">
              <span className="sr-only">Buscar resultados</span>
              <Icon name="search" />
              <input
                onChange={(event) => setTableSearch(event.target.value)}
                placeholder="Buscar resultados…"
                type="search"
                value={tableSearch}
              />
            </label>
            <div aria-label="Filtrar resultados" className="segmented-control" role="group">
              {tableFilters.map((filter) => (
                <button
                  aria-pressed={tableFilter === filter}
                  key={filter}
                  onClick={() => setTableFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div
            aria-label="Estado de demostración de la tabla"
            className="table-state-switcher"
            role="group"
          >
            {tableStates.map((state) => (
              <button
                aria-pressed={tableState === state}
                key={state}
                onClick={() => setTableState(state)}
                type="button"
              >
                {state}
              </button>
            ))}
          </div>
          <DataTable
            columns={tableColumns}
            error={
              tableState === 'Error'
                ? 'Ocurrió un error demostrativo al obtener los resultados.'
                : undefined
            }
            getRowKey={(row) => row.id}
            initialSortKey="name"
            loading={tableState === 'Cargando'}
            pageSize={3}
            rows={rowsForState}
          />
        </section>

        <section className="showcase-section catalog-section--wide" aria-labelledby="image-title">
          <header className="showcase-section__header">
            <h2 id="image-title">Carga local de imagen</h2>
            <p>
              Validación y vista previa en el navegador, sin subir archivos a servicios externos.
            </p>
          </header>
          <div className="image-demo">
            <ImageUpload maxSizeBytes={2 * 1024 * 1024} />
          </div>
        </section>
      </div>

      <Modal
        description="Ejemplo de confirmación sin ninguna operación real."
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Confirmar acción"
      >
        <p>Los diálogos enfocan la decisión sin introducir reglas de negocio en la plantilla.</p>
      </Modal>
      {showToast ? (
        <Toast message="La notificación temporal funciona correctamente." onClose={closeToast} />
      ) : null}
    </div>
  );
}
