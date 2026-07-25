import { useId, type InputHTMLAttributes } from 'react';

import { appConfig } from '../../config/app.config';
import { normalizeText, type TextNormalizationMode } from '../../utils/normalizers/text';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  successMessage?: string;
  normalization?: TextNormalizationMode;
  normalizationLocale?: string;
  onNormalizedValueChange?: (value: string) => void;
}

export function TextField({
  className = '',
  error,
  helpText,
  id,
  label,
  normalization = 'none',
  normalizationLocale = appConfig.locale,
  onBlur,
  onNormalizedValueChange,
  required,
  successMessage,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error ?? successMessage ?? helpText;
  const messageId = message ? `${inputId}-message` : undefined;
  const state = error ? 'error' : successMessage ? 'success' : 'default';

  return (
    <div className={`text-field text-field--${state}`}>
      <label htmlFor={inputId}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        aria-describedby={messageId}
        aria-invalid={error ? true : undefined}
        className={`text-field__input ${className}`.trim()}
        id={inputId}
        onBlur={(event) => {
          const normalized = normalizeText(
            event.currentTarget.value,
            normalization,
            normalizationLocale,
          );
          if (normalized !== event.currentTarget.value) {
            event.currentTarget.value = normalized;
            onNormalizedValueChange?.(normalized);
          }
          onBlur?.(event);
        }}
        required={required}
        {...props}
      />
      {message ? (
        <small className="text-field__message" id={messageId}>
          {message}
        </small>
      ) : null}
    </div>
  );
}
