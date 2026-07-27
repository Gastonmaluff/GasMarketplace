const MAX_SLUG_LENGTH = 80;
const MAX_TOKENS = 30;
const MAX_TOKEN_LENGTH = 30;
const MIN_TOKEN_LENGTH = 2;

/**
 * Convierte un nombre visible en un slug estable: minúsculas, sin tildes ni
 * caracteres incompatibles, palabras separadas por guiones. El nombre visible
 * original conserva sus mayúsculas y tildes; esto solo afecta a la URL.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-$/u, '');
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value) && value.length <= MAX_SLUG_LENGTH;
}

/** Normaliza SKU o código de barras para usarlos como clave de unicidad. */
export function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/gu, '');
}

/**
 * Tokens de búsqueda simples: palabras normalizadas del nombre más códigos.
 * Se generan siempre en el servicio; nunca se aceptan del formulario.
 */
export function buildSearchTokens(parts: readonly (string | undefined)[]): string[] {
  const tokens = new Set<string>();

  for (const part of parts) {
    if (!part) continue;
    const normalized = part
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    for (const word of normalized.split(/[^a-z0-9]+/u)) {
      if (word.length >= MIN_TOKEN_LENGTH && word.length <= MAX_TOKEN_LENGTH) {
        tokens.add(word);
      }
      if (tokens.size >= MAX_TOKENS) return [...tokens];
    }
  }

  return [...tokens];
}
