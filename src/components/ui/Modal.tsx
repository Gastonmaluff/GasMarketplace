import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from './Button';
import { Icon } from './Icon';

interface ModalProps {
  children: ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function Modal({ children, description, isOpen, onClose, title }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-describedby={description ? 'demo-modal-description' : undefined}
        aria-labelledby="demo-modal-title"
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="modal__header">
          <div>
            <h2 id="demo-modal-title">{title}</h2>
            {description ? <p id="demo-modal-description">{description}</p> : null}
          </div>
          <button
            aria-label="Cerrar modal"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="modal__content">{children}</div>
        <footer className="modal__footer">
          <Button onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={onClose}>Confirmar</Button>
        </footer>
      </section>
    </div>
  );
}
