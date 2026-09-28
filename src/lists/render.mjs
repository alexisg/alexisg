/**
 * Shared, DOM-free renderer for the watch list.
 *
 * Every view is produced here as an HTML string so the exact same code runs
 * twice: once at build time (src/lists/index.11ty.js, pre-rendering the page
 * for crawlers) and once in the browser (app.js, re-rendering on interaction).
 * Nothing in this file may touch `document` or `window`.
 */

export const RATING_KEYS = ['sexualContent', 'violence', 'humor'];

export const RATING_META = {
  sexualContent: { label: 'Sex', cls: 'm-sex', short: 'sex' },
  violence: { label: 'Violence', cls: 'm-viol', short: 'viol' },
  humor: { label: 'Humor', cls: 'm-hum', short: 'hum' },
};

export const SHORT_TO_KEY = Object.fromEntries(RATING_KEYS.map(k => [RATING_META[k].short, k]));

export const SORT_KEYS = ['title', 'personalRank', 'externalRating', ...RATING_KEYS];

export const SORT_LABEL = {
  title: 'Title', personalRank: 'Rank', externalRating: 'TMDB',
  sexualContent: 'Sex', violence: 'Violence', humor: 'Humor',
};

export const GRID_SECTIONS = [
  { title: 'Watched & Watching', match: s => s.status === 'watched' || s.status === 'watching' },
  { title: 'Queued', match: s => s.status === 'queued' },
  { title: 'Dropped', match: s => s.status === 'dropped' },
];

export const DEFAULT_RANGES = () => ({ sexualContent: [0, 10], violence: [0, 10], humor: [0, 10] });

export const esc = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- effective values (base record + unsaved edits) ---------- */

export const effRank = (s, edits = {}) => edits[s.id]?.personalRank ?? s.personalRank;
export const effRating = (s, k, edits = {}) => edits[s.id]?.ratings?.[k] ?? s.ratings[k];

/* ---------- filtering + sorting ---------- */

/**
 * The list as shown, given the current filters and sort chain. Custom mode
 * ignores filters and always orders by rank.
 */
