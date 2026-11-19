/**
 * Validação rápida do projeto reorganizado.
 * Uso: node scripts/check-links.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (file, fallback) => {
  const full = path.join(ROOT, 'data', file);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : fallback;
};

const catalog = read('catalog.json', { items: [], categories: [] });
const legal = read('public-domain.json', { items: [] });
const platforms = read('platforms.json', { platforms: [] });
const enrichment = read('enrichment.json', { items: {} });
const seriesData = read('series.json', { series: [] });
const episodes = read('episodes.json', { series: {} });
const available = read('available-episodes.json', { series: {} });

const problems = [];
const warnings = [];

// 1. Arquivos estáticos referenciados pelos HTML de entrada
for (const file of ['index.html', '404.html']) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const m of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const ref = m[1].split(/[?#]/)[0];
    if (!ref || /^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(ref)) continue;
    if (!fs.existsSync(path.join(ROOT, ref))) problems.push(`${file}: arquivo ausente → ${ref}`);
  }
}

// 2. Itens do catálogo (origem local) e do acervo legal (fonte remota)
const slugs = new Set();
const allItems = [...catalog.items, ...legal.items];
for (const item of allItems) {
  if (slugs.has(item.slug)) problems.push(`slug duplicado: ${item.slug}`);
  slugs.add(item.slug);

  if (!item.image) problems.push(`sem imagem: ${item.title}`);
  else if (item.isLegal) {
    if (!/^https?:\/\//i.test(item.image)) problems.push(`imagem remota inválida: ${item.image} (${item.title})`);
  } else if (!fs.existsSync(path.join(ROOT, item.image))) {
    problems.push(`imagem ausente: ${item.image} (${item.title})`);
  }

  if (!item.watchUrl) warnings.push(`sem link de acesso: ${item.title}`);
  else if (!/^https?:\/\//i.test(item.watchUrl)) problems.push(`link inválido: ${item.watchUrl} (${item.title})`);

  if (item.isLegal && (!item.source || !item.license)) {
    problems.push(`acervo legal sem fonte/licença: ${item.title}`);
  }
  for (const c of item.categories || []) {
    if (!catalog.categories.includes(c)) problems.push(`categoria desconhecida: ${c} (${item.title})`);
  }
}

// 3. Datasets auxiliares
for (const file of ['data/catalog.json', 'data/public-domain.json', 'data/enrichment.json',
  'data/series.json', 'data/episodes.json', 'data/available-episodes.json',
  'data/platforms.json', 'data/pages.json']) {
  if (!fs.existsSync(path.join(ROOT, file))) problems.push(`arquivo de dados ausente: ${file}`);
}

if (Object.keys(enrichment.items || {}).length < allItems.length) {
  warnings.push(`enrichment.json cobre ${Object.keys(enrichment.items || {}).length} de ${allItems.length} títulos`);
}

const knownSlugs = new Set(allItems.map(i => i.slug));
for (const s of seriesData.series || []) {
  if (!s.slug || !s.name) problems.push('série sem slug/nome');
  for (const season of s.seasons || []) {
    if (!knownSlugs.has(season.slug)) problems.push(`temporada sem título correspondente: ${season.slug}`);
  }
}

const seriesSlugs = new Set((seriesData.series || []).map(s => s.slug));
for (const [slug, entry] of Object.entries(available.series || {})) {
  if (!seriesSlugs.has(slug)) problems.push(`episódios disponíveis de série desconhecida: ${slug}`);
  for (const season of entry.seasons || []) {
    if (!season.slug || !Array.isArray(season.episodes)) {
      problems.push(`temporada disponível inválida em ${slug}`);
      continue;
    }
    if (!season.episodes.length) problems.push(`temporada disponível vazia: ${slug}/${season.slug}`);
    for (const ep of season.episodes) {
      if (!ep.title || !ep.file) problems.push(`episódio disponível sem título/arquivo: ${slug}/${season.slug}`);
    }
  }
}

for (const p of platforms.platforms || []) {
  if (!p.name || !p.url || !/^https?:\/\//i.test(p.url)) problems.push(`plataforma inválida: ${p.name || p.id}`);
  if (!p.searchUrl || !p.searchUrl.includes('{query}')) warnings.push(`plataforma sem busca configurada: ${p.name}`);
}

// 4. Arquivos de aplicação e configuração esperados
for (const file of ['assets/css/style.css', 'assets/js/app.js', 'assets/js/catalog.js',
  'assets/js/search.js', 'assets/js/pwa.js', 'manifest.webmanifest', 'sw.js',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png', 'assets/icons/apple-touch-icon.png',
  'sitemap.xml', 'robots.txt', 'netlify.toml']) {
  if (!fs.existsSync(path.join(ROOT, file))) problems.push(`arquivo esperado ausente: ${file}`);
}

if (warnings.length) {
  console.log(`Avisos (${warnings.length}):`);
  warnings.slice(0, 20).forEach(w => console.log(' - ' + w));
}
if (problems.length) {
  console.log(`Encontrados ${problems.length} problema(s):`);
  problems.slice(0, 60).forEach(p => console.log(' - ' + p));
  process.exitCode = 1;
} else {
  const availableCount = Object.values(available.series || {})
    .reduce((n, s) => n + (s.seasons || []).reduce((m, t) => m + t.episodes.length, 0), 0);
  console.log(`OK: ${allItems.length} títulos, ${seriesData.series.length} séries, ${availableCount} episódios disponíveis e ${platforms.platforms.length} plataformas validados.`);
}
