/**
 * Bahama Flix — roteador e renderização (SPA sem dependências).
 */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const loading = document.getElementById('loading-state');
  const header = document.getElementById('site-header');
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const yearEl = document.getElementById('year');
  const toastEl = document.getElementById('toast');

  const PAGE_SIZE = 24;
  let pagesContent = {};
  let filters = { category: null, year: null, sort: 'year', visible: PAGE_SIZE };
  let toastTimer = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
  }

  function resetFilters() {
    filters = { category: null, year: null, sort: 'year', visible: PAGE_SIZE };
  }

  function ratingBadge(item) {
    const rating = item.enrichment && item.enrichment.rating;
    return rating
      ? `<span class="badge badge-rating" title="Nota externa">★ ${Number(rating).toFixed(1)}</span>`
      : '';
  }

  function platformUrl(platform, term) {
    return (platform.searchUrl || platform.url).replace('{query}', encodeURIComponent(term || ''));
  }

  function metaLine(item) {
    const bits = [];
    if (item.year) bits.push(item.year);
    bits.push(item.type);
    if (item.categories && item.categories[0]) bits.push(item.categories[0]);
    if (item.duration) bits.push(item.duration);
    return bits.join(' • ');
  }

  function bindPosters(root = app) {
    root.querySelectorAll('.poster img, .hero-bg, .detail-bg, .season-card img, .series-cover, .suggestion img').forEach(img => {
      const fail = () => {
        const fallback = img.parentElement?.querySelector('.poster-fallback, .season-placeholder');
        if (fallback) fallback.style.display = 'grid';
        img.style.display = 'none';
      };
      // Imagem pode falhar antes do listener ser anexado (cache/erro imediato).
      if (img.complete && img.naturalWidth === 0) fail();
      else img.addEventListener('error', fail, { once: true });
    });
  }

  function card(item, delay = 0) {
    const hasImage = Boolean(item.image);
    return `
      <article class="card" style="animation-delay:${Math.min(delay, 12) * 18}ms">
        <a class="card-link" href="#/titulo/${esc(item.slug)}" aria-label="${esc(item.title)}">
          <div class="poster">
            ${hasImage ? `<img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async">` : ''}
            <div class="poster-fallback" style="${hasImage ? 'display:none' : ''}">${esc(item.title.charAt(0))}</div>
            <span class="poster-badge">${esc(item.quality || 'HD')}</span>
            ${ratingBadge(item)}
            <div class="poster-play"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${esc(item.title)}</h3>
            <div class="card-sub">
              ${item.year ? `<span>${item.year}</span><span class="dot"></span>` : ''}
              <span>${esc(item.type)}</span>
              ${item.categories[0] ? `<span class="dot"></span><span>${esc(item.categories[0])}</span>` : ''}
              ${item.source ? `<span class="dot"></span><span class="source-name">${esc(item.source)}</span>` : ''}
            </div>
          </div>
        </a>
      </article>`;
  }

  function grid(items) {
    return items.length
      ? `<div class="grid">${items.map((it, i) => card(it, i)).join('')}</div>`
      : `<div class="empty"><svg class="icon" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/></svg>
           <h2>Nada por aqui</h2><p>Tente outro termo ou remova alguns filtros.</p></div>`;
  }

  /* ======================== Página inicial ======================== */
  function renderHome() {
    const all = BahamaCatalog.items;
    const featuredPool = BahamaCatalog.featured(14);
    const hero = featuredPool[Math.floor(Math.random() * featuredPool.length)] || all[0];
    const series = BahamaCatalog.series.slice(0, 14);
    const recent = all.filter(i => i.year && i.year >= 2018).slice(0, 14);

    app.innerHTML = `
      <div class="container page">
        ${hero ? `
        <section class="hero" aria-label="Destaque">
          ${hero.image ? `<img class="hero-bg" src="${esc(hero.image)}" alt="" decoding="async" fetchpriority="high">` : ''}
          <div class="hero-content">
            <span class="eyebrow">Destaque do catálogo</span>
            <h1>${esc(hero.title)}</h1>
            <div class="meta">
              ${hero.year ? `<span>${hero.year}</span>` : ''}
              <span>${esc(hero.type)}</span>
              ${hero.categories.slice(0, 2).map(c => `<span class="tag">${esc(c)}</span>`).join('')}
            </div>
            <p>${esc(hero.synopsis)}</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#/titulo/${esc(hero.slug)}">
                <svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>
                Assistir agora
              </a>
              <a class="btn btn-ghost" href="#/titulo/${esc(hero.slug)}">Mais informações</a>
            </div>
          </div>
        </section>` : ''}

        <section class="section">
          <div class="section-head"><h2>Adicionados recentemente</h2><a href="#/filmes">Ver todos →</a></div>
          <div class="row-scroll">${recent.map((it, i) => card(it, i)).join('')}</div>
        </section>

        ${series.length ? `
        <section class="section">
          <div class="section-head"><h2>Séries para maratonar</h2><a href="#/series">Ver todas →</a></div>
          <div class="row-scroll">${series.map(s => seriesCard(s)).join('')}</div>
        </section>` : ''}

        ${BahamaCatalog.collections.length ? `
        <section class="section">
          <div class="section-head"><h2>Coleções</h2><a href="#/colecoes">Ver todas →</a></div>
          <div class="collection-grid">${BahamaCatalog.collections.map(collectionTile).join('')}</div>
        </section>` : ''}

        <section class="section">
          <div class="section-head"><h2>Explore por gênero</h2><a href="#/generos">Todos os gêneros →</a></div>
          <div class="category-cloud">
            ${BahamaCatalog.categories.slice(0, 10).map(c => {
              const n = BahamaCatalog.count({ category: c });
              return `<a class="category-tile" href="#/genero/${encodeURIComponent(c)}">${esc(c)}<small>${n} títulos</small></a>`;
            }).join('')}
          </div>
        </section>

        ${BahamaCatalog.platforms.length ? `
        <section class="section">
          <div class="section-head"><h2>Onde assistir</h2><a href="#/plataformas">Ver todos os serviços →</a></div>
          <div class="platform-strip">
            ${BahamaCatalog.platforms.slice(0, 6).map(p => `
              <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" style="--platform:${esc(p.color || 'var(--accent)')}">
                <span class="dot-mark" aria-hidden="true"></span>${esc(p.name)}
              </a>`).join('')}
          </div>
        </section>` : ''}

        <section class="section">
          <div class="section-head"><h2>Todo o catálogo</h2><a href="#/filmes">Explorar →</a></div>
          ${grid(all.slice(0, PAGE_SIZE))}
          <div class="load-more"><a class="btn btn-ghost" href="#/filmes">Carregar catálogo completo</a></div>
        </section>
      </div>`;
    bindPosters();
  }

  /* ==================== Listagem / busca / gênero ==================== */
  function renderCatalogPage(config) {
    // config: { eyebrow, title, type, category, term }
    const { eyebrow, title, type, category, term } = config;

    const opts = { type, category, term, sort: filters.sort };
    if (filters.year) opts.year = filters.year;
    const total = BahamaCatalog.count(opts);
    const items = BahamaCatalog.query({ ...opts, limit: filters.visible });

    const catChips = ['Todos', ...BahamaCatalog.categories.filter(c =>
      BahamaCatalog.count({ type, term, category: c }) > 0)];

    app.innerHTML = `
      <div class="container page">
        <span class="eyebrow">${esc(eyebrow)}</span>
        <h1 class="page-title">${esc(title)}</h1>

        <div class="filter-bar">
          ${catChips.map(c => `
            <button class="chip ${filters.category === c || (!filters.category && c === 'Todos') ? 'active' : ''}"
                    data-category="${esc(c === 'Todos' ? '' : c)}" type="button">${esc(c)}</button>`).join('')}
          <span class="filter-spacer"></span>
          <select class="select" id="filter-year" aria-label="Filtrar por ano">
            <option value="">Todos os anos</option>
            ${BahamaCatalog.years.map(y => `<option value="${y}" ${String(filters.year) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
          <select class="select" id="filter-sort" aria-label="Ordenar">
            <option value="year" ${filters.sort === 'year' ? 'selected' : ''}>Mais recentes</option>
            <option value="az" ${filters.sort === 'az' ? 'selected' : ''}>A – Z</option>
            <option value="title-desc" ${filters.sort === 'title-desc' ? 'selected' : ''}>Z – A</option>
            <option value="year-asc" ${filters.sort === 'year-asc' ? 'selected' : ''}>Mais antigos</option>
          </select>
        </div>

        <p class="result-count" id="result-count">${total} ${total === 1 ? 'título encontrado' : 'títulos encontrados'}${term ? ` para “${esc(term)}”` : ''}</p>
        <div id="results">${grid(items)}</div>
        ${items.length < total ? `<div class="load-more"><button class="btn btn-ghost" id="load-more" type="button">Carregar mais</button></div>` : ''}
      </div>`;

    const rerender = () => {
      const nextOpts = { type, category: filters.category, term, sort: filters.sort };
      if (filters.year) nextOpts.year = filters.year;
      const nextTotal = BahamaCatalog.count(nextOpts);
      const nextItems = BahamaCatalog.query({ ...nextOpts, limit: filters.visible });
      document.getElementById('results').innerHTML = grid(nextItems);
      document.getElementById('result-count').textContent =
        `${nextTotal} ${nextTotal === 1 ? 'título encontrado' : 'títulos encontrados'}${term ? ` para “${term}”` : ''}`;
      const more = document.getElementById('load-more');
      if (nextItems.length < nextTotal && !more) {
        document.querySelector('.load-more')?.remove();
        app.querySelector('.page').insertAdjacentHTML('beforeend',
          '<div class="load-more"><button class="btn btn-ghost" id="load-more" type="button">Carregar mais</button></div>');
        document.getElementById('load-more').addEventListener('click', loadMore);
      } else if (nextItems.length >= nextTotal && more) {
        more.closest('.load-more').remove();
      }
      bindPosters(document.getElementById('results'));
    };

    const loadMore = () => { filters.visible += PAGE_SIZE; rerender(); };

    app.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.category = btn.dataset.category || null;
        filters.visible = PAGE_SIZE;
        app.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b === btn));
        rerender();
      });
    });
    document.getElementById('filter-year').addEventListener('change', (e) => {
      filters.year = e.target.value || null;
      filters.visible = PAGE_SIZE;
      rerender();
    });
    document.getElementById('filter-sort').addEventListener('change', (e) => {
      filters.sort = e.target.value;
      filters.visible = PAGE_SIZE;
      rerender();
    });
    document.getElementById('load-more')?.addEventListener('click', loadMore);
    bindPosters();
  }

  /* ======================== Gêneros ======================== */
  function renderGenres() {
    app.innerHTML = `
      <div class="container page">
        <span class="eyebrow">Navegue</span>
        <h1 class="page-title">Gêneros</h1>
        <div class="category-cloud">
          ${BahamaCatalog.categories.map(c => {
            const n = BahamaCatalog.count({ category: c });
            return `<a class="category-tile" href="#/genero/${encodeURIComponent(c)}">${esc(c)}<small>${n} títulos</small></a>`;
          }).join('')}
        </div>
      </div>`;
  }

  /* ======================== Coleções ======================== */
  function collectionTile(c) {
    const total = (c.groups || []).reduce((n, g) => n + g.items.length, 0);
    const groupCount = (c.groups || []).length;
    return `
      <a class="collection-tile" href="#/colecao/${esc(c.slug)}">
        ${c.image ? `<img class="collection-tile-bg" src="${esc(c.image)}" alt="" loading="lazy" decoding="async">` : ''}
        <span class="collection-tile-body">
          <span class="eyebrow">${esc(c.eyebrow || 'Coleção')}</span>
          <strong>${esc(c.title)}</strong>
          <small>${total} títulos · ${groupCount} ${groupCount === 1 ? 'grupo' : 'grupos'}</small>
        </span>
      </a>`;
  }

  function renderCollections() {
    app.innerHTML = `
      <div class="container page">
        <span class="eyebrow">Navegue</span>
        <h1 class="page-title">Coleções</h1>
        <p class="section-intro">Sagas e versões de um mesmo herói, agrupadas para você não perder nenhum título.</p>
        <div class="collection-grid">${BahamaCatalog.collections.map(collectionTile).join('')}</div>
      </div>`;
    bindPosters();
  }

  function renderCollection(slug) {
    const collection = BahamaCatalog.getCollection(slug);
    if (!collection) return renderNotFound('Coleção não encontrada.');

    const groups = (collection.groups || []).map(group => {
      const items = (group.items || []).map(s => BahamaCatalog.getBySlug(s)).filter(Boolean);
      if (!items.length) return '';
      return `
        <section class="actor-group">
          <div class="actor-head">
            <div>
              <h2>${esc(group.name)}</h2>
              ${group.note ? `<p class="section-intro">${esc(group.note)}</p>` : ''}
            </div>
            <span class="episode-source">${items.length} ${items.length === 1 ? 'título' : 'títulos'}</span>
          </div>
          <div class="grid">${items.map((it, i) => card(it, i)).join('')}</div>
        </section>`;
    }).join('');

    app.innerHTML = `
      <div class="container page">
        <a class="back-link" href="#/colecoes">← Todas as coleções</a>
        <span class="eyebrow">${esc(collection.eyebrow || 'Coleção')}</span>
        <h1 class="page-title">${esc(collection.title)}</h1>
        <p class="series-synopsis">${esc(collection.description || '')}</p>
        ${groups}
      </div>`;
    bindPosters();
  }

  /* ==================== Séries e episódios ==================== */
  function seriesCard(series) {
    const hasImage = Boolean(series.poster);
    return `
      <article class="card">
        <a class="card-link" href="#/serie/${esc(series.slug)}" aria-label="${esc(series.name)}">
          <div class="poster">
            ${hasImage ? `<img src="${esc(series.poster)}" alt="${esc(series.name)}" loading="lazy" decoding="async">` : ''}
            <div class="poster-fallback" style="${hasImage ? 'display:none' : ''}">${esc(series.name.charAt(0))}</div>
            <span class="poster-badge">${series.seasonCount} ${series.seasonCount === 1 ? 'temporada' : 'temporadas'}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${esc(series.name)}</h3>
            <div class="card-sub"><span>Série</span>${series.seasons[0]?.year ? `<span class="dot"></span><span>${series.seasons[0].year}</span>` : ''}</div>
          </div>
        </a>
      </article>`;
  }

  function seasonGrid(series, activeSlug) {
    if (!series || !series.seasons.length) return '';
    return `<div class="season-grid">${series.seasons.map(s => {
      const count = BahamaCatalog.availableCount(series.slug, s.slug);
      const detail = count ? `${count} episódios disponíveis` : (s.watchUrl ? 'Abrir pasta' : 'Sem link');
      return `
      <a class="season-card ${s.slug === activeSlug ? 'active' : ''}" href="#/titulo/${esc(s.slug)}">
        ${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy" decoding="async">` : '<div class="season-placeholder">▶</div>'}
        <span class="season-info">
          <strong>${esc(s.title)}</strong>
          <small>${s.year ? esc(s.year) + ' • ' : ''}${esc(detail)}</small>
        </span>
      </a>`;
    }).join('')}</div>`;
  }

  function episodeGuide(seriesSlug) {
    return seriesSlug ? (BahamaCatalog.episodes[seriesSlug] || null) : null;
  }

  function episodesForSeason(item) {
    const guide = episodeGuide(item.seriesSlug);
    if (!guide || !guide.seasons.length) return null;
    const series = BahamaCatalog.getSeries(item.seriesSlug);
    const entry = series && series.seasons.find(s => s.slug === item.slug);
    return guide.seasons[(entry ? entry.number : 1) - 1] || null;
  }

  function episodeGrid(season, offset = 0) {
    return `<div class="episode-grid">${season.episodes.map((e, i) => `
      <div class="episode-item">
        <span class="episode-number">${String((offset || e.number)).padStart(2, '0')}</span>
        <div class="episode-text">
          <strong>${esc(e.title)}</strong>
          ${e.airdate ? `<small>Estreia: ${esc(e.airdate)}</small>` : ''}
        </div>
      </div>`).join('')}</div>`;
  }

  /** Remove rótulos técnicos (site, qualidade, codec, áudio) de um nome de arquivo. */
  function cleanFilename(text) {
    return String(text || '')
      .replace(/(?:www\.)?[\w-]+\.(?:com|org|net|tv|cc|co|me|io|xyz|top|site|link|club|ru|info|biz)\b/gi, '')
      .replace(/\b(?:720p|1080p|2160p|4k|web-?dl|webrip|hdtv|bluray|brrip|h264|x264|x265|hevc|aac|ac3|ddp5?1?|6ch|dual|dub|dublado|legendado|leg|sub|subtitulado|mp4|mkv|avi|mov|webm|proper|repack|extended|amzn|nf|dsnp|atvp|hmax)\b/gi, '')
      .replace(/\.[a-z0-9]{2,4}$/i, '')
      .replace(/^[\s.\-–—_]+|[\s.\-–—_]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function episodeNumber(entry, text) {
    if (entry.number) return Number(entry.number);
    const m = String(text || '').match(/\b(?:S\d{1,2}E0*(\d{1,3})|epis[oó]dio\s*0*(\d{1,3})|[Ee]0*(\d{1,3}))\b/i);
    return m ? Number(m[1] || m[2] || m[3]) : null;
  }

  /** Devolve um título legível em português, sem nomes técnicos de arquivo. */
  function availableTitle(entry) {
    const text = String(entry.title || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const number = episodeNumber(entry, text);

    const ptMatch = text.match(/\bepis[oó]dio\s*0*(\d{1,3})\s*[-–—:]\s*(.+)$/i);
    if (ptMatch && ptMatch[2]) {
      const title = cleanFilename(ptMatch[2]);
      return title || `Episódio ${Number(ptMatch[1])}`;
    }

    const epMatch = text.match(/\bS\d{1,2}E0*(\d{1,3})\b/i);
    if (epMatch) {
      const title = cleanFilename(text.slice(epMatch.index + epMatch[0].length));
      return title || (number ? `Episódio ${number}` : `Episódio ${Number(epMatch[1])}`);
    }

    return cleanFilename(text) || (number ? `Episódio ${number}` : 'Episódio');
  }

  /** Badges de áudio detectados no nome do arquivo. */
  function audioBadges(entry) {
    const raw = `${entry.title || ''} ${entry.file || ''}`.toLowerCase();
    if (/\bdual\b|dual[ -]?[aá]udio/.test(raw)) return ['Dual áudio'];
    const badges = [];
    if (/\bdub\b|dublado|dublagem/.test(raw)) badges.push('Dublado');
    if (/legendado|subtitulado|\bleg\b|\bsub\b/.test(raw)) badges.push('Legendado');
    return badges;
  }

  function availableGrid(season) {
    return `<div class="episode-grid">${season.episodes.map(e => {
      const audio = audioBadges(e);
      return `
      <div class="episode-item">
        <span class="episode-number">${e.number ? String(e.number).padStart(2, '0') : '—'}</span>
        <div class="episode-text">
          <strong>${esc(availableTitle(e))}</strong>
          ${audio.length ? `<span class="audio-badges">${audio.map(b => `<span class="audio-badge">${esc(b)}</span>`).join('')}</span>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function availableSection(item) {
    const available = item.seriesSlug && BahamaCatalog.getAvailable(item.seriesSlug, item.slug);
    if (!available || !available.episodes.length) return '';
    return `
      <section class="section episode-section" id="disponiveis">
        <div class="section-head"><h2>Episódios disponíveis</h2><span class="episode-source">${available.count} arquivos na pasta</span></div>
        <p class="section-intro">Arquivos listados publicamente na pasta desta temporada. Use “Abrir episódios” para acessá-los.</p>
        ${availableGrid(available)}
      </section>`;
  }

  function episodeSection(item) {
    const ep = episodesForSeason(item);
    if (!ep || !ep.episodes.length) return '';
    return `
      <section class="section episode-section" id="episodios">
        <div class="section-head"><h2>Guia de episódios</h2><span class="episode-source">TVmaze</span></div>
        <p class="section-intro">${ep.episodes.length} episódios no guia externo — pode divergir dos arquivos da pasta.</p>
        ${episodeGrid(ep)}
      </section>`;
  }

  function renderSeriesIndex() {
    const all = BahamaCatalog.series;
    app.innerHTML = `
      <div class="container page">
        <span class="eyebrow">Catálogo</span>
        <h1 class="page-title">Séries</h1>
        <p class="section-intro">${all.length} séries organizadas por temporada. Abra uma série para ver os episódios disponíveis.</p>
        <div class="grid">${all.map(s => seriesCard(s)).join('')}</div>
      </div>`;
    bindPosters();
  }

  function renderSeriesPage(slug) {
    const series = BahamaCatalog.getSeries(slug);
    if (!series) return renderNotFound('Série não encontrada no catálogo.');
    const guide = episodeGuide(slug);
    const availableSeasons = (BahamaCatalog.available[slug] || {}).seasons || [];
    const availableTotal = availableSeasons.reduce((n, s) => n + s.count, 0);
    const seasonBySlug = new Map(series.seasons.map(s => [s.slug, s]));

    app.innerHTML = `
      <div class="container page">
        <span class="eyebrow">Série</span>
        <div class="series-head">
          ${series.poster ? `<img class="series-cover" src="${esc(series.poster)}" alt="${esc(series.name)}">` : ''}
          <div>
            <h1 class="page-title">${esc(series.name)}</h1>
            <p class="series-stats">${series.seasonCount} ${series.seasonCount === 1 ? 'temporada' : 'temporadas'} no catálogo${availableTotal ? ` · ${availableTotal} episódios disponíveis` : ''}</p>
            <p class="series-synopsis">${esc(series.synopsis)}</p>
          </div>
        </div>

        <section class="section">
          <div class="section-head"><h2>Temporadas disponíveis</h2></div>
          ${seasonGrid(series)}
        </section>

        ${availableSeasons.length ? `
        <section class="section" id="disponiveis">
          <div class="section-head"><h2>Episódios disponíveis</h2><span class="episode-source">${availableTotal} arquivos</span></div>
          <p class="section-intro">Nomes de arquivos visíveis nas pastas públicas. Abra uma temporada para acessar a pasta original.</p>
          <div class="guide-list">
            ${availableSeasons.map((s, i) => {
              const season = seasonBySlug.get(s.slug);
              return `
              <details class="guide-season" ${i === 0 ? 'open' : ''}>
                <summary>${esc(s.folderTitle)}<span class="guide-count">${s.count} episódios</span></summary>
                <div class="guide-body">
                  ${availableGrid(s)}
                  ${season && season.watchUrl ? `<div class="guide-actions"><a class="watch-link" href="${esc(season.watchUrl)}" target="_blank" rel="noopener noreferrer">Abrir pasta ↗</a></div>` : ''}
                </div>
              </details>`;
            }).join('')}
          </div>
        </section>` : ''}

        ${guide ? `
        <section class="section">
          <div class="section-head"><h2>Guia de episódios</h2><span class="episode-source">TVmaze</span></div>
          <p class="section-intro">Metadados externos; a quantidade pode divergir dos arquivos da pasta.</p>
          <div class="guide-list">
            ${guide.seasons.map((s, i) => `
              <details class="guide-season">
                <summary>Temporada ${i + 1}${s.label !== String(i + 1) ? ` <span class="guide-label">(${esc(s.label)})</span>` : ''}<span class="guide-count">${s.episodes.length} episódios</span></summary>
                <div class="guide-body">${episodeGrid(s)}</div>
              </details>`).join('')}
          </div>
        </section>` : ''}
      </div>`;
    bindPosters();
  }

  /* ======================== Plataformas ======================== */
  function renderPlatforms() {
    const platforms = BahamaCatalog.platforms;
    app.innerHTML = `
      <div class="container page">
        <span class="eyebrow">Onde assistir</span>
        <h1 class="page-title">Onde assistir</h1>
        <p class="section-intro">Serviços licenciados e projetos de código aberto com licença declarada. A disponibilidade pode variar conforme o país.</p>
        <div class="platform-grid">
          ${platforms.map(p => `
            <article class="platform-card" style="--platform:${esc(p.color || 'var(--accent)')}">
              <div class="platform-top">
                <div class="platform-mark" aria-hidden="true">${esc(p.name.charAt(0))}</div>
                <div><h3>${esc(p.name)}</h3><span class="platform-type">${esc(p.type)}${p.license ? ` · ${esc(p.license)}` : ''}</span></div>
              </div>
              <p>${esc(p.note)}</p>
              <dl class="platform-meta">
                <div><dt>Região</dt><dd>${esc(p.region)}</dd></div>
                <div><dt>Conteúdo</dt><dd>${esc(p.genres)}</dd></div>
              </dl>
              <div class="platform-actions">
                <a class="btn btn-sm btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Visitar site</a>
                ${p.repo ? `<a class="btn btn-sm btn-ghost" href="${esc(p.repo)}" target="_blank" rel="noopener noreferrer">Código no GitHub</a>` : ''}
                <div class="platform-search">
                  <input type="search" placeholder="Buscar na plataforma" aria-label="Buscar em ${esc(p.name)}" data-platform="${esc(p.id)}">
                  <button class="btn btn-sm btn-ghost" type="button" data-platform-search="${esc(p.id)}">Buscar</button>
                </div>
              </div>
            </article>`).join('')}
        </div>
      </div>`;

    app.querySelectorAll('[data-platform-search]').forEach(btn => {
      const open = () => {
        const id = btn.dataset.platformSearch;
        const platform = BahamaCatalog.getPlatform(id);
        if (!platform) return;
        const input = app.querySelector(`[data-platform="${id}"]`);
        window.open(platformUrl(platform, input ? input.value.trim() : ''), '_blank', 'noopener,noreferrer');
      };
      btn.addEventListener('click', open);
      app.querySelector(`[data-platform="${btn.dataset.platformSearch}"]`)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') open();
      });
    });
  }

  /* ======================== Detalhe ======================== */
  function watchBlock(item) {
    const ex = item.enrichment || {};
    const links = [];

    if (item.watchUrl) {
      const label = item.seriesSlug ? 'Abrir episódios' : 'Assistir agora';
      links.push(`<a class="watch-link watch-link-primary" href="${esc(item.watchUrl)}" target="_blank" rel="noopener noreferrer">
        ▶ ${label}${item.source ? ' · ' + esc(item.source) : ''}</a>`);
    }
    if (ex.justWatch) links.push(`<a class="watch-link" href="${esc(ex.justWatch)}" target="_blank" rel="noopener noreferrer">Disponibilidade · JustWatch</a>`);
    if (ex.tmdbUrl || ex.tmdbSearch) links.push(`<a class="watch-link" href="${esc(ex.tmdbUrl || ex.tmdbSearch)}" target="_blank" rel="noopener noreferrer">TMDB</a>`);
    if (ex.tvmazeUrl) links.push(`<a class="watch-link" href="${esc(ex.tvmazeUrl)}" target="_blank" rel="noopener noreferrer">TVmaze</a>`);
    if (ex.officialSite) links.push(`<a class="watch-link" href="${esc(ex.officialSite)}" target="_blank" rel="noopener noreferrer">Site oficial</a>`);
    if (ex.wikipedia) links.push(`<a class="watch-link" href="${esc(ex.wikipedia)}" target="_blank" rel="noopener noreferrer">Wikipedia</a>`);
    if (ex.letterboxd) links.push(`<a class="watch-link" href="${esc(ex.letterboxd)}" target="_blank" rel="noopener noreferrer">Letterboxd</a>`);

    if (!links.length) return '';

    const providers = ex.providers || {};
    const groups = [
      ['Grátis', providers.free], ['Com anúncios', providers.ads],
      ['Incluído em', providers.flatrate], ['Aluguel/compra', providers.buy]
    ].filter(([, list]) => list && list.length);

    return `
      <div class="watch-block" id="onde-assistir">
        <h2>Onde assistir</h2>
        <div class="watch-links">${links.join('')}</div>
        ${groups.length ? `<div class="provider-groups">${groups.map(([label, list]) =>
          `<div class="provider-group"><strong>${label}:</strong> ${esc(list.join(', '))}</div>`).join('')}</div>` : ''}
        <p class="watch-note">${item.source
          ? `Fonte: ${esc(item.source)}.`
          : 'A disponibilidade pode variar conforme o país. Consulte os serviços acima.'}</p>
      </div>`;
  }

  function renderDetail(slug) {
    const item = BahamaCatalog.getBySlug(slug);
    if (!item) return renderNotFound('Título não encontrado no catálogo.');
    const related = BahamaCatalog.related(item, 8);
    const series = item.seriesSlug ? BahamaCatalog.getSeries(item.seriesSlug) : null;
    const rating = item.enrichment && item.enrichment.rating;

    app.innerHTML = `
      <article class="detail">
        <div class="detail-hero">
          ${item.image ? `<img class="detail-bg" src="${esc(item.image)}" alt="" decoding="async" fetchpriority="high">` : ''}
          <div class="detail-layout">
            ${item.image
              ? `<img class="detail-poster" src="${esc(item.image)}" alt="${esc(item.title)}">`
              : `<div class="detail-poster poster-fallback" style="display:grid">${esc(item.title.charAt(0))}</div>`}
            <div class="detail-info">
              <span class="eyebrow">${esc(item.type)}</span>
              <h1>${esc(item.title)}</h1>
              <div class="detail-meta">
                ${item.year ? `<span>${item.year}</span>` : ''}
                ${item.duration ? `<span>${esc(item.duration)}</span>` : ''}
                ${item.categories.map(c => `<span class="tag">${esc(c)}</span>`).join('')}
                <span class="tag">${esc(item.quality || 'HD')}</span>
                ${rating ? `<span class="pill pill-rating">★ ${Number(rating).toFixed(1)}</span>` : ''}
              </div>
              <p class="detail-synopsis">${esc(item.synopsis)}</p>
              <div class="detail-actions">
                ${item.watchUrl
                  ? `<a class="btn btn-primary" href="${esc(item.watchUrl)}" target="_blank" rel="noopener noreferrer">
                       <svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>
                       ${item.seriesSlug ? 'Abrir episódios' : 'Assistir agora'}
                     </a>`
                  : `<button class="btn btn-ghost" type="button" data-unavailable>Link indisponível</button>`}
                ${series ? `<a class="btn btn-ghost" href="#/serie/${esc(series.slug)}">Todas as temporadas</a>` : ''}
                <button class="btn btn-ghost" type="button" id="back-btn">← Voltar</button>
              </div>
              <div class="info-table">
                <div class="info-item"><span>Ano</span><strong>${item.year || '—'}</strong></div>
                <div class="info-item"><span>Gêneros</span><strong>${esc((item.genres || item.categories).join(', ')) || '—'}</strong></div>
                <div class="info-item"><span>Duração</span><strong>${esc(item.duration || '—')}</strong></div>
                ${series ? `<div class="info-item"><span>Série</span><strong>${esc(series.name)} · ${series.seasonCount} temp.</strong></div>` : ''}
              </div>
              ${watchBlock(item)}
            </div>
          </div>
        </div>

        <div class="container page">
          ${series ? `
          <section class="section">
            <div class="section-head"><h2>Temporadas de ${esc(series.name)}</h2><a href="#/serie/${esc(series.slug)}">Página da série →</a></div>
            ${seasonGrid(series, item.slug)}
          </section>` : ''}

          ${item.type === 'Série' ? availableSection(item) : ''}
          ${item.type === 'Série' ? episodeSection(item) : ''}

          ${related.length ? `
          <section class="section">
            <div class="section-head"><h2>Você também pode gostar</h2></div>
            <div class="row-scroll">${related.map((it, i) => card(it, i)).join('')}</div>
          </section>` : ''}
        </div>
      </article>`;

    bindPosters();
    document.getElementById('back-btn').addEventListener('click', () => {
      if (history.length > 1) history.back(); else location.hash = '#/';
    });
    document.querySelector('[data-unavailable]')?.addEventListener('click', () =>
      toast('Este título ainda não possui link de acesso.'));
  }

  /* ==================== Páginas institucionais ==================== */
  function renderTextPage(key) {
    const data = pagesContent[key];
    if (!data) return renderNotFound('Página não encontrada.');
    app.innerHTML = `
      <div class="container text-page">
        <span class="eyebrow">${esc(data.eyebrow || 'Bahama Flix')}</span>
        <h1>${esc(data.title)}</h1>
        ${data.html || ''}
      </div>`;
  }

  function renderNotFound(message) {
    app.innerHTML = `
      <div class="container">
        <div class="empty">
          <h2>${esc(message || 'Página não encontrada')}</h2>
          <p>O endereço acessado não existe ou foi movido.</p>
          <a class="btn btn-primary" href="#/" style="margin-top:12px">Voltar ao início</a>
        </div>
      </div>`;
  }

  /* ======================== Roteador ======================== */
  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = raw.split('?');
    const parts = pathPart.split('/').filter(Boolean);
    const query = new URLSearchParams(queryPart || '');
    return { parts, query };
  }

  function route() {
    if (!BahamaCatalog.loaded) return;
    resetFilters();
    const { parts, query } = parseRoute();
    const [section, value] = parts;

    let title = 'Bahama Flix — Filmes e Séries';
    let nav = 'home';

    if (section !== 'busca') BahamaSearch.setQuery('');

    if (!section) {
      renderHome();
    } else if (section === 'filmes') {
      renderCatalogPage({ eyebrow: 'Catálogo', title: 'Filmes', type: 'Filme' });
      title = 'Filmes — Bahama Flix'; nav = 'filmes';
    } else if (section === 'series') {
      renderSeriesIndex();
      title = 'Séries — Bahama Flix'; nav = 'series';
    } else if (section === 'serie' && value) {
      const slug = decodeURIComponent(value);
      renderSeriesPage(slug);
      title = (BahamaCatalog.getSeries(slug)?.name || 'Série') + ' — Bahama Flix';
      nav = 'series';
    } else if (section === 'colecoes') {
      renderCollections();
      title = 'Coleções — Bahama Flix'; nav = 'colecoes';
    } else if (section === 'colecao' && value) {
      const slug = decodeURIComponent(value);
      renderCollection(slug);
      title = (BahamaCatalog.getCollection(slug)?.title || 'Coleção') + ' — Bahama Flix';
      nav = 'colecoes';
    } else if (section === 'desenhos') {
      renderCatalogPage({ eyebrow: 'Catálogo', title: 'Desenhos e animações', type: 'Desenho' });
      title = 'Desenhos — Bahama Flix'; nav = 'desenhos';
    } else if (section === 'legais') {
      // Link antigo: redireciona para o catálogo completo.
      location.replace('#/filmes');
      return;
    } else if (section === 'plataformas') {
      renderPlatforms();
      title = 'Onde assistir — Bahama Flix'; nav = 'plataformas';
    } else if (section === 'generos') {
      renderGenres(); title = 'Gêneros — Bahama Flix'; nav = 'generos';
    } else if (section === 'genero' && value) {
      const category = decodeURIComponent(value);
      renderCatalogPage({ eyebrow: 'Gênero', title: category, category });
      title = `${category} — Bahama Flix`; nav = 'generos';
    } else if (section === 'titulo' && value) {
      const item = BahamaCatalog.getBySlug(value);
      renderDetail(decodeURIComponent(value));
      title = (item?.title || 'Título') + ' — Bahama Flix';
      nav = item && item.seriesSlug ? 'series' : null;
    } else if (section === 'busca') {
      const q = (query.get('q') || '').trim();
      BahamaSearch.setQuery(q);
      renderCatalogPage({ eyebrow: 'Resultados', title: q ? `Busca: ${q}` : 'Busca', term: q });
      title = `Busca${q ? ': ' + q : ''} — Bahama Flix`;
      nav = null;
    } else if (['sobre', 'contato', 'faq', 'privacidade', 'termos', 'cookies'].includes(section)) {
      renderTextPage(section);
      title = `${pagesContent[section]?.title || section} — Bahama Flix`;
      nav = null;
    } else {
      renderNotFound();
      title = 'Não encontrado — Bahama Flix';
      nav = null;
    }

    document.title = title;
    document.querySelectorAll('[data-nav]').forEach(a =>
      a.classList.toggle('active', a.dataset.nav === nav));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ======================== Inicialização ======================== */
  async function init() {
    yearEl.textContent = new Date().getFullYear();

    const mobileViewport = window.matchMedia('(max-width: 700px)');
    const searchInput = document.getElementById('search-input');
    const showHeader = () => header.classList.remove('is-hidden');
    const adaptHeader = () => {
      showHeader();
      if (searchInput) {
        searchInput.placeholder = mobileViewport.matches ? 'Buscar…' : 'Buscar filmes e séries…';
      }
    };
    let lastScrollY = window.scrollY;

    adaptHeader();

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 12);

      const delta = y - lastScrollY;
      if (Math.abs(delta) < 6) return;

      // No celular, o cabeçalho sai por completo ao descer e volta ao subir.
      if (mobileViewport.matches && mobileNav.hidden) {
        if (y > 100 && delta > 0) header.classList.add('is-hidden');
        else if (delta < 0 || y <= 12) header.classList.remove('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      lastScrollY = y;
    }, { passive: true });

    mobileViewport.addEventListener('change', adaptHeader);

    menuBtn.addEventListener('click', () => {
      const open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) showHeader();
    });
    mobileNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        mobileNav.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    try {
      const [, pagesData] = await Promise.all([
        BahamaCatalog.load(),
        fetch('data/pages.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
      ]);
      pagesContent = pagesData.pages || pagesData;
      loading.hidden = true;
      route();
      window.addEventListener('hashchange', route);
    } catch (err) {
      loading.innerHTML = `
        <div class="error-box">
          <h2>Não foi possível carregar o catálogo</h2>
          <p>${esc(err.message)}</p>
          <p>Se você abriu o arquivo diretamente, use um servidor local:<br>
          <code>npx serve .</code> ou <code>python -m http.server 8000</code>.</p>
        </div>`;
      console.error(err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
