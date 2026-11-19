/**
 * Gera data/catalog.json a partir dos HTMLs legados em archive/.
 * Uso: node scripts/build-catalog.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE = path.join(ROOT, 'archive');
const MEDIA = path.join(ROOT, 'media');
const OUT = path.join(ROOT, 'data', 'catalog.json');

// Categorias exibidas na interface (ordem de apresentação).
const CATEGORIES = [
  'Ação', 'Aventura', 'Animação', 'Comédia', 'Documentário', 'Drama',
  'Esporte', 'Família', 'Ficção científica', 'Musical', 'Suspense', 'Terror',
  'Romance', 'Crime', 'Fantasia', 'Mistério', 'Biografia', 'História', 'Guerra'
];

const ALIASES = {
  'acao': 'Ação', 'acção': 'Ação', 'action': 'Ação',
  'aventura': 'Aventura', 'adventure': 'Aventura',
  'animacao': 'Animação', 'animação': 'Animação', 'animation': 'Animação', 'desenhos': 'Animação',
  'comedia': 'Comédia', 'comédia': 'Comédia', 'comedy': 'Comédia', 'humor': 'Comédia',
  'documentario': 'Documentário', 'documentário': 'Documentário', 'documentary': 'Documentário',
  'drama': 'Drama', 'dramatico': 'Drama',
  'esporte': 'Esporte', 'desporto': 'Esporte', 'sport': 'Esporte',
  'familia': 'Família', 'família': 'Família', 'family': 'Família',
  'ficcao': 'Ficção científica', 'ficção': 'Ficção científica', 'ficcao cientifica': 'Ficção científica',
  'ficção científica': 'Ficção científica', 'sci-fi': 'Ficção científica', 'scifi': 'Ficção científica',
  'musica': 'Musical', 'música': 'Musical', 'musical': 'Musical',
  'suspense': 'Suspense', 'thriller': 'Suspense',
  'terror': 'Terror', 'horror': 'Terror',
  'romance': 'Romance', 'amor': 'Romance',
  'crime': 'Crime', 'policial': 'Crime',
  'fantasia': 'Fantasia', 'fantasy': 'Fantasia',
  'misterio': 'Mistério', 'mistério': 'Mistério', 'mystery': 'Mistério',
  'biografia': 'Biografia', 'biographic': 'Biografia',
  'historia': 'História', 'história': 'História', 'history': 'História',
  'guerra': 'Guerra', 'war': 'Guerra'
};

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = (s) => norm(s).replace(/\s+/g, '-').replace(/^-|-$/g, '');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && /\.html?$/i.test(ent.name)) out.push(p);
  }
  return out;
}

function clean(s) {
  return (s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#039;|&rsquo;|&#8217;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}
const pick = (html, re) => { const m = html.match(re); return m ? clean(m[1]) : ''; };

function imageExists(img, legacyFile) {
  if (!img || /^\[|^https?:/i.test(img)) return null;
  try { img = decodeURIComponent(img); } catch {}
  const candidates = [
    path.join(MEDIA, img),
    path.join(MEDIA, path.dirname(legacyFile), img),
    path.join(MEDIA, path.basename(img))
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return 'media/' + path.relative(MEDIA, c).replace(/\\/g, '/');
  }
  // Busca tolerante pelo nome do arquivo em todo o acervo de imagens.
  const target = norm(path.basename(img, path.extname(img)));
  const found = findImages(MEDIA).find(file => norm(path.basename(file, path.extname(file))) === target);
  return found ? 'media/' + path.relative(MEDIA, found).replace(/\\/g, '/') : null;
}

function findImages(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) findImages(p, out);
    else if (ent.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

function extract(file) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)) return null;
  if (!/Sinopse/i.test(html) && !/Assistir\s+Agora/i.test(html)) return null;

  const title = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
    || pick(html, /<title>([\s\S]*?)<\/title>/i).replace(/\s*[-–]\s*Bahama\s*Flix.*$/i, '');
  if (!title || /^\[|movie|template/i.test(title)) return null;

  const lead = pick(html, /<p[^>]+class=["'][^"']*lead[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  const synopsis = pick(html, /<h2[^>]*>\s*Sinopse\s*<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (/^\[/.test(synopsis) || /Insira aqui/i.test(synopsis)) return null;

  const field = (label) => pick(html, new RegExp(`<strong>\\s*${label}\\s*:?\\s*<\\/strong>\\s*([^<]+)`, 'i'));
  const yearRaw = field('Ano') || (lead.match(/\b(19|20)\d{2}\b/) || [''])[0];
  const year = /^(19|20)\d{2}$/.test(yearRaw) ? Number(yearRaw) : null;
  const genreRaw = field('Gênero') || field('Genero') || '';
  const duration = field('Duração') || field('Duracao') || '';

  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const rawImage = imgs.find(src => /\.(jpe?g|png|webp)$/i.test(src.split('?')[0])) || '';

  const linkMatch = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*<i[^>]*class=["'][^"']*fa-play[^"']*["'][^>]*><\/i>\s*Assistir\s+Agora/i)
    || html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(?:(?!<\/a>)[\s\S])*?Assistir\s+Agora/i);
  const rawLink = linkMatch ? linkMatch[1] : '';

  const legacyFile = path.relative(ROOT, file).replace(/\\/g, '/');
  const genres = genreRaw.split(',').map(s => s.trim()).filter(Boolean);
  const categories = [...new Set(genres
    .map(g => ALIASES[norm(g)])
    .filter(Boolean)
    .concat(/(^|[\s/])series?($|[\s/])/i.test(lead + ' ' + title + ' ' + legacyFile) ? [] : [])
  )];

  const isSeries = /\bseries?\b/i.test(legacyFile) || /\bseries?\b/i.test(rawImage)
    || /\b(t\d|temporada|season)\b/i.test(title) || /\bs[eé]ries?\b/i.test(lead);

  return {
    title,
    slug: slugify(title),
    type: isSeries ? 'Série' : 'Filme',
    year,
    duration: duration || null,
    genres,
    categories: categories.length ? categories : ['Drama'],
    synopsis,
    image: imageExists(rawImage, path.dirname(legacyFile)),
    watchUrl: /^https?:\/\//i.test(rawLink) ? rawLink : null,
    legacyFile,
    quality: 'HD'
  };
}

function score(item) {
  return (item.watchUrl ? 4 : 0) + (item.image ? 2 : 0) + (item.year ? 1 : 0) + (item.synopsis.length > 120 ? 1 : 0);
}

// --- Execução ---
const all = walk(ARCHIVE).map(extract).filter(Boolean);
const byTitle = new Map();
for (const item of all) {
  const key = norm(item.title);
  const current = byTitle.get(key);
  if (!current || score(item) > score(current)) byTitle.set(key, item);
}

const used = new Set();
const items = [...byTitle.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
for (const item of items) {
  let s = item.slug || 'titulo';
  let n = 2;
  while (used.has(s)) s = `${item.slug}-${n++}`;
  item.slug = s;
  used.add(s);
}

const payload = {
  generatedAt: new Date().toISOString(),
  total: items.length,
  categories: CATEGORIES,
  items
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));

console.log(`Catalogado ${items.length} títulos (de ${all.length} páginas válidas).`);
console.log('Com imagem:', items.filter(i => i.image).length);
console.log('Com link de acesso:', items.filter(i => i.watchUrl).length);
console.log('Filmes:', items.filter(i => i.type === 'Filme').length, '| Séries:', items.filter(i => i.type === 'Série').length);
const missing = items.filter(i => !i.image);
if (missing.length) console.log('Sem imagem:', missing.slice(0, 10).map(i => i.title).join(', '));
