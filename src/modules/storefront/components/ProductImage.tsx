import { useState, type ImgHTMLAttributes } from 'react';

import { Icon } from '../../../components/ui/Icon';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt: string;
}

/**
 * Imagen de producto con placeholder accesible cuando no hay URL o falla la
 * carga. Evita layout shift porque el contenedor mantiene su relación de aspecto
 * vía CSS.
 */
export function ProductImage({ alt, className = '', src, ...props }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span aria-label={alt} className={`product-image-fallback ${className}`.trim()} role="img">
        <Icon name="box" size={28} />
      </span>
    );
  }

  return (
    <img alt={alt} className={className} onError={() => setFailed(true)} src={src} {...props} />
  );
}
