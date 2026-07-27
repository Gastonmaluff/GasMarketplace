import { Link } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { PAYMENT_METHOD_LABELS, type PublicStoreSettings } from '../../store-settings';
import { buildWhatsappLink } from '../utils/whatsapp';

interface StorefrontFooterProps {
  settings: PublicStoreSettings;
}

const BENEFITS: ReadonlyArray<{ icon: IconName; title: string; text: string }> = [
  { icon: 'wallet', title: 'Pagá al recibir', text: 'Sin adelantos ni riesgos.' },
  { icon: 'truck', title: 'Envíos en 48 horas', text: 'A todo el país.' },
  { icon: 'shield', title: 'Compra segura', text: 'Tus datos protegidos.' },
  { icon: 'refresh', title: 'Devoluciones fáciles', text: 'Hasta 7 días.' },
  { icon: 'heart', title: 'Atención personalizada', text: 'Te ayudamos por WhatsApp.' },
];

export function StorefrontFooter({ settings }: StorefrontFooterProps) {
  const storeName = settings.storeName || appConfig.name;
  const whatsappLink = buildWhatsappLink(settings.whatsappNumberNormalized);
  const location = [settings.address, settings.city].filter(Boolean).join(', ');

  return (
    <footer className="store-footer">
      <div className="benefits-strip">
        <div className="benefits-strip__inner">
          {BENEFITS.map((benefit) => (
            <div className="benefit" key={benefit.title}>
              <span className="benefit__icon">
                <Icon name={benefit.icon} size={24} />
              </span>
              <span className="benefit__text">
                <strong>{benefit.title}</strong>
                <span>{benefit.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {whatsappLink ? (
        <div className="store-cta-band">
          <div className="store-cta-band__inner">
            <div>
              <h2>¿Tenés una consulta?</h2>
              <p>
                {settings.orderConfirmationMessage || 'Escribinos y te ayudamos con tu compra.'}
              </p>
            </div>
            <a
              className="button button--cream"
              href={whatsappLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              Escribínos por WhatsApp
            </a>
          </div>
        </div>
      ) : null}

      <div className="store-footer__grid">
        <div>
          <strong className="store-footer__brand">{storeName}</strong>
          {settings.storeDescription ? <p>{settings.storeDescription}</p> : null}
        </div>
        <div>
          <h2>Comprar</h2>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/catalogo?destacados=1">Ofertas</Link>
          <Link to="/buscar">Buscar</Link>
        </div>
        <div>
          <h2>Contacto</h2>
          {location ? <p>{location}</p> : null}
          {settings.supportEmail ? (
            <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>
          ) : null}
          {whatsappLink ? (
            <a href={whatsappLink} rel="noopener noreferrer" target="_blank">
              WhatsApp: {settings.whatsappNumberDisplay || settings.whatsappNumberNormalized}
            </a>
          ) : null}
        </div>
        <div>
          <h2>Entrega y pagos</h2>
          <p>{settings.pickupEnabled ? 'Retiro en local disponible' : 'Sin retiro en local'}</p>
          <p>{settings.deliveryEnabled ? 'Delivery por zonas' : 'Sin delivery'}</p>
          {settings.acceptedPaymentMethods.length > 0 ? (
            <p>
              {settings.acceptedPaymentMethods
                .map((method) => PAYMENT_METHOD_LABELS[method])
                .join(' · ')}
            </p>
          ) : null}
        </div>
      </div>
      <div className="store-footer__legal">
        <span>
          © {new Date().getFullYear()} {storeName}
        </span>
      </div>
    </footer>
  );
}
