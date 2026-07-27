import { describe, expect, it } from 'vitest';

import { buildWhatsappLink, productInquiryMessage } from './whatsapp';

describe('buildWhatsappLink', () => {
  it('construye un enlace wa.me a partir del número normalizado', () => {
    expect(buildWhatsappLink('+595981123456')).toBe('https://wa.me/595981123456');
  });

  it('codifica el mensaje en el query', () => {
    const link = buildWhatsappLink('+595981123456', 'Hola, quiero consultar por Café 500g.');
    expect(link).toContain('https://wa.me/595981123456?text=');
    expect(link).toContain('Caf%C3%A9');
    expect(link).not.toContain(' ');
  });

  it('devuelve null cuando no hay número', () => {
    expect(buildWhatsappLink('')).toBeNull();
    expect(buildWhatsappLink('   ')).toBeNull();
  });
});

describe('productInquiryMessage', () => {
  it('arma el mensaje de consulta con el nombre del producto', () => {
    expect(productInquiryMessage('Yerba Mate')).toBe('Hola, quiero consultar por Yerba Mate.');
  });
});
