import { useRef, type ChangeEvent } from 'react';

import { Button } from '../../../../components/ui/Button';
import { TextField } from '../../../../components/ui/TextField';
import { ALLOWED_IMAGE_TYPES, validateImageFile } from '../../shared/images';
import { MAX_PRODUCT_IMAGES, type EditableProductImage } from '../product.types';

interface ProductImagesEditorProps {
  images: EditableProductImage[];
  onChange: (images: EditableProductImage[]) => void;
  onError: (message: string) => void;
  /** Progreso de subida por id de imagen (0-100) durante el guardado. */
  progressById: Readonly<Record<string, number>>;
  disabled?: boolean;
}

function moveImage(images: EditableProductImage[], index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= images.length) return images;
  const next = [...images];
  const [image] = next.splice(index, 1);
  next.splice(target, 0, image!);
  return next;
}

export function ProductImagesEditor({
  disabled = false,
  images,
  onChange,
  onError,
  progressById,
}: ProductImagesEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (files.length === 0) return;
    if (images.length + files.length > MAX_PRODUCT_IMAGES) {
      onError(`Un producto puede tener como máximo ${MAX_PRODUCT_IMAGES} imágenes.`);
    } else {
      const additions: EditableProductImage[] = [];
      for (const file of files) {
        const fileError = validateImageFile(file);
        if (fileError) {
          onError(`${file.name}: ${fileError}`);
          continue;
        }
        additions.push({
          id: crypto.randomUUID(),
          alt: '',
          isPrimary: images.length === 0 && additions.length === 0,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      if (additions.length > 0) onChange([...images, ...additions]);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const update = (id: string, patch: Partial<EditableProductImage>) => {
    onChange(images.map((image) => (image.id === id ? { ...image, ...patch } : image)));
  };

  const remove = (id: string) => {
    const removed = images.find((image) => image.id === id);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    const remaining = images.filter((image) => image.id !== id);
    if (removed?.isPrimary && remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
      remaining[0] = { ...remaining[0]!, isPrimary: true };
    }
    onChange(remaining);
  };

  const setPrimary = (id: string) => {
    onChange(images.map((image) => ({ ...image, isPrimary: image.id === id })));
  };

  return (
    <div className="product-images">
      {images.length === 0 ? (
        <p className="zone-editor__empty">Todavía no hay imágenes cargadas.</p>
      ) : (
        <ul className="product-images__list">
          {images.map((image, index) => {
            const progress = progressById[image.id];
            return (
              <li className="product-images__row" key={image.id}>
                <img
                  alt={image.alt || `Imagen ${index + 1}`}
                  className="product-images__thumb"
                  src={image.previewUrl ?? image.url ?? ''}
                />
                <div className="product-images__fields">
                  <TextField
                    disabled={disabled}
                    label="Texto alternativo"
                    onChange={(event) => update(image.id, { alt: event.currentTarget.value })}
                    value={image.alt}
                  />
                  <label className="checkbox-field">
                    <input
                      checked={image.isPrimary}
                      disabled={disabled}
                      name="primary-image"
                      onChange={() => setPrimary(image.id)}
                      type="radio"
                    />
                    <span>Imagen principal</span>
                  </label>
                  {typeof progress === 'number' ? (
                    <p aria-live="polite" className="product-images__progress">
                      Subiendo {progress}%
                    </p>
                  ) : image.file ? (
                    <p className="product-images__pending">Pendiente de subir al guardar.</p>
                  ) : null}
                </div>
                <div className="product-images__actions">
                  <Button
                    aria-label={`Subir imagen ${index + 1} en el orden`}
                    disabled={disabled || index === 0}
                    onClick={() => onChange(moveImage(images, index, -1))}
                    size="small"
                    variant="ghost"
                  >
                    ↑
                  </Button>
                  <Button
                    aria-label={`Bajar imagen ${index + 1} en el orden`}
                    disabled={disabled || index === images.length - 1}
                    onClick={() => onChange(moveImage(images, index, 1))}
                    size="small"
                    variant="ghost"
                  >
                    ↓
                  </Button>
                  <Button
                    aria-label={`Quitar imagen ${index + 1}`}
                    disabled={disabled}
                    onClick={() => remove(image.id)}
                    size="small"
                    variant="danger"
                  >
                    Quitar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <label
          className={`button button--secondary button--small ${disabled ? 'button--disabled' : ''}`}
          htmlFor="product-images-input"
        >
          Agregar imágenes
        </label>
        <input
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          disabled={disabled}
          hidden
          id="product-images-input"
          multiple
          onChange={handleFiles}
          ref={inputRef}
          type="file"
        />
        <p className="admin-page__note">
          JPEG, PNG o WebP · máximo 5 MB por imagen · hasta {MAX_PRODUCT_IMAGES} imágenes.
        </p>
      </div>
    </div>
  );
}
