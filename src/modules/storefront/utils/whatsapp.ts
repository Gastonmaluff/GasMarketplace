/**
 * Construye un enlace wa.me a partir del número normalizado (+595…). Devuelve
 * null si no hay número configurado, para que la UI oculte el botón.
 */
export function buildWhatsappLink(normalizedNumber: string, message?: string): string | null {
  const digits = normalizedNumber.replace(/[^0-9]/gu, '');
  if (digits === '') return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function productInquiryMessage(productName: string): string {
  return `Hola, quiero consultar por ${productName}.`;
}
