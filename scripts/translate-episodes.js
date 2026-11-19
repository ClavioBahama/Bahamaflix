/**
 * Deixa o guia de episódios inteiramente em português.
 *
 * 1. Aproveita títulos portugueses já presentes nos nomes de arquivo do acervo
 *    (ex.: "Naruto - Episódio 001 – Naruto Uzumaki Chegando!").
 * 2. Traduz os demais títulos da TVmaze com um serviço público de tradução.
 *
 * Uso: node scripts/translate-episodes.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', file), 'utf8'));
const episodes = read('episodes.json');
const available = read('available-episodes.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const BATCH = 30;
const ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=';

/** Só aceita nomes que parecem títulos de episódio de verdade, não nomes técnicos. */
function realTitle(name) {
  if (!name || /\.(mp4|mkv|avi|mov|webm)$/i.test(name)) return null;
  if (/(www\.|\.com|\.org|WEB-?DL|WEBRip|Blu-Ray|BLUDV|TORRENT|x264|H\.264|DDP5|720p|1080p)/i.test(name)) return null;
  const m = name.match(/epis[oó]dio\s*0*(\d+)\s*[-–—:]\s*(.+)/i);
  if (!m) return null;
  return { number: Number(m[1]), title: m[2].replace(/_/g, ' ').replace(/\s+/g, ' ').trim() };
}

/** Mapa global de episódios → título português, por série. */
function portugueseTitles() {
  const result = {};
  for (const [slug, entry] of Object.entries(available.series || {})) {
    const map = {};
    for (const season of entry.seasons || []) {
      for (const ep of season.episodes || []) {
        const parsed = realTitle(ep.title);
        if (parsed && parsed.number && parsed.title) map[parsed.number] = parsed.title;
      }
    }
    if (Object.keys(map).length) result[slug] = map;
  }
  return result;
}

async function translateBatch(texts) {
  const url = ENDPOINT + encodeURIComponent(texts.join('\n'));
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('Tradução HTTP ' + res.status);
  const json = await res.json();
  const lines = (json[0] || []).map(x => (x[0] || '').replace(/\s+/g, ' ').trim());
  if (lines.length < texts.length) throw new Error(`Esperava ${texts.length} linhas, recebi ${lines.length}`);
  // Títulos com quebras de linha podem gerar linhas extras; descartamos o excedente.
  return lines.slice(0, texts.length);
}

async function translateAll(texts) {
  const out = new Array(texts.length);
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    let translated;
    try {
      translated = await translateBatch(slice);
    } catch (err) {
      // Lotes com idiomas mistos podem ser devolvidos como uma única linha.
      // Nesse caso, traduzimos título por título para não perder nenhum.
      translated = [];
      for (const text of slice) {
        try {
          translated.push((await translateBatch([text]))[0] || text);
        } catch (_) {
          translated.push(text);
        }
        await sleep(120);
      }
    }
    translated.forEach((t, j) => { out[i + j] = t || slice[j]; });
    if (i + BATCH < texts.length) await sleep(300);
  }
  return out;
}

(async () => {
  const pt = portugueseTitles();
  const pendentes = [];

  // Primeiro passo: títulos vindos do acervo em português.
  for (const [slug, entry] of Object.entries(episodes.series || {})) {
    let global = 0;
    for (const season of entry.seasons || []) {
      for (const ep of season.episodes || []) {
        global++;
        const titlePt = pt[slug] && pt[slug][global];
        if (titlePt) {
          ep.title = titlePt;
          ep.titleSource = 'acervo';
        } else {
          pendentes.push(ep);
        }
        delete ep.summary; // texto em inglês que não é exibido na interface
      }
    }
  }

  console.log(`Títulos do acervo em português: ${Object.values(episodes.series).reduce((n, e) => n + e.seasons.reduce((m, s) => m + s.episodes.filter(x => x.titleSource === 'acervo').length, 0), 0)}`);
  console.log(`Traduzindo ${pendentes.length} títulos da TVmaze...`);

  const originais = pendentes.map(e => e.title.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim());
  const traduzidos = await translateAll(originais);
  pendentes.forEach((ep, i) => {
    ep.title = traduzidos[i] || ep.title;
    ep.titleSource = 'traducao';
  });

  episodes.generatedAt = new Date().toISOString();
  episodes.note = 'Títulos de episódios em português. Fontes: acervo local e tradução automática dos metadados da TVmaze.';
  fs.writeFileSync(path.join(ROOT, 'data', 'episodes.json'), JSON.stringify(episodes, null, 2));

  const translated = pendentes.filter(e => e.titleSource === 'traducao').length;
  console.log(`\nConcluído: ${translated} títulos traduzidos + acervo em português salvos em data/episodes.json`);
})();
