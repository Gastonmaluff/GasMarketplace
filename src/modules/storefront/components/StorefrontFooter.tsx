import { Link } from 'react-router-dom';

import { appConfig } from '../../../config/app.config';
import { PAYMENT_METHOD_LABELS, type PublicStoreSettings } from '../../store-settings';
import { buildWhatsappLink } from '../utils/whatsapp';

interface StorefrontFooterProps {
  settings: PublicStoreSettings;
}

export function StorefrontFooter({ settings }: StorefrontFooterProps) {
  const storeName = settings.storeName || appConfig.name;
  const whatsappLink = buildWhatsappLink(settings.whatsappNumberNormalized);
  const location = [settings.address, settings.city].filter(Boolean).join(', ');

  return (
    <footer className="store-footer">
      <div className="store-footer__grid">
        <div>
          <strong>{storeName}</strong>
          {settings.storeDescription ? <p>{settings.storeDescription}</p> : null}
        </div>

        <div>
          <h2>Comprar</h2>
          <Link to="/catalogo">Catálogo</Link>
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
