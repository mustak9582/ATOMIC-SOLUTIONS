import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CORE_SERVICES } from '../constants';

const SITE_URL = 'https://atomicsolutions.in';

const pageCopy: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Atomic Solutions | Home Services, HVAC & Construction in Deoghar',
    description: 'Book trusted HVAC, electrical, plumbing, construction, interior and home planning services in Deoghar with Atomic Solutions.'
  },
  '/store': {
    title: 'Atomic Solutions Store | Home Service Products in Deoghar',
    description: 'Browse products and service essentials from Atomic Solutions in Deoghar.'
  }
};

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(property ? 'property' : 'name', name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const service = pathname.startsWith('/service/')
      ? CORE_SERVICES.find(item => item.id === pathname.split('/').pop())
      : undefined;
    const isPrivate = /^\/(admin|dashboard|professional|billing|invoice|login)/.test(pathname);
    const details = service
      ? {
          title: `${service.name} in Deoghar | Atomic Solutions`,
          description: `Book ${service.name.toLowerCase()} in Deoghar. Get clear pricing and professional service from Atomic Solutions.`
        }
      : pageCopy[pathname] || pageCopy['/'];
    const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    document.title = details.title;
    setMeta('description', details.description);
    setMeta('robots', isPrivate ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('og:title', details.title, true);
    setMeta('og:description', details.description, true);
    setMeta('og:url', canonical, true);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
  }, [pathname]);

  return null;
}
