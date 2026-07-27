import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import { Button } from './Button';
import { Icon } from './Icon';

const defaultAcceptedTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;

interface ImageUploadProps {
  acceptedTypes?: readonly string[];
  label?: string;
  maxSizeBytes?: number;
  /** Notifica el archivo local seleccionado (o null al quitarlo). */
  onFileSelect?: (file: File | null) => void;
  /** Imagen remota ya guardada, mostrada mientras no haya selección local. */
  imageUrl?: string;
  /** Pedido de quitar la imagen remota existente. */
  onRemoveExisting?: () => void;
  /** Progreso de subida 0-100; null u undefined cuando no hay subida activa. */
  progress?: number | null;
}

function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

export function ImageUpload({
  acceptedTypes = defaultAcceptedTypes,
  imageUrl,
  label = 'Seleccionar imagen',
  maxSizeBytes = 5 * 1024 * 1024,
  onFileSelect,
  onRemoveExisting,
  progress,
}: ImageUploadProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string>();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = () => {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return undefined;
    });
    setFileName(undefined);
    setError(undefined);
    setProcessing(false);
    clearInput();
    onFileSelect?.(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      setError('El formato seleccionado no está permitido.');
      clearInput();
      return;
    }
    if (file.size > maxSizeBytes) {
      setError(`La imagen supera el límite de ${formatMegabytes(maxSizeBytes)}.`);
      clearInput();
      return;
    }

    setError(undefined);
    setFileName(file.name);
    setProcessing(true);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
    onFileSelect?.(file);
  };

  const acceptedLabel = acceptedTypes.map((type) => type.split('/')[1]?.toUpperCase()).join(', ');
  const displayUrl = previewUrl ?? imageUrl;
  const uploading = typeof progress === 'number';

  return (
    <div className="image-upload">
      {displayUrl ? (
        <div className="image-upload__preview">
          <img
            alt={`Vista previa de ${fileName ?? 'imagen guardada'}`}
            onError={() => {
              setError('No pudimos procesar la imagen seleccionada.');
              setProcessing(false);
            }}
            onLoad={() => setProcessing(false)}
            src={displayUrl}
          />
          {processing && previewUrl ? (
            <div className="image-upload__processing" role="status">
              <span aria-hidden="true" className="spinner" /> Procesando imagen
            </div>
          ) : null}
          {uploading ? (
            <div aria-live="polite" className="image-upload__processing" role="status">
              Subiendo {Math.round(progress)}%
            </div>
          ) : null}
        </div>
      ) : (
        <label className="image-upload__dropzone" htmlFor={inputId}>
          <span className="image-upload__placeholder">
            <Icon name="upload" size={24} />
            <strong>{label}</strong>
            <small>
              {acceptedLabel} · Máximo {formatMegabytes(maxSizeBytes)}
            </small>
          </span>
        </label>
      )}
      <input
        accept={acceptedTypes.join(',')}
        aria-describedby={error ? errorId : undefined}
        id={inputId}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      {fileName ? (
        <div className="image-upload__details">
          <p>
            <strong>Archivo seleccionado</strong>
            <span>{fileName}</span>
          </p>
          <div className="image-upload__actions">
            <label className="button button--ghost button--small" htmlFor={inputId}>
              Cambiar imagen
            </label>
            <Button disabled={uploading} onClick={removeImage} size="small" variant="danger">
              Eliminar imagen
            </Button>
          </div>
        </div>
      ) : displayUrl ? (
        <div className="image-upload__actions">
          <label className="button button--ghost button--small" htmlFor={inputId}>
            Cambiar imagen
          </label>
          {onRemoveExisting ? (
            <Button disabled={uploading} onClick={onRemoveExisting} size="small" variant="danger">
              Quitar imagen
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="image-upload__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
