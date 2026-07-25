export type ParaguayPhoneMode = 'mobile' | 'landline' | 'any';

export interface ParaguayPhoneFormatOptions {
  international?: boolean;
}

export function cleanPhoneDigits(input: string) {
  return input.replace(/\D/gu, '');
}

function getLocalDigits(input: string) {
  const digits = cleanPhoneDigits(input);
  if (digits.startsWith('595')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function normalizeParaguayPhone(input: string) {
  const localDigits = getLocalDigits(input).slice(0, 9);
  return localDigits ? `+595${localDigits}` : '';
}

function groupLandline(localDigits: string) {
  if (localDigits.length <= 2) return localDigits;

  const areaLength = localDigits.length > 8 ? 3 : 2;
  return [
    localDigits.slice(0, areaLength),
    localDigits.slice(areaLength, areaLength + 3),
    localDigits.slice(areaLength + 3),
  ]
    .filter(Boolean)
    .join(' ');
}

export function formatParaguayPhone(
  input: string,
  { international = /^\s*\+?595/u.test(input) }: ParaguayPhoneFormatOptions = {},
) {
  const localDigits = getLocalDigits(input).slice(0, 9);
  if (!localDigits) return international ? '+595' : '';

  const grouped = localDigits.startsWith('9')
    ? [localDigits.slice(0, 3), localDigits.slice(3, 6), localDigits.slice(6, 9)]
        .filter(Boolean)
        .join(' ')
    : groupLandline(localDigits);

  return international ? `+595 ${grouped}` : `0${grouped}`;
}

export function isValidParaguayPhone(input: string, mode: ParaguayPhoneMode = 'any') {
  const localDigits = getLocalDigits(input);
  const isMobile = /^9\d{8}$/u.test(localDigits);
  const isLandline = /^[2-8]\d{6,8}$/u.test(localDigits);

  if (mode === 'mobile') return isMobile;
  if (mode === 'landline') return isLandline;
  return isMobile || isLandline;
}
