import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEventHandler,
  type InputHTMLAttributes,
} from 'react';

import { appConfig } from '../../../config/app.config';
import {
  cleanNumericEntry,
  formatNumericValue,
  parseNumericValue,
  resolveNumericDecimals,
} from '../../../utils/formatters/number';
import { TextField } from '../TextField';

interface NumericInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'inputMode' | 'max' | 'min' | 'onChange' | 'type' | 'value'
> {
  label: string;
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  decimals?: number;
  allowNegative?: boolean;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  currency?: string;
  locale?: string;
  error?: string;
  helpText?: string;
}

function clampValue(value: number, min?: number, max?: number) {
  return Math.min(
    max ?? Number.POSITIVE_INFINITY,
    Math.max(min ?? Number.NEGATIVE_INFINITY, value),
  );
}

export function NumericInput({
  allowEmpty = true,
  allowNegative = false,
  currency,
  decimals: decimalsProp,
  defaultValue = null,
  error,
  helpText,
  id,
  label,
  locale = appConfig.locale,
  max,
  min,
  onBlur,
  onFocus,
  onValueChange,
  prefix,
  suffix,
  value,
  ...props
}: NumericInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const decimals = resolveNumericDecimals(currency, decimalsProp);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  const [displayValue, setDisplayValue] = useState(() =>
    formatNumericValue(currentValue ?? null, { currency, decimals, locale, prefix, suffix }),
  );
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplayValue(
        formatNumericValue(currentValue ?? null, { currency, decimals, locale, prefix, suffix }),
      );
    }
  }, [currency, currentValue, decimals, locale, prefix, suffix]);

  const updateValue = (nextValue: number | null) => {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = (event) => {
    isFocusedRef.current = true;
    setDisplayValue(
      currentValue === null || currentValue === undefined
        ? ''
        : new Intl.NumberFormat(locale, {
            maximumFractionDigits: decimals,
            minimumFractionDigits: 0,
            useGrouping: false,
          }).format(currentValue),
    );
    onFocus?.(event);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    isFocusedRef.current = false;
    let nextValue = parseNumericValue(displayValue, { allowNegative, decimals, locale });

    if (nextValue === null && !allowEmpty) nextValue = min ?? 0;
    if (nextValue !== null) nextValue = clampValue(nextValue, min, max);

    updateValue(nextValue);
    setDisplayValue(formatNumericValue(nextValue, { currency, decimals, locale, prefix, suffix }));
    onBlur?.(event);
  };

  return (
    <TextField
      {...props}
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={currentValue ?? undefined}
      error={error}
      helpText={helpText}
      id={inputId}
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      label={label}
      onBlur={handleBlur}
      onChange={(event) => {
        const cleaned = cleanNumericEntry(event.target.value, { allowNegative, decimals, locale });
        setDisplayValue(cleaned);
        updateValue(parseNumericValue(cleaned, { allowNegative, decimals, locale }));
      }}
      onFocus={handleFocus}
      role="spinbutton"
      type="text"
      value={displayValue}
    />
  );
}
