/**
 * Camada de dados do catálogo.
 * Expõe window.BahamaCatalog com consultas em memória sobre os JSON em data/.
 *
 * Fontes combinadas:
 *  - catalog.json       → catálogo original (extraído do site legado)
 *  - public-domain.json → títulos de domínio público do Internet Archive
 *  - enrichment.json    → metadados externos (TMDB/TVmaze) e links de pesquisa
 *  - series.json        → séries agrupadas por temporada (ex.: Naruto T1..T7)
 *  - episodes.json      → guias de episódios (metadados da TVmaze)
 *  - available-episodes.json → nomes de arquivos visíveis nas pastas públicas
 *  - platforms.json     → diretório de plataformas legais
 *  - collections.json   → coleções agrupadas por ator/franquia
 */
(function () {
  'use strict';

  const state = {
    items: [], categories: [], years: [], platforms: [], series: [], episodes: {},
    available: {}, collections: [], loaded: false
  };

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function sortedByRelevance(items) {
    return items.slice().sort((a, b) => {
      const score = (x) => (x.year || 0) + (x.watchUrl ? 1 : 0) + (x.synopsis || '').length / 1000;
      return score(b) - score(a);
    });
  }

  function applyEnrichment(item, enrichment) {
    const ex = enrichment[item.slug];
    if (!ex) return { ...item, enrichment: null };
    const out = { ...item, enrichment: ex };
    if (!out.image && ex.poster) out.image = ex.poster;
    if ((!out.synopsis || out.synopsis.length < 40) && (ex.overviewPt || ex.summary)) {
      out.synopsis = ex.overviewPt || ex.summary;
    }
    return out;
  }

  async function optionalJson(file, fallback) {
    try {
      const res = await fetch(file, { cache: 'no-cache' });
      return res.ok ? await res.json() : fallback;
    } catch (_) {
      return fallback;
    }
  }

  const api = {
    async load() {
      if (state.loaded) return state.items;

      const [base, legal, enrichment, seriesData, episodeData, availableData, platformData, collectionData] = await Promise.all([
        fetch('data/catalog.json', { cache: 'no-cache' }).then((res) => {
          if (!res.ok) throw new Error(`Falha ao carregar catálogo (${res.status}).`);
          return res.json();
        }),
        optionalJson('data/public-domain.json', { items: [] }),
        optionalJson('data/enrichment.json', { items: {} }),
        optionalJson('data/series.json', { series: [] }),
        optionalJson('data/episodes.json', { series: {} }),
        optionalJson('data/available-episodes.json', { series: {} }),
        optionalJson('data/platforms.json', { platforms: [] }),
        optionalJson('data/collections.json', { collections: [] })
      ]);

      state.series = seriesData.series || [];
      state.episodes = episodeData.series || {};
      state.available = availableData.series || {};
      state.platforms = platformData.platforms || [];
      state.collections = collectionData.collections || [];

      const seasonToSeries = new Map();
      state.series.forEach(s => (s.seasons || []).forEach(season => seasonToSeries.set(season.slug, s.slug)));

      const all = [...(base.items || []), ...(legal.items || [])].map(item => ({
        ...item,
        seriesSlug: seasonToSeries.get(item.slug) || null
      }));
      state.items = sortedByRelevance(all.map(item => applyEnrichment(item, enrichment.items || {})));
      state.categories = [...new Set([
        ...(base.categories || []),
        ...all.flatMap(i => i.categories || [])
      ])];
      state.years = [...new Set(state.items.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
      state.loaded = true;
      return state.items;
    },

    get items() { return state.items; },
    get categories() { return state.categories; },
    get years() { return state.years; },
    get platforms() { return state.platforms; },
    get collections() { return state.collections; },
    get series() { return state.series; },
    get episodes() { return state.episodes; },
    get available() { return state.available; },
    get loaded() { return state.loaded; },

    getBySlug(slug) { return state.items.find(i => i.slug === slug) || null; },
    getSeries(slug) { return state.series.find(s => s.slug === slug) || null; },

    /** Episódios realmente listados na pasta pública de uma temporada. */
    getAvailable(seriesSlug, seasonSlug) {
      const entry = state.available[seriesSlug];
      if (!entry) return null;
      return (entry.seasons || []).find(s => s.slug === seasonSlug) || null;
    },

    availableCount(seriesSlug, seasonSlug) {
      const season = this.getAvailable(seriesSlug, seasonSlug);
      return season ? season.count : 0;
    },

    /**
     * Consulta principal.
     * @param {object} opts term, type, category, year, sort, limit, offset, source
     */
    query(opts = {}) {
      const term = norm(opts.term || '').trim();
      const words = term.split(/\s+/).filter(Boolean);

      let result = state.items.filter(item => {
        if (opts.type && item.type !== opts.type) return false;
        if (opts.category && !(item.categories || []).includes(opts.category)) return false;
        if (opts.year && String(item.year) !== String(opts.year)) return false;
        if (opts.source && item.source !== opts.source) return false;
        if (!words.length) return true;
        const haystack = norm([
          item.title, item.synopsis, (item.genres || []).join(' '),
          (item.categories || []).join(' '), item.year || '', item.source || ''
        ].join(' '));
        return words.every(w => haystack.includes(w));
      });

      switch (opts.sort) {
        case 'az': result.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')); break;
        case 'year-asc': result.sort((a, b) => (a.year || 9999) - (b.year || 9999)); break;
        case 'title-desc': result.sort((a, b) => b.title.localeCompare(a.title, 'pt-BR')); break;
        default: result.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      }

      const offset = Number(opts.offset) || 0;
      const limit = Number(opts.limit) || 0;
      return limit ? result.slice(offset, offset + limit) : result.slice(offset);
    },

    count(opts = {}) { return this.query(opts).length; },

    related(item, limit = 8) {
      if (!item) return [];
      return state.items
        .filter(i => i.slug !== item.slug)
        .map(i => {
          let score = 0;
          (i.categories || []).forEach(c => { if ((item.categories || []).includes(c)) score += 3; });
          (i.genres || []).forEach(g => { if ((item.genres || []).includes(g)) score += 2; });
          if (i.type === item.type) score += 1;
          if (i.year && item.year && Math.abs(i.year - item.year) <= 2) score += 1;
          return { item: i, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.item);
    },

    featured(limit = 12) {
      return state.items.filter(i => i.year && i.year >= 2016 && i.image).slice(0, limit);
    },

    getPlatform(id) { return state.platforms.find(p => p.id === id) || null; },
    getCollection(slug) { return state.collections.find(c => c.slug === slug) || null; }
  };

  window.BahamaCatalog = api;
})();
