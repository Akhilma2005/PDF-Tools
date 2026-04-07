const BASE = 'https://mypdfcastle.vercel.app';

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/tools/image-to-pdf', priority: '0.9', changefreq: 'monthly' },
  { loc: '/tools/merge-pdf', priority: '0.9', changefreq: 'monthly' },
  { loc: '/tools/compress-pdf', priority: '0.9', changefreq: 'monthly' },
  { loc: '/tools/split-pdf', priority: '0.9', changefreq: 'monthly' },
  { loc: '/tools/word-to-pdf', priority: '0.8', changefreq: 'monthly' },
  { loc: '/tools/pdf-to-word', priority: '0.8', changefreq: 'monthly' },
  { loc: '/tools/excel-to-pdf', priority: '0.8', changefreq: 'monthly' },
  { loc: '/tools/ppt-to-pdf', priority: '0.8', changefreq: 'monthly' },
  { loc: '/tools/pdf-to-ppt', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tools/pdf-to-text', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tools/pdf-unlock', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tools/pdf-protect', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tools/html-to-pdf', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tools/pdf-editor', priority: '0.7', changefreq: 'monthly' },
  { loc: '/about', priority: '0.6', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.5', changefreq: 'yearly' },
];

export default function handler(req, res) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(xml);
}
