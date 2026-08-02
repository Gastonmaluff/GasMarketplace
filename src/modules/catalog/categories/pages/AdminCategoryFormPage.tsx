import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { ImageUpload } from '../../../../components/ui/ImageUpload';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { NumericInput } from '../../../../components/ui/inputs/NumericInput';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { TextField } from '../../../../components/ui/TextField';
import { slugify } from '../../shared/text';
import { CatalogError } from '../../shared/catalog-context';
import { getCategory, saveCategory } from '../category.service';
import type { CategoryDraft } from '../category.types';

const emptyDraft: CategoryDraft = {
  name: '',
  slug: '',
  description: '',
  order: 0,
  active: true,
};

export function AdminCategoryFormPage() {
  const navigate = useNavigate();
  const { id: categoryId } = useParams<{ id: string }>();
  const isNew = categoryId === undefined;

  const [draft, setDraft] = useState<CategoryDraft | null>(isNew ? emptyDraft : null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | null | undefined>();
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [existingIconUrl, setExistingIconUrl] = useState<string | undefined>();
  const [iconFile, setIconFile] = useState<File | null | undefined>();
  const [iconProgress, setIconProgress] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    getCategory(categoryId)
      .then((category) => {
        if (cancelled) return;
        if (!category) {
          setLoadError('La categoría no existe.');
          return;
        }
        setDraft({
          name: category.name,
          slug: category.slug,
          description: category.description,
          order: category.order,
          active: category.active,
        });
        setExistingImageUrl(category.imageUrl);
        setExistingIconUrl(category.iconUrl);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudo cargar la categoría.');
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, isNew]);

  if (loadError) {
    return (
      <div className="admin-page">
        <Alert title="Error" tone="danger">
          {loadError}
        </Alert>
        <Button onClick={() => navigate('/admin/categorias')} variant="secondary">
          Volver a categorías
        </Button>
      </div>
    );
  }

  if (!draft) {
    return <LoadingState label="Cargando categoría" />;
  }

  const update = (patch: Partial<CategoryDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  async function handleSave() {
    if (!draft || saving) return;
    setErrors([]);
    setSaving(true);
    setImageProgress(imageFile ? 0 : null);
    setIconProgress(iconFile ? 0 : null);
    try {
      await saveCategory({
        ...(categoryId ? { categoryId } : {}),
        draft,
        ...(imageFile !== undefined ? { imageFile } : {}),
        ...(iconFile !== undefined ? { iconFile } : {}),
        onImageProgress: setImageProgress,
        onIconProgress: setIconProgress,
      });
      navigate('/admin/categorias');
    } catch (cause) {
      setErrors(
        cause instanceof CatalogError
          ? cause.errors
          : ['No se pudo guardar la categoría. Intentá nuevamente.'],
      );
    } finally {
      setSaving(false);
      setImageProgress(null);
      setIconProgress(null);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', href: '/admin' },
          { label: 'Categorías', href: '/admin/categorias' },
          { label: isNew ? 'Nueva' : 'Editar' },
        ]}
        primaryAction={
          <Button loading={saving} loadingLabel="Guardando" onClick={() => void handleSave()}>
            Guardar categoría
          </Button>
        }
        title={isNew ? 'Nueva categoría' : `Editar: ${draft.name || 'categoría'}`}
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
            onChange={(event) => {
              const name = event.currentTarget.value;
              // El slug (URL) se genera solo desde el nombre en categorías nuevas y
              // se congela al editar para no romper enlaces ya publicados.
              update(isNew ? { name, slug: slugify(name) } : { name });
            }}
            required
            value={draft.name}
          />
          <div className="field--full">
            <TextField
              label="Descripción (opcional)"
              onChange={(event) => update({ description: event.currentTarget.value })}
              value={draft.description}
            />
          </div>
          <NumericInput
            allowEmpty={false}
            helpText="Posición en el listado público (menor aparece primero)."
            label="Orden"
            min={0}
            onValueChange={(value) => update({ order: value ?? 0 })}
            value={draft.order}
          />
          <label className="checkbox-field">
            <input
              checked={draft.active}
              onChange={(event) => update({ active: event.currentTarget.checked })}
              type="checkbox"
            />
            <span>
              Activa<small>Solo las categorías activas serán visibles en la tienda.</small>
            </span>
          </label>
        </div>
      </section>

      <section className="admin-section">
        <h2>Ícono (opcional)</h2>
        <p className="admin-section__hint">
          Se muestra en el menú "Todas las categorías" del storefront. Ideal: imagen cuadrada de
          512×512 px, PNG con fondo transparente.
        </p>
        <ImageUpload
          imageUrl={iconFile === null ? undefined : existingIconUrl}
          label="Seleccionar ícono"
          onFileSelect={setIconFile}
          onRemoveExisting={() => setIconFile(null)}
          progress={iconProgress}
        />
      </section>

      <section className="admin-section">
        <h2>Imagen (opcional)</h2>
        <p className="admin-section__hint">
          Foto grande de la categoría (tarjetas del inicio y cabecera de la categoría).
        </p>
        <ImageUpload
          imageUrl={imageFile === null ? undefined : existingImageUrl}
          onFileSelect={setImageFile}
          onRemoveExisting={() => setImageFile(null)}
          progress={imageProgress}
        />
      </section>
    </div>
  );
}
