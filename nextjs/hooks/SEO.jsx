import Head from 'next/head';

const SITE = 'PDFTools';
const BASE_URL = 'https://mypdfcastle.vercel.app';

export default function SEO({ title, description, keywords, canonical, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Free Online PDF Tools`;
  const desc = description || 'Free online PDF tools — compress, merge, split, convert PDF files instantly. No signup required.';
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${BASE_URL}/logo512.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}
