import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { CatalogError } from '../../shared/catalog-context';
import { getSupplier, saveSupplier } from '../supplier.service';
import type { SupplierDraft } from '../supplier.types';

const emptyDraft: SupplierDraft = {
  name: '',
  contactName: '',
  phone: '',
  notes: '',
  active: true,
};

export function AdminSupplierFormPage() {
  const navigate = useNavigate();
  const notesId = useId();
  const { id: supplierId } = useParams<{ id: string }>();
  const isNew = supplierId === undefined;

  const [draft, setDraft] = useState<SupplierDraft | null>(isNew ? emptyDraft : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    getSupplier(supplierId)
      .then((supplier) => {
        if (cancelled) return;
        if (!supplier) {
          setLoadError('El proveedor no existe.');
          return;
        }
        setDraft({
          name: supplier.name,
          contactName: supplier.contactName ?? '',
          phone: supplier.phone ?? '',
          notes: supplier.notes ?? '',
          active: supplier.active,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudo cargar el proveedor.');
      });
    return () => {
      cancelled = true;
    };
  }, [supplierId, isNew]);

  if (loadError) {
    return (
      <div className="admin-page">
        <Alert title="Error" tone="danger">
          {loadError}
        </Alert>
        <Button onClick={() => navigate('/admin/proveedores')} variant="secondary">
          Volver a proveedores
        </Button>
      </div>
    );
  }

  if (!draft) {
    return <LoadingState label="Cargando proveedor" />;
  }

  const update = (patch: Partial<SupplierDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  async function handleSave() {
    if (!draft || saving) return;
    setErrors([]);
    setSaving(true);
    try {
      await saveSupplier({ ...(supplierId ? { supplierId } : {}), draft });
      navigate('/admin/proveedores');
    } catch (cause) {
      setErrors(
        cause instanceof CatalogError
          ? cause.errors
          : ['No se pudo guardar el proveedor. Intentá nuevamente.'],
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', href: '/admin' },
          { label: 'Proveedores', href: '/admin/proveedores' },
          { label: isNew ? 'Nuevo' : 'Editar' },
        ]}
        primaryAction={
          <Button loading={saving} loadingLabel="Guardando" onClick={() => void handleSave()}>
            Guardar proveedor
          </Button>
        }
        title={isNew ? 'Nuevo proveedor' : `Editar: ${draft.name || 'proveedor'}`}
      />

      {errors.length > 0 ? (
        <Alert onDismiss={() => setErrors([])} title="Revisá estos puntos" tone="danger">
          {errors.join(' ')}
        </Alert>
      ) : null}

      <section className="admin-section">
        <div className="form-grid">
          <TextField
            label="Nombre"
            onChange={(event) => update({ name: event.currentTarget.value })}
            required
            value={draft.name}
          />
          <TextField
            label="Contacto (opcional)"
            onChange={(event) => update({ contactName: event.currentTarget.value })}
            value={draft.contactName}
          />
          <TextField
            label="Teléfono (opcional)"
            onChange={(event) => update({ phone: event.currentTarget.value })}
            value={draft.phone}
          />
          <div className="field--full text-field">
            <label htmlFor={notesId}>Notas (opcional)</label>
            <textarea
              className="text-field__input"
              id={notesId}
              onChange={(event) => update({ notes: event.currentTarget.value })}
              rows={3}
              value={draft.notes}
            />
          </div>
          <label className="checkbox-field">
            <input
              checked={draft.active}
              onChange={(event) => update({ active: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Activo<small>Solo los proveedores activos aparecen para asignar.</small>
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}
