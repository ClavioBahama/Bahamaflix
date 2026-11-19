/**
 * Busca guias de episódios na API da TVmaze (gratuita, sem chave) e gera
 * data/episodes.json. São apenas metadados — nenhum vídeo é baixado ou indexado.
 *
 * Uso: node scripts/fetch-episodes.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'episodes.json');
const seriesData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'series.json'), 'utf8'));

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Títulos em português que não são encontrados na TVmaze pelo nome local.
const ALIASES = {
  'a-bela-e-a-fera': 'Beauty & the Beast',
  'los-expedientes-secretos-x': 'The X-Files'
};

async function findShow(name) {
  const res = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name));
  if (!res.ok) throw new Error('TVmaze ' + res.status);
  const list = await res.json();
  const target = norm(name);
  return list.find(x => norm(x.show.name) === target)?.show
    || list.find(x => norm(x.show.name).includes(target))?.show
    || list[0]?.show || null;
}

async function fetchEpisodes(showId) {
  const res = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
  if (!res.ok) throw new Error('TVmaze ' + res.status);
  return res.json();
}

(async () => {
  const out = {
    generatedAt: new Date().toISOString(),
    source: 'TVmaze API — https://www.tvmaze.com/',
    note: 'Guias de episódios (metadados). Nenhum link de vídeo é fornecido por esta API.',
    series: {}
  };

  let ok = 0;
  for (const s of seriesData.series) {
    try {
      const show = await findShow(ALIASES[s.slug] || s.name);
      if (!show) { console.log('  — sem resultado:', s.name); continue; }
      const episodes = await fetchEpisodes(show.id);
      const groups = new Map();
      for (const e of episodes) {
        const key = String(e.season);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({
          number: e.number,
          title: e.name || `Episódio ${e.number}`,
          airdate: e.airdate || null,
          runtime: e.runtime || null,
          summary: e.summary ? e.summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null
        });
      }
      out.series[s.slug] = {
        tvmazeId: show.id,
        tvmazeUrl: show.url,
        officialSite: show.officialSite || null,
        seasons: [...groups.entries()].map(([key, list]) => ({
          key,
          label: key,
          episodes: list.sort((a, b) => a.number - b.number)
        }))
      };
      ok++;
      console.log(`  + ${s.name}: ${episodes.length} episódio(s) em ${groups.size} temporada(s)`);
      await sleep(250);
    } catch (err) {
      console.log('  ! erro:', s.name, err.message);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nGuias salvos para ${ok}/${seriesData.series.length} séries em data/episodes.json`);
})();
