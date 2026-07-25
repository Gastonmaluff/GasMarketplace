export interface NumericFormatOptions {
  locale?: string;
  decimals?: number;
  currency?: string;
  prefix?: string;
  suffix?: string;
}

export interface NumericParseOptions {
  locale?: string;
  decimals?: number;
  allowNegative?: boolean;
}

const DEFAULT_LOCALE = 'es-PY';

export function resolveNumericDecimals(currency?: string, decimals?: number) {
  if (decimals !== undefined) return Math.max(0, decimals);
  return currency === 'PYG' ? 0 : 0;
}

function getNumberSeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? ',',
    group: parts.find((part) => part.type === 'group')?.value ?? '.',
  };
}

export function cleanNumericEntry(
  input: string,
  { allowNegative = false, decimals = 0, locale = DEFAULT_LOCALE }: NumericParseOptions = {},
) {
  const { decimal, group } = getNumberSeparators(locale);
  const hasNegativeSign = allowNegative && input.trimStart().startsWith('-');
  const withoutGroups = input.split(group).join('');
  const digitsAndDecimal = withoutGroups.replace(new RegExp(`[^0-9${decimal}]`, 'gu'), '');
  const [integerPart = '', ...fractionParts] = digitsAndDecimal.split(decimal);
  const fraction = fractionParts.join('').slice(0, Math.max(0, decimals));
  const integer = integerPart.replace(/^0+(?=\d)/u, '') || (digitsAndDecimal ? '0' : '');
  const sign = hasNegativeSign ? '-' : '';

  if (decimals > 0 && digitsAndDecimal.includes(decimal)) {
    return `${sign}${integer}${decimal}${fraction}`;
  }

  return `${sign}${integer}`;
}

export function parseNumericValue(input: string, options: NumericParseOptions = {}) {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const { decimal } = getNumberSeparators(locale);
  const cleaned = cleanNumericEntry(input, options);

  if (!cleaned || cleaned === '-' || cleaned === decimal || cleaned === `-${decimal}`) return null;

  const value = Number(cleaned.replace(decimal, '.'));
  return Number.isFinite(value) ? value : null;
}

export function formatNumericValue(value: number | null, options: NumericFormatOptions = {}) {
  if (value === null || !Number.isFinite(value)) return '';

  const locale = options.locale ?? DEFAULT_LOCALE;
  const decimals = resolveNumericDecimals(options.currency, options.decimals);
  const formatted = new Intl.NumberFormat(locale, {
    ...(options.currency ? { currency: options.currency, style: 'currency' as const } : {}),
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);

  return `${options.prefix ?? ''}${formatted}${options.suffix ?? ''}`;
}
