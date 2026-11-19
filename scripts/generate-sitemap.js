/**
 * Gera sitemap.xml e robots.txt a partir de todos os datasets do catálogo.
 * Uso: SITE_URL=https://seu-dominio node scripts/generate-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://www.bahamaflix.de5.net').replace(/\/$/, '');
const read = (file, fallback) => {
  const full = path.join(ROOT, 'data', file);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : fallback;
};

const catalog = read('catalog.json', { items: [], categories: [] });
const legal = read('public-domain.json', { items: [] });
const series = read('series.json', { series: [] });
const collections = read('collections.json', { collections: [] });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = new Date().toISOString().slice(0, 10);

function url(loc, priority, changefreq = 'weekly') {
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const staticRoutes = [
  ['/#/', '1.0', 'daily'],
  ['/#/filmes', '0.9', 'weekly'],
  ['/#/series', '0.9', 'weekly'],
  ['/#/colecoes', '0.8', 'weekly'],
  ['/#/desenhos', '0.8', 'weekly'],
  ['/#/plataformas', '0.7', 'monthly'],
  ['/#/generos', '0.8', 'weekly'],
  ['/#/sobre', '0.5', 'monthly'],
  ['/#/faq', '0.5', 'monthly'],
  ['/#/contato', '0.4', 'monthly'],
  ['/#/privacidade', '0.3', 'yearly'],
  ['/#/termos', '0.3', 'yearly'],
  ['/#/cookies', '0.3', 'yearly']
].map(([p, pr, cf]) => [SITE + p, pr, cf]);

const categories = [...new Set([...(catalog.categories || []), ...(legal.items || []).flatMap(i => i.categories || [])])];
const genreRoutes = categories.map(c => [`${SITE}/#/genero/${encodeURIComponent(c)}`, '0.7', 'weekly']);

const seriesRoutes = (series.series || []).map(s => [`${SITE}/#/serie/${encodeURIComponent(s.slug)}`, '0.7', 'weekly']);
const collectionRoutes = (collections.collections || []).map(c => [`${SITE}/#/colecao/${encodeURIComponent(c.slug)}`, '0.7', 'weekly']);

const seen = new Set();
const titleRoutes = [...(catalog.items || []), ...(legal.items || [])]
  .filter(i => i.slug && !seen.has(i.slug) && seen.add(i.slug))
  .map(i => [`${SITE}/#/titulo/${encodeURIComponent(i.slug)}`, '0.6', 'monthly']);

const all = [...staticRoutes, ...genreRoutes, ...seriesRoutes, ...collectionRoutes, ...titleRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  all.map(([loc, pr, cf]) => url(loc, pr, cf)).join('\n') +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /archive/\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`sitemap.xml gerado com ${all.length} URLs.`);
console.log(`robots.txt apontando para ${SITE}/sitemap.xml`);
