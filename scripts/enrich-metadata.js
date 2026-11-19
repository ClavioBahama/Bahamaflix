/**
 * Enriquece o catálogo com metadados externos legítimos.
 *
 * Sem chave (padrão): gera links diretos de busca (TMDB, JustWatch, Wikipedia)
 * e usa a API da TVmaze — gratuita e sem chave — para as séries.
 *
 * Com chave TMDB (gratuita em https://www.themoviedb.org/settings/api):
 *   $env:TMDB_API_KEY="sua_chave"; node scripts/enrich-metadata.js
 * adiciona pôsteres, nota, trailer e "onde assistir" por região (BR).
 *
 * Uso: node scripts/enrich-metadata.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KEY = process.env.TMDB_API_KEY || '';
const OUT = path.join(ROOT, 'data', 'enrichment.json');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
const pd = fs.existsSync(path.join(ROOT, 'data', 'public-domain.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'public-domain.json'), 'utf8')) : { items: [] };

const items = [...base.items, ...pd.items];
const TMDB = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function links(item) {
  const q = encodeURIComponent(item.title);
  return {
    tmdbSearch: `https://www.themoviedb.org/search?query=${q}`,
    justWatch: `https://www.justwatch.com/br/busca?q=${q}`,
    wikipedia: `https://pt.wikipedia.org/w/index.php?search=${q}`,
    letterboxd: item.type === 'Filme' ? `https://letterboxd.com/search/films/${q}/` : null
  };
}

async function tmdbFetch(endpoint) {
  const url = `${TMDB}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

async function findTmdb(item) {
  const pathName = item.type === 'Série' ? 'tv' : 'movie';
  const query = encodeURIComponent(item.title.replace(/[:–-]\s*T\d.*$/i, '').trim());
  let found = null;
  try {
    const data = await tmdbFetch(`/search/${pathName}?query=${query}${item.year ? `&year=${item.year}` : ''}&language=pt-BR`);
    const candidates = data.results || [];
    const target = norm(item.title);
    found = candidates.find(r => norm(r.title || r.name) === target)
      || candidates.find(r => norm(r.title || r.name).includes(target.slice(0, 14)))
      || candidates[0];
  } catch {
    try {
      const data = await tmdbFetch(`/search/${pathName}?query=${query}&language=en-US`);
      found = (data.results || [])[0];
    } catch { return null; }
  }
  if (!found) return null;

  try {
    const detail = await tmdbFetch(`/${pathName}/${found.id}?language=pt-BR&append_to_response=videos,watch/providers`);
    const trailer = (detail.videos?.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || (detail.videos?.results || []).find(v => v.site === 'YouTube');
    const br = detail['watch/providers']?.results?.BR || {};
    return {
      tmdbId: detail.id,
      tmdbUrl: `https://www.themoviedb.org/${pathName}/${detail.id}`,
      poster: detail.poster_path ? `${IMG}/w500${detail.poster_path}` : null,
      backdrop: detail.backdrop_path ? `${IMG}/w1280${detail.backdrop_path}` : null,
      rating: detail.vote_average || null,
      ratingCount: detail.vote_count || null,
      overviewPt: detail.overview || null,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      providers: {
        flatrate: (br.flatrate || []).map(p => p.provider_name),
        free: (br.free || []).map(p => p.provider_name),
        ads: (br.ads || []).map(p => p.provider_name),
        buy: (br.buy || []).map(p => p.provider_name),
        link: br.link || null
      }
    };
  } catch { return null; }
}

async function findTvMaze(item) {
  try {
    const res = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(item.title.replace(/\s*T\d+$/i, '')));
    if (!res.ok) return null;
    const list = await res.json();
    const target = norm(item.title);
    const hit = list.find(x => norm(x.show.name) === target)
      || list.find(x => norm(x.show.name).includes(target.slice(0, 12)))
      || list[0];
    if (!hit) return null;
    const s = hit.show;
    return {
      tvmazeId: s.id,
      tvmazeUrl: s.url,
      poster: s.image?.original || s.image?.medium || null,
      rating: s.rating?.average || null,
      summary: s.summary ? s.summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null,
      officialSite: s.officialSite || null,
      network: s.network?.name || s.webChannel?.name || null
    };
  } catch { return null; }
}

(async () => {
  const result = { generatedAt: new Date().toISOString(), hasTmdbKey: Boolean(KEY), items: {} };
  let tmdbOk = 0, tvmazeOk = 0;

  console.log(KEY ? 'TMDB: chave detectada — buscando metadados completos.' : 'TMDB: sem chave — usando links diretos + TVmaze para séries.');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const data = links(item);

    if (item.isLegal) {
      // Título de domínio público: a fonte já é o link de acesso.
      result.items[item.slug] = { ...data, source: item.source, license: item.license };
      continue;
    }

    if (KEY) {
      const tmdb = await findTmdb(item);
      if (tmdb) { Object.assign(data, tmdb); tmdbOk++; }
      await sleep(40);
    }

    if (item.type === 'Série') {
      const tv = await findTvMaze(item);
      if (tv) { Object.assign(data, tv); tvmazeOk++; }
      await sleep(80);
    }

    result.items[item.slug] = data;
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${items.length} processados`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`\nEnriquecimento salvo: ${Object.keys(result.items).length} títulos.`);
  console.log(`TMDB: ${tmdbOk} | TVmaze: ${tvmazeOk}`);
  if (!KEY) console.log('Dica: defina TMDB_API_KEY para preencher pôsteres, notas, trailers e "onde assistir".');
})();
