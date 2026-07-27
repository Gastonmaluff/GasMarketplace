import { useEffect } from 'react';

import { appConfig } from '../../../config/app.config';

export interface DocumentMeta {
  title: string;
  description?: string;
  /** Ruta canónica relativa (p. ej. "/producto/yerba"). */
  canonicalPath?: string;
  noindex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * SEO básico para una SPA: ajusta title, description, Open Graph, canonical y
 * robots por ruta. Limitación conocida: sin SSR/prerendering, los crawlers que
 * no ejecutan JS ven el HTML inicial; se documenta en LOCAL-DEVELOPMENT.
 */
export function useDocumentMeta({
  title,
  description,
  canonicalPath,
  noindex,
}: DocumentMeta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
    }
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', appConfig.name);
    setMetaTag('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    if (canonicalPath && typeof window !== 'undefined') {
      setLinkTag('canonical', `${window.location.origin}${canonicalPath}`);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath, noindex]);
}
