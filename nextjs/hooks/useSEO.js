import { useEffect } from 'react';

const SITE = 'PDFTools';
const BASE_URL = 'https://pdftools.com';

export default function useSEO({ title, description, keywords, canonical, jsonLd }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Free Online PDF Tools`;
    document.title = fullTitle;

    setMeta('name', 'description', description || 'Free online PDF tools — compress, merge, split, convert PDF files instantly. No signup required.');
    if (keywords) setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', 'index, follow');

    // Canonical
    setLink('canonical', canonical || BASE_URL);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description || '');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', canonical || BASE_URL);
    setMeta('property', 'og:site_name', SITE);

    // Twitter
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description || '');

    // JSON-LD structured data
    const schemaId = 'jsonld-schema';
    let schemaEl = document.getElementById(schemaId);
    if (!schemaEl) {
      schemaEl = document.createElement('script');
      schemaEl.id = schemaId;
      schemaEl.type = 'application/ld+json';
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify(jsonLd || defaultSchema(fullTitle, description, canonical));
  }, [title, description, keywords, canonical, jsonLd]);
}

function defaultSchema(title, description, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title,
    description: description,
    url: url || 'https://pdftools.com',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: {
      '@type': 'Organization',
      name: 'PDFTools',
      url: 'https://pdftools.com',
    },
  };
}

function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
