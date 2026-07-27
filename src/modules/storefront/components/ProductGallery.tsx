import { useRef, useState } from 'react';

import type { ProductImage as ProductImageType } from '../../catalog';
import { ProductImage } from './ProductImage';

interface ProductGalleryProps {
  images: readonly ProductImageType[];
  productName: string;
}

/**
 * Galería con imagen principal y miniaturas. Navegable con teclado (flechas
 * izquierda/derecha entre miniaturas) y usable con touch. Si no hay imágenes,
 * muestra el placeholder accesible.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const ordered = [...images].sort((first, second) => first.order - second.order);
  const initialIndex = Math.max(
    0,
    ordered.findIndex((image) => image.isPrimary),
  );
  const thumbsRef = useRef<HTMLDivElement>(null);
  // El índice activo se ancla al producto: al cambiar de producto se reinicia
  // durante el render (patrón oficial de React), sin setState en un efecto.
  const [selection, setSelection] = useState({ key: productName, index: initialIndex });
  if (selection.key !== productName) {
    setSelection({ key: productName, index: initialIndex });
  }
  const activeIndex = selection.index;
  const setActiveIndex = (index: number) => setSelection({ key: productName, index });

  if (ordered.length === 0) {
    return (
      <div className="gallery">
        <div className="gallery__main">
          <ProductImage alt={productName} src={undefined} />
        </div>
      </div>
    );
  }

  const active = ordered[Math.min(activeIndex, ordered.length - 1)]!;

  function onThumbKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (index + 1) % ordered.length;
      setActiveIndex(next);
      focusThumb(next);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (index - 1 + ordered.length) % ordered.length;
      setActiveIndex(prev);
      focusThumb(prev);
    }
  }

  function focusThumb(index: number) {
    const buttons = thumbsRef.current?.querySelectorAll<HTMLButtonElement>('.gallery__thumb');
    buttons?.[index]?.focus();
  }

  return (
    <div className="gallery">
      <div className="gallery__main">
        <ProductImage alt={active.alt || productName} src={active.url} />
      </div>
      {ordered.length > 1 ? (
        <div
          aria-label="Miniaturas del producto"
          className="gallery__thumbs"
          ref={thumbsRef}
          role="group"
        >
          {ordered.map((image, index) => (
            <button
              aria-current={index === activeIndex}
              aria-label={`Ver imagen ${index + 1} de ${ordered.length}`}
              className="gallery__thumb"
              key={image.id}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => onThumbKeyDown(event, index)}
              type="button"
            >
              <ProductImage
                alt={image.alt || `${productName} ${index + 1}`}
                loading="lazy"
                src={image.url}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
