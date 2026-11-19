/**
 * Lê a listagem pública das pastas de temporada e extrai os NOMES dos arquivos
 * de vídeo disponíveis. Nenhum link direto de download é capturado ou salvo —
 * a página da série continua apontando para a pasta original.
 *
 * Uso: node scripts/fetch-available-episodes.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'available-episodes.json');
const seriesData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'series.json'), 'utf8'));

const VIDEO_FILE = /(?:aria-label|data-tooltip)="([^"]+?\.(?:mp4|mkv|avi|mov|m4v|webm|flv|wmv))(?: Video(?: Shared)?)?"/gi;
const EPISODE_NUMBER = /(?:epis[oó]dio|ep\.?)\s*[-_:]?\s*(\d{1,4})/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parseFiles(html) {
  const found = new Map();
  for (const match of html.matchAll(VIDEO_FILE)) {
    const file = match[1].trim();
    if (found.has(file.toLowerCase())) continue;
    const numberMatch = file.match(EPISODE_NUMBER);
    found.set(file.toLowerCase(), {
      number: numberMatch ? Number(numberMatch[1]) : null,
      title: file.replace(/\.[^.]+$/, '').trim(),
      file
    });
  }
  return [...found.values()].sort((a, b) => {
    if (a.number && b.number) return a.number - b.number;
    if (a.number) return -1;
    if (b.number) return 1;
    return a.title.localeCompare(b.title, 'pt-BR');
  });
}

async function fetchFolder(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; BahamaFlixCatalog/1.0)' }
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

(async () => {
  const out = {
    generatedAt: new Date().toISOString(),
    source: 'Listagem pública das pastas de temporada (Google Drive)',
    note: 'Apenas nomes de arquivos visíveis na pasta pública. Nenhum link direto de vídeo é armazenado.',
    series: {}
  };

  let folders = 0;
  let withFiles = 0;
  let totalFiles = 0;

  for (const series of seriesData.series) {
    for (const season of series.seasons) {
      if (!season.watchUrl) continue;
      folders++;
      try {
        const html = await fetchFolder(season.watchUrl);
        const episodes = parseFiles(html);
        if (!episodes.length) {
          console.log(`  — sem arquivos de vídeo: ${season.title}`);
          continue;
        }
        if (!out.series[series.slug]) out.series[series.slug] = { seasons: {} };
        out.series[series.slug].seasons[season.slug] = {
          folderTitle: season.title,
          count: episodes.length,
          episodes
        };
        withFiles++;
        totalFiles += episodes.length;
        console.log(`  + ${season.title}: ${episodes.length} arquivo(s)`);
      } catch (err) {
        console.log(`  ! ${season.title}: ${err.message}`);
      }
      await sleep(200);
    }
  }

  // Converte os mapas em arrays para facilitar o consumo no navegador.
  for (const entry of Object.values(out.series)) {
    entry.seasons = Object.entries(entry.seasons).map(([slug, data]) => ({ slug, ...data }));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\n${withFiles}/${folders} pastas lidas · ${totalFiles} episódios disponíveis salvos em data/available-episodes.json`);
})();
