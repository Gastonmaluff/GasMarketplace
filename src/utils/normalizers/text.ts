export type TextNormalizationMode =
  'none' | 'trim' | 'person-name' | 'title-case' | 'uppercase' | 'lowercase';

const DEFAULT_LOCALE = 'es-PY';
const WORD_SEPARATOR_PATTERN = /([-'’])/u;

function capitalizePart(part: string, locale: string) {
  const lower = part.toLocaleLowerCase(locale);
  return lower.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase(locale));
}

function capitalizeWord(word: string, locale: string) {
  return word
    .split(WORD_SEPARATOR_PATTERN)
    .map((part) => (WORD_SEPARATOR_PATTERN.test(part) ? part : capitalizePart(part, locale)))
    .join('');
}

function cleanWhitespace(value: string) {
  return value.trim().replace(/\s+/gu, ' ');
}

export function normalizeText(
  value: string,
  mode: TextNormalizationMode = 'none',
  locale = DEFAULT_LOCALE,
) {
  if (mode === 'none') return value;
  if (mode === 'trim') return value.trim();

  const cleaned = cleanWhitespace(value);
  if (mode === 'uppercase') return cleaned.toLocaleUpperCase(locale);
  if (mode === 'lowercase') return cleaned.toLocaleLowerCase(locale);

  return cleaned
    .split(' ')
    .map((word) => capitalizeWord(word, locale))
    .join(' ');
}
