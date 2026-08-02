import { useEffect, useId, useRef, useState } from 'react';

import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui/Icon';
import { TextField } from '../../../../components/ui/TextField';
import { normalizeText } from '../../../../utils/normalizers/text';
import { CatalogError } from '../../shared/catalog-context';
import { slugify } from '../../shared/text';
import { saveCategory } from '../category.service';
import type { Category } from '../category.types';

interface CategoryQuickCreateModalProps {
  onClose: () => void;
  onCreated: (category: Category) => void;
}

/**
 * Modal para crear una categoría sin salir del formulario de producto. Cubre
 * los campos mínimos (nombre, slug, visibilidad); el resto se puede completar
 * después desde el editor de categorías. El componente se monta solo mientras
 * está abierto, así cada apertura parte de un estado limpio.
 */
export function CategoryQuickCreateModal({ onClose, onCreated }: CategoryQuickCreateModalProps) {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
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
    const draft = { name, slug, description: '', order: 0, active };
    try {
      const id = await saveCategory({ draft });
      onCreated({
        id,
        name: draft.name.trim().replace(/\s+/gu, ' '),
        normalizedName: normalizeText(draft.name, 'lowercase'),
        slug: draft.slug,
        description: '',
        order: 0,
        active: draft.active,
      });
    } catch (cause) {
      setErrors(
        cause instanceof CatalogError
          ? cause.errors
          : ['No se pudo crear la categoría. Intentá nuevamente.'],
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
              <h2 id={titleId}>Nueva categoría</h2>
              <p>Se crea al instante y queda seleccionada en este producto.</p>
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
                onChange={(event) => {
                  const nextName = event.currentTarget.value;
                  setName(nextName);
                  // El slug (URL) se genera solo desde el nombre; no se muestra.
                  setSlug(slugify(nextName));
                }}
                required
                value={name}
              />
              <label className="checkbox-field">
                <input
                  checked={active}
                  onChange={(event) => setActive(event.currentTarget.checked)}
                  type="checkbox"
                />
                <span>
                  Activa<small>Solo las categorías activas serán visibles en la tienda.</small>
                </span>
              </label>
            </div>
          </div>
          <footer className="modal__footer">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancelar
            </Button>
            <Button loading={saving} loadingLabel="Creando" type="submit">
              Crear categoría
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
