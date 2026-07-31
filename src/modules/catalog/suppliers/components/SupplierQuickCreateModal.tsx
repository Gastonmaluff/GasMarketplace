import { useEffect, useId, useRef, useState } from 'react';

import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui/Icon';
import { TextField } from '../../../../components/ui/TextField';
import { normalizeText } from '../../../../utils/normalizers/text';
import { CatalogError } from '../../shared/catalog-context';
import { saveSupplier } from '../supplier.service';
import type { Supplier } from '../supplier.types';

interface SupplierQuickCreateModalProps {
  onClose: () => void;
  onCreated: (supplier: Supplier) => void;
}

/**
 * Modal para crear un proveedor sin salir del formulario de producto. Cubre lo
 * mínimo (nombre, contacto, teléfono); el resto se completa después desde la
 * sección Proveedores. Se monta solo mientras está abierto, así cada apertura
 * parte de un estado limpio.
 */
export function SupplierQuickCreateModal({ onClose, onCreated }: SupplierQuickCreateModalProps) {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => formRef.current?.querySelector('input')?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  async function handleSubmit() {
    if (saving) return;
    setErrors([]);
    setSaving(true);
    const draft = { name, contactName, phone, notes: '', active: true };
    try {
      const id = await saveSupplier({ draft });
      onCreated({
        id,
        name: draft.name.trim().replace(/\s+/gu, ' '),
        normalizedName: normalizeText(draft.name, 'lowercase'),
        active: true,
        ...(draft.contactName.trim() ? { contactName: draft.contactName.trim() } : {}),
        ...(draft.phone.trim() ? { phone: draft.phone.trim() } : {}),
      });
    } catch (cause) {
      setErrors(
        cause instanceof CatalogError
          ? cause.errors
          : ['No se pudo crear el proveedor. Intentá nuevamente.'],
      );
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <form
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <header className="modal__header">
            <div>
              <h2 id={titleId}>Nuevo proveedor</h2>
              <p>Se crea al instante y queda seleccionado en este producto.</p>
            </div>
            <button
              aria-label="Cerrar modal"
              className="icon-button"
              onClick={onClose}
              type="button"
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="modal__content">
            {errors.length > 0 ? (
              <Alert onDismiss={() => setErrors([])} title="Revisá estos puntos" tone="danger">
                {errors.join(' ')}
              </Alert>
            ) : null}
            <div className="form-grid">
              <TextField
                label="Nombre"
                onChange={(event) => setName(event.currentTarget.value)}
                required
                value={name}
              />
              <TextField
                label="Contacto (opcional)"
                onChange={(event) => setContactName(event.currentTarget.value)}
                value={contactName}
              />
              <TextField
                label="Teléfono (opcional)"
                onChange={(event) => setPhone(event.currentTarget.value)}
                value={phone}
              />
            </div>
          </div>
          <footer className="modal__footer">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancelar
            </Button>
            <Button loading={saving} loadingLabel="Creando" type="submit">
              Crear proveedor
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