export function visibleShows(shows, { edits = {}, ranges = DEFAULT_RANGES(), sort = [], custom = false } = {}) {
  if (custom) return [...shows].sort((a, b) => effRank(a, edits) - effRank(b, edits));

  const list = shows.filter(s => RATING_KEYS.every(k => {
    const [mn, mx] = ranges[k];
    const v = effRating(s, k, edits);
    return v >= mn && v <= mx;
  }));

  return list.sort((a, b) => {
    // Dropped shows always sink to the bottom, regardless of the active sort.
    const da = a.status === 'dropped' ? 1 : 0;
    const db = b.status === 'dropped' ? 1 : 0;
    if (da !== db) return da - db;
    for (const { key, dir } of sort) {
      let av, bv;
      if (key === 'title') { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
      else if (key === 'personalRank') { av = effRank(a, edits); bv = effRank(b, edits); }
      else if (key === 'externalRating') { av = a.externalRating ?? -1; bv = b.externalRating ?? -1; }
      else { av = effRating(a, key, edits); bv = effRating(b, key, edits); }
      const r = av < bv ? -1 : av > bv ? 1 : 0;
      if (r) return dir === 'asc' ? r : -r;
    }
    return effRank(a, edits) - effRank(b, edits);
  });
}

/* ---------- shared fragments ---------- */

export function barsHtml(show, edits = {}) {
  const bars = RATING_KEYS.map(k => {
    const v = effRating(show, k, edits);
    const m = RATING_META[k];
    return `<div class="bar"><span class="k">${m.label}</span>`
      + `<span class="meter ${m.cls}"><i style="width:${v * 10}%"></i></span>`
      + `<span class="v">${v}</span></div>`;
  }).join('');
  return `<div class="bars">${bars}</div>`;
}

export function statusPillHtml(status) {
  return `<span class="status-pill status-${esc(status)}">${esc(status)}</span>`;
}

export function extHtml(show) {
  if (show.externalRating == null) return '<span class="ext" style="color:var(--faint)">—</span>';
  return `<span class="ext"><span class="star">★ </span>${show.externalRating.toFixed(1)}</span>`;
}

// Broken/missing art is flagged inline so the markup works without JS wiring.
export function thumbHtml(show, cls = 'thumb') {
  const alt = `Poster for ${esc(show.title)}`;
  if (!show.poster) return `<img class="${cls} broken" alt="" loading="lazy">`;
  return `<img class="${cls}" loading="lazy" alt="${alt}" src="${esc(show.poster)}"`
    + ` onerror="this.classList.add('broken')">`;
}

function ratingEditHtml(show, edits) {
  const items = RATING_KEYS.map(k => `<label class="item"><span class="k">${RATING_META[k].label}</span>`
    + `<input type="number" min="0" max="10" step="1" data-rating="${k}"`
    + ` value="${effRating(show, k, edits)}"></label>`).join('');
  return `<div class="rate-edit">${items}</div>`;
}

/* ---------- grid view ---------- */

export function cardHtml(show, edits = {}) {
  const tags = show.tags?.length ? ` Tags: ${esc(show.tags.join(', '))}.` : '';
  return `<div class="card" data-id="${esc(show.id)}">`
    + thumbHtml(show, 'poster')
    + '<div class="body">'
    + `<div class="head"><div><div class="t">${esc(show.title)}</div>`
    + `<div class="yr">${esc(show.year)}</div></div>${statusPillHtml(show.status)}</div>`
    + `<div class="rankext"><span><span class="rank-badge">#${effRank(show, edits)}</span></span>`
    + `<span class="ext-label">TMDB</span>${extHtml(show)}</div>`
    + barsHtml(show, edits)
    + `<div class="desc">${esc(show.notes)}</div>`
    // Full synopsis + tags stay in the markup for crawlers and screen readers;
    // the card itself only has room for the short note.
    + `<div class="sr-only">${esc(show.description)}${tags}</div>`
    + '</div></div>';
}

export function gridHtml(list, edits = {}) {
  let out = '';
  for (const sec of GRID_SECTIONS) {
    const items = list.filter(sec.match);
    if (!items.length) continue;
    out += `<div class="grid-section-h">${esc(sec.title)}<span class="cnt">${items.length}</span></div>`;
    out += `<div class="grid">${items.map(s => cardHtml(s, edits)).join('')}</div>`;
  }
  return out;
}

/* ---------- table view ---------- */

const TABLE_HEADERS = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'personalRank', label: 'Rank', sortable: true },
  { key: 'externalRating', label: 'TMDB', sortable: true },
  { key: 'ratings', label: 'Ratings' },
  { key: 'desc', label: 'Notes' },
];

