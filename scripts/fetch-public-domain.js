/**
 * Busca títulos de domínio público no Internet Archive e gera data/public-domain.json.
 * Uso: node scripts/fetch-public-domain.js
 *
 * Critérios: apenas itens mediatype:movies com licenseurl contendo
 * "publicdomain" / "creativecommons.org/publicdomain". Nada de conteúdo
 * simplesmente "gratuito" sem licença declarada.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'public-domain.json');

// Títulos amplamente reconhecidos como domínio público (EUA), com dica de gênero.
const CURATED = [
  ['Night of the Living Dead', 1968, 'Terror', 'Filme'],
  ['The General', 1926, 'Comédia', 'Filme'],
  ['Sherlock Jr', 1924, 'Comédia', 'Filme'],
  ['Steamboat Bill Jr', 1928, 'Comédia', 'Filme'],
  ['The Gold Rush', 1925, 'Comédia', 'Filme'],
  ['The Pilgrim', 1922, 'Comédia', 'Filme'],
  ['Metropolis', 1927, 'Ficção científica', 'Filme'],
  ['Nosferatu', 1922, 'Terror', 'Filme'],
  ['The Cabinet of Dr. Caligari', 1920, 'Terror', 'Filme'],
  ['The Phantom of the Opera', 1925, 'Terror', 'Filme'],
  ['The Hunchback of Notre Dame', 1923, 'Drama', 'Filme'],
  ['The Mark of Zorro', 1920, 'Aventura', 'Filme'],
  ['The Ten Commandments', 1923, 'Drama', 'Filme'],
  ['Battleship Potemkin', 1925, 'Drama', 'Filme'],
  ['Man with a Movie Camera', 1929, 'Documentário', 'Filme'],
  ['Berlin Symphony of a Great City', 1927, 'Documentário', 'Filme'],
  ['The Passion of Joan of Arc', 1928, 'Drama', 'Filme'],
  ['The Last Laugh', 1924, 'Drama', 'Filme'],
  ['Waxworks', 1924, 'Terror', 'Filme'],
  ['Intolerance', 1916, 'Drama', 'Filme'],
  ['A Trip to the Moon', 1902, 'Ficção científica', 'Filme'],
  ['The Great Train Robbery', 1903, 'Ação', 'Filme'],
  ['Gertie the Dinosaur', 1914, 'Animação', 'Desenho'],
  ['Fantasmagorie', 1908, 'Animação', 'Desenho'],
  ['Steamboat Willie', 1928, 'Animação', 'Desenho'],
  ['Plane Crazy', 1928, 'Animação', 'Desenho'],
  ['The Gallopin Gaucho', 1928, 'Animação', 'Desenho'],
  ['Snow White and the Seven Dwarfs', 1933, 'Animação', 'Desenho'],
  ['Felix the Cat', 1923, 'Animação', 'Desenho'],
  ['Krazy Kat', 1920, 'Animação', 'Desenho'],
  ['Mutt and Jeff', 1915, 'Animação', 'Desenho'],
  ['Duck and Cover', 1951, 'Documentário', 'Filme'],
  ['Design for Dreaming', 1956, 'Musical', 'Filme'],
  ['Why We Fight', 1942, 'Documentário', 'Filme'],
  ['Charade', 1963, 'Suspense', 'Filme'],
  ['Dracula Spanish 1931', 1931, 'Terror', 'Filme'],
  ['Reefer Madness', 1936, 'Drama', 'Filme'],
  ['Plan 9 from Outer Space', 1957, 'Ficção científica', 'Filme'],
  ['The Vampire Bat', 1933, 'Terror', 'Filme'],
  ['The Bat', 1926, 'Suspense', 'Filme'],
  ['Carnival of Souls', 1962, 'Terror', 'Filme'],
  ['Cinderella', 1914, 'Fantasia', 'Filme'],
  ['The Adventures of Prince Achmed', 1926, 'Animação', 'Desenho'],
  ['The Sinking of the Lusitania', 1918, 'Animação', 'Desenho'],
  ['The Impossible Voyage', 1904, 'Ficção científica', 'Filme'],
  ['The Kingdom of the Fairies', 1903, 'Fantasia', 'Filme']
];

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = (s) => norm(s).replace(/\s+/g, '-');
const clean = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

async function search(title) {
  const q = `mediatype:movies AND licenseurl:*publicdomain* AND title:(${title.replace(/[:"]/g, ' ')})`;
  const url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
    '&fl[]=identifier&fl[]=title&fl[]=year&fl[]=description&fl[]=licenseurl&fl[]=creator&rows=12&page=1&output=json';
  const res = await fetch(url);
  if (!res.ok) return [];
  const j = await res.json();
  return j.response.docs || [];
}

const STOP = new Set(['the', 'of', 'and', 'a', 'in', 'to', 'jr', 'dr']);
function overlap(wanted, found) {
  const words = norm(wanted).split(' ').filter(w => w && !STOP.has(w));
  const hay = ' ' + norm(found) + ' ';
  if (!words.length) return 0;
  return words.filter(w => hay.includes(' ' + w + ' ')).length / words.length;
}
function best(doc, wantedYear) {
  let score = overlap(wantedTitleGlobal, doc.title) * 10;
  if (doc.year && wantedYear && Math.abs(Number(doc.year) - wantedYear) <= 2) score += 3;
  if (/publicdomain\/mark|zero\/1|licenses\/publicdomain/i.test(doc.licenseurl || '')) score += 2;
  if (doc.description) score += 1;
  return score;
}
let wantedTitleGlobal = '';

(async () => {
  const items = [];
  for (const [title, year, genre, type] of CURATED) {
    wantedTitleGlobal = title;
    try {
      const docs = await search(title);
      const ranked = docs.slice().sort((a, b) => best(b, year) - best(a, year));
      const doc = ranked[0];
      if (!doc || overlap(title, doc.title) < 0.6) {
        console.log('  — descartado (sem correspondência):', title, doc ? `→ ${doc.title}` : '');
        continue;
      }
      const synopsis = clean(doc.description).slice(0, 700);
      items.push({
        title: clean(doc.title) || title,
        slug: slugify(title),
        type,
        year: Number(doc.year) || year,
        genres: [genre],
        categories: [genre],
        synopsis: synopsis || `${title} — obra de domínio público disponível no Internet Archive.`,
        image: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
        watchUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
        source: 'Internet Archive',
        license: /zero\/1|mark\/1/i.test(doc.licenseurl || '') ? 'Domínio público (CC0/CC Mark)' : 'Domínio público',
        isLegal: true,
        quality: 'SD',
        legacyFile: null,
        publicDomainId: doc.identifier
      });
      console.log('  +', title, '→', doc.identifier);
    } catch (e) {
      console.log('  ! erro:', title, e.message);
    }
  }

  // remove duplicatas de slug mantendo a primeira
  const seen = new Set();
  const unique = items.filter(i => !seen.has(i.slug) && seen.add(i.slug));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), total: unique.length, items: unique }, null, 2));
  console.log(`\n${unique.length} títulos de domínio público salvos em data/public-domain.json`);
})();
