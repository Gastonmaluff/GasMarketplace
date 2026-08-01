import type { ReactNode } from 'react';

import { appConfig } from '../../../config/app.config';
import { PAYMENT_METHOD_LABELS } from '../../store-settings';
import { StoreBreadcrumbs } from '../components/StoreBreadcrumbs';
import { useStorefrontContext } from '../hooks/storefront-context';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { buildWhatsappLink } from '../utils/whatsapp';

export function FaqPage() {
  const { settings } = useStorefrontContext();

  useDocumentMeta({
    title: `Preguntas frecuentes | ${appConfig.name}`,
    description: 'Cómo comprar, medios de pago, envíos y devoluciones.',
    canonicalPath: '/preguntas-frecuentes',
  });

  const whatsappLink = buildWhatsappLink(settings.whatsappNumberNormalized);
  const paymentMethods = settings.acceptedPaymentMethods.map(
    (method) => PAYMENT_METHOD_LABELS[method],
  );
  const activeZones = settings.deliveryZones.filter((zone) => zone.active);

  const faqs: Array<{ question: string; answer: ReactNode }> = [
    {
      question: '¿Cómo hago un pedido?',
      answer: (
        <p>
          Elegís los productos y los agregás al carrito, completás tus datos en el checkout y
          confirmás. No hace falta crear una cuenta: comprás como invitado y coordinamos el resto
          por WhatsApp si es necesario.
        </p>
      ),
    },
    {
      question: '¿Qué medios de pago aceptan?',
      answer:
        paymentMethods.length > 0 ? (
          <p>{paymentMethods.join(' · ')}.</p>
        ) : (
          <p>Estamos actualizando los medios de pago disponibles. Escribinos y te confirmamos.</p>
        ),
    },
    {
      question: '¿Hacen envíos?',
      answer: settings.deliveryEnabled ? (
        <>
          <p>Sí, hacemos delivery en 48 horas. Las zonas de envío disponibles son:</p>
          <ul>
            {activeZones.map((zone) => (
              <li key={zone.id}>
                <strong>{zone.name}</strong>
                {zone.cities && zone.cities.length > 0
                  ? ` — ${zone.cities.join(', ')}`
                  : ' — resto del país'}
              </li>
            ))}
          </ul>
          <p>El costo exacto se calcula en el checkout según tu ciudad.</p>
        </>
      ) : (
        <p>Por ahora no hacemos envíos; el retiro es en el local.</p>
      ),
    },
    {
      question: '¿Puedo retirar en el local?',
      answer: settings.pickupEnabled ? (
        <p>
          Sí, podés elegir "Retiro en local" en el checkout
          {settings.address ? ` en ${settings.address}` : ''}
          {settings.city ? `, ${settings.city}` : ''}. Coordinamos el horario por WhatsApp.
        </p>
      ) : (
        <p>Por el momento no ofrecemos retiro en local; todos los pedidos son por delivery.</p>
      ),
    },
    {
      question: '¿Puedo devolver un producto?',
      answer: (
        <p>
          Sí, aceptamos devoluciones hasta 7 días después de recibido el pedido. Escribinos por
          WhatsApp contándonos qué pasó y coordinamos el cambio o la devolución.
        </p>
      ),
    },
    {
      question: '¿Cómo los contacto?',
      answer: (
        <p>
          {whatsappLink ? (
            <>
              Por WhatsApp al{' '}
              <a href={whatsappLink} rel="noopener noreferrer" target="_blank">
                {settings.whatsappNumberDisplay || settings.whatsappNumberNormalized}
              </a>
              {settings.supportEmail ? ', ' : '.'}
            </>
          ) : null}
          {settings.supportEmail ? (
            <>
              o por correo a <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>
              .
            </>
          ) : null}
        </p>
      ),
    },
  ];

  return (
    <div className="store-faq">
      <div className="store-listing__head">
        <StoreBreadcrumbs
          items={[{ label: 'Inicio', href: '/' }, { label: 'Preguntas frecuentes' }]}
        />
        <h1 className="store-listing__title">Preguntas frecuentes</h1>
        <p className="store-listing__subtitle">
          Todo lo que necesitás saber antes de comprar en {settings.storeName || appConfig.name}.
        </p>
      </div>

      <div className="store-faq__list">
        {faqs.map((faq) => (
          <details className="store-faq__item" key={faq.question}>
            <summary className="store-faq__question">{faq.question}</summary>
            <div className="store-faq__answer">{faq.answer}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
