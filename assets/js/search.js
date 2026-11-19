/**
 * Busca global do cabeçalho: sugestões em tempo real e navegação por teclado.
 */
(function () {
  'use strict';

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const box = document.getElementById('search-suggestions');

  if (!form || !input || !box) return;

  const MAX = 6;
  let timer = null;
  let matches = [];
  let active = -1;

  const escape = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function hide() {
    box.hidden = true;
    box.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    active = -1;
    matches = [];
  }

  function show() {
    const term = input.value.trim();
    if (term.length < 2 || !window.BahamaCatalog || !BahamaCatalog.loaded) return hide();

    matches = BahamaCatalog.query({ term, limit: MAX });
    if (!matches.length) {
      box.innerHTML = '<div class="suggestion-empty">Nenhum título encontrado</div>';
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    box.innerHTML = matches.map((m, i) => `
      <div class="suggestion" role="option" data-index="${i}" aria-selected="false">
        ${m.image
          ? `<img src="${escape(m.image)}" alt="" loading="lazy">`
          : `<div class="poster-fallback" style="width:34px;height:46px;font-size:16px">${escape(m.title.charAt(0))}</div>`}
        <div>
          <strong>${escape(m.title)}</strong>
          <small>${escape(m.type)}${m.year ? ' • ' + m.year : ''}${m.categories.length ? ' • ' + escape(m.categories[0]) : ''}</small>
        </div>
      </div>`).join('');
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = -1;
  }

  function highlight() {
    box.querySelectorAll('.suggestion').forEach((el, i) => {
      const on = i === active;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function goTo(item) {
    hide();
    input.blur();
    location.hash = '#/titulo/' + item.slug;
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(show, 160);
  });

  input.addEventListener('keydown', (e) => {
    if (box.hidden || !matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = (active + 1) % matches.length;
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active - 1 + matches.length) % matches.length;
      highlight();
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      goTo(matches[active]);
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  box.addEventListener('click', (e) => {
    const el = e.target.closest('.suggestion');
    if (el) goTo(matches[Number(el.dataset.index)]);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    hide();
    input.blur();
    location.hash = q ? '#/busca?q=' + encodeURIComponent(q) : '#/filmes';
  });

  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) hide();
  });

  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(tag)) {
      e.preventDefault();
      input.focus();
    }
  });

  window.BahamaSearch = {
    setQuery(q) { input.value = q || ''; hide(); }
  };
})();