export function tableHtml(list, { edits = {}, sort = [] } = {}) {
  const ths = TABLE_HEADERS.map(h => {
    const i = sort.findIndex(s => s.key === h.key);
    const arrow = i >= 0 ? `<span class="dir"> ${sort[i].dir === 'asc' ? '↑' : '↓'}</span>` : '';
    const ord = i >= 0 && sort.length > 1 ? `<span class="ord">${i + 1}</span>` : '';
    const attrs = h.sortable ? ` class="sortable" data-sort-key="${h.key}"` : '';
    return `<th${attrs}>${h.label}${arrow}${ord}</th>`;
  }).join('');

  const rows = list.map(s => `<tr class="clickable" data-id="${esc(s.id)}">`
    + `<td><div class="cell-title">${thumbHtml(s)}<div><span class="t">${esc(s.title)}</span>`
    + `<span class="yr">(${esc(s.year)})</span></div></div></td>`
    + `<td>${statusPillHtml(s.status)}</td>`
    + `<td class="num"><span class="rank-badge">${effRank(s, edits)}</span></td>`
    + `<td class="num">${extHtml(s)}</td>`
    + `<td>${barsHtml(s, edits)}</td>`
    + `<td><div class="desc">${esc(s.notes)}</div></td></tr>`).join('');

  return `<div class="tablewrap"><table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------- custom (drag-to-reorder) table ---------- */

export function customTableHtml(list, edits = {}) {
  const rows = list.map(s => {
    const ed = edits[s.id] ? ' edited' : '';
    return `<tr class="drag-row" draggable="true" data-id="${esc(s.id)}">`
      + `<td class="${ed.trim()}"><span class="handle">⋮⋮</span></td>`
      + `<td class="num${ed}"><span class="rank-badge">${effRank(s, edits)}</span></td>`
      + `<td><div class="cell-title">${thumbHtml(s)}<div><span class="t">${esc(s.title)}</span>`
      + `<span class="yr">(${esc(s.year)})</span></div></div></td>`
      + `<td>${statusPillHtml(s.status)}</td>`
      + `<td>${ratingEditHtml(s, edits)}</td></tr>`;
  }).join('');

  return '<div class="tablewrap custom-table"><table><thead><tr>'
    + '<th></th><th>Rank</th><th>Title</th><th>Status</th><th>Ratings (editable)</th>'
    + `</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------- detail dialog ---------- */

export function detailHtml(show, edits = {}) {
  const links = [
    show.tmdbId && `<a href="https://www.themoviedb.org/tv/${esc(show.tmdbId)}" target="_blank" rel="noopener">TMDB ↗</a>`,
    show.imdbId && `<a href="https://www.imdb.com/title/${esc(show.imdbId)}" target="_blank" rel="noopener">IMDb ↗</a>`,
  ].filter(Boolean).join('');

  const shots = (show.screenshots || [])
    .map((src, i) => `<img src="${esc(src)}" loading="lazy" alt="" data-shot="${i}">`).join('');

  const section = (title, body) => `<div class="section"><h3>${title}</h3>${body}</div>`;

  return '<div class="detail"><div class="left">'
    + thumbHtml(show, '')
    + `<div style="margin-top:12px"><div class="detail-bars" style="grid-template-columns:1fr">`
    + barsHtml(show, edits) + '</div></div></div>'
    + '<div class="right">'
    + `<h2>${esc(show.title)}</h2>`
    + `<div class="sub">${esc(show.year)} · ${esc(show.type)}${statusPillHtml(show.status)}`
    + `<span><span class="rank-badge">#${effRank(show, edits)}</span> personal</span>${extHtml(show)}`
    + `<div class="links">${links}</div></div>`
    + (show.dropReason ? section('Dropped because', `<p class="droprsn">${esc(show.dropReason)}</p>`) : '')
    + section('Description', `<p>${esc(show.description)}</p>`)
    + (show.notes ? section('Notes', `<p class="notes">${esc(show.notes)}</p>`) : '')
    + (show.tags?.length
      ? section('Tags', `<div class="tags">${show.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>`)
      : '')
    + (shots ? section('Screenshots', `<div class="shots">${shots}</div>`) : '')
    + '</div></div>';
}

/* ---------- list root ---------- */

export const EMPTY_HTML = '<div class="empty">No shows match these filters.</div>';

/**
 * The whole `#listRoot` payload. `mode` is stamped onto the wrapper so the
 * client can recognise server-rendered markup and skip a pointless first
 * repaint (see app.js).
 */
export function listRootHtml(list, { edits = {}, sort = [], view = 'grid', custom = false } = {}) {
  if (!list.length) return `<div data-render="empty">${EMPTY_HTML}</div>`;
  const mode = custom ? 'custom' : view;
  const body = custom ? customTableHtml(list, edits)
    : view === 'grid' ? gridHtml(list, edits)
      : tableHtml(list, { edits, sort });
  return `<div data-render="${mode}">${body}</div>`;
}

export function countLabel(list, shows, custom = false) {
  return custom ? `${shows.length} shows` : `${list.length} of ${shows.length} shown`;
}
