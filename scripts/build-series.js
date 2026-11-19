/**
 * Agrupa as temporadas do catálogo em páginas de série (ex.: Naruto T1..T7 → Naruto).
 * Uso: node scripts/build-series.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = (s) => norm(s).replace(/\s+/g, '-');

const SUFFIXES = [
  /:\s*Temporadas?\s*\d+(?:\s*a\s*\d+)?\s*$/i,
  /\s*\(\s*\d+ª\s*Temporada\s*\)\s*$/i,
  /\s+T\d+(?:\s*-\s*T?\d+)?\s*$/i
];

function parseTitle(title) {
  for (const re of SUFFIXES) {
    if (!re.test(title)) continue;
    const suffix = title.match(re)[0].trim();
    const name = title.replace(re, '').trim();
    let number = 1;
    let range = null;
    let m = suffix.match(/T(\d+)\s*-\s*T?(\d+)/i);
    if (m) range = [Number(m[1]), Number(m[2])];
    else if ((m = suffix.match(/(\d+)\s*(?:ª|º)?\s*Temporada/i))) number = Number(m[1]);
    else if ((m = suffix.match(/T(\d+)/i))) number = Number(m[1]);
    else if ((m = suffix.match(/Temporadas?\s*(\d+)/i))) number = Number(m[1]);
    return { name, suffix, number, range };
  }
  return { name: title.trim(), suffix: 'Temporada 1', number: 1, range: null };
}

const groups = new Map();
for (const item of catalog.items.filter(i => i.type === 'Série')) {
  const info = parseTitle(item.title);
  const key = slugify(info.name);
  if (!groups.has(key)) {
    groups.set(key, { name: info.name, slug: key, seasons: [] });
  }
  groups.get(key).seasons.push({
    number: info.number,
    range: info.range,
    label: info.suffix,
    title: item.title,
    slug: item.slug,
    year: item.year || null,
    image: item.image || null,
    watchUrl: item.watchUrl || null,
    synopsis: item.synopsis || null
  });
}

const series = [...groups.values()].map(group => {
  group.seasons.sort((a, b) => a.number - b.number);
  const first = group.seasons[0];
  return {
    name: group.name,
    slug: group.slug,
    type: 'Série',
    poster: first.image,
    synopsis: first.synopsis,
    genres: first.genres || [],
    categories: first.categories || [],
    seasonCount: group.seasons.length,
    seasons: group.seasons
  };
}).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

fs.mkdirSync(path.dirname(path.join(ROOT, 'data', 'series.json')), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'series.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), total: series.length, series }, null, 2));

console.log(`${series.length} séries agrupadas em data/series.json`);
console.log(series.map(s => `${s.name}: ${s.seasonCount} temporada(s)`).join('\n'));
