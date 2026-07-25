import { useEffect } from 'react';

import { Icon } from './Icon';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ duration = 3500, message, onClose }: ToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, onClose]);

  return (
    <div aria-live="polite" className="toast" role="status">
      <span className="toast__icon">
        <Icon name="check" />
      </span>
      <div>
        <strong>Acción completada</strong>
        <p>{message}</p>
      </div>
      <button
        aria-label="Cerrar notificación"
        className="icon-button"
        onClick={onClose}
        type="button"
      >
        <Icon name="close" />
      </button>
    </div>
  );
}
