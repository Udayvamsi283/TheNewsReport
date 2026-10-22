/**
 * Lightweight SPA SEO & Social Graph Metadata Utility
 * Updates document.title and primary meta tags dynamically per route.
 * Note: For React SPAs, this provides client-side metadata updates for modern browsers
 * and scrapers supporting JS rendering. Canonical full-text indexing is driven by sitemap.xml.
 */

import { env } from '../config/env';

interface SeoMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const DEFAULT_TITLE = 'The News Report — Independent Journalism & Investigations';
const DEFAULT_DESCRIPTION = 'The News Report delivers rigorous, uncompromised reporting, field dispatches, and public interest investigations.';
const DEFAULT_IMAGE = '/favicon.svg';

export const updateSeoMetadata = (meta: SeoMetadata = {}) => {
  const title = meta.title ? `${meta.title} | The News Report` : DEFAULT_TITLE;
  const description = meta.description || DEFAULT_DESCRIPTION;
  const rawImage = meta.image || DEFAULT_IMAGE;
  const origin = env.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const image = rawImage.startsWith('http://') || rawImage.startsWith('https://')
    ? rawImage
    : (origin ? `${origin}${rawImage.startsWith('/') ? '' : '/'}${rawImage}` : rawImage);
  const url = meta.url || (typeof window !== 'undefined' ? window.location.href : (origin || '/'));
  const type = meta.type || 'website';

  // 1. Update Document Title
  document.title = title;

  // 2. Helper to set or create meta tags
  const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
    let el = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nameAttr, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Standard Meta
  setMeta('name', 'description', description);

  // Open Graph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:site_name', 'The News Report');

  // Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  // Canonical link tag
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', url.split('?')[0]); // Strip query parameters for canonical
};
