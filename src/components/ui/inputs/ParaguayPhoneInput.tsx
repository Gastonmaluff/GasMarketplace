import { useState, type InputHTMLAttributes } from 'react';

import {
  formatParaguayPhone,
  isValidParaguayPhone,
  normalizeParaguayPhone,
  type ParaguayPhoneMode,
} from '../../../utils/formatters/paraguay-phone';
import { TextField } from '../TextField';

export interface ParaguayPhoneValue {
  displayValue: string;
  normalizedValue: string;
  isValid: boolean;
}

interface ParaguayPhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'inputMode' | 'onChange' | 'type' | 'value'
> {
  label: string;
  mode?: ParaguayPhoneMode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: ParaguayPhoneValue) => void;
  error?: string;
  helpText?: string;
}

const validationMessages: Record<ParaguayPhoneMode, string> = {
  mobile: 'Ingresá un número móvil paraguayo válido.',
  landline: 'Ingresá un teléfono fijo paraguayo válido.',
  any: 'Ingresá un número paraguayo válido.',
};

export function ParaguayPhoneInput({
  defaultValue = '',
  error,
  helpText,
  label,
  mode = 'any',
  onBlur,
  onValueChange,
  value,
  ...props
}: ParaguayPhoneInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => normalizeParaguayPhone(defaultValue));
  const normalizedValue = isControlled ? value : internalValue;
  const [international, setInternational] = useState(() =>
    /^\s*\+?595/u.test(value ?? defaultValue),
  );
  const [displayValue, setDisplayValue] = useState(() =>
    formatParaguayPhone(defaultValue, { international }),
  );
  const [touched, setTouched] = useState(false);
  const isValid = !normalizedValue || isValidParaguayPhone(normalizedValue, mode);
  const renderedDisplayValue = isControlled
    ? formatParaguayPhone(normalizedValue, { international })
    : displayValue;

  const updateValue = (rawValue: string) => {
    const wantsInternational = /^\s*\+?595/u.test(rawValue);
    const nextNormalized = normalizeParaguayPhone(rawValue);
    const nextDisplay = formatParaguayPhone(rawValue, { international: wantsInternational });
    const nextIsValid = !nextNormalized || isValidParaguayPhone(nextNormalized, mode);

    setInternational(wantsInternational);
    setDisplayValue(nextDisplay);
    if (!isControlled) setInternalValue(nextNormalized);
    onValueChange?.({
      displayValue: nextDisplay,
      isValid: nextIsValid,
      normalizedValue: nextNormalized,
    });
  };

  return (
    <TextField
      {...props}
      error={error ?? (touched && !isValid ? validationMessages[mode] : undefined)}
      helpText={helpText}
      inputMode="tel"
      label={label}
      onBlur={(event) => {
        setTouched(true);
        onBlur?.(event);
      }}
      onChange={(event) => updateValue(event.target.value)}
      type="tel"
      value={renderedDisplayValue}
    />
  );
}
