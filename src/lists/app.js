/**
 * Watch-list client. All markup comes from render.mjs — the same module the
 * Eleventy build uses — so the server-rendered page and every client repaint
 * produce identical HTML. This file owns state, events and persistence only.
 */
import {
  RATING_KEYS, RATING_META, SHORT_TO_KEY, SORT_KEYS, SORT_LABEL,
  DEFAULT_RANGES, clamp, effRank,
  visibleShows, listRootHtml, detailHtml, countLabel,
} from './render.mjs';

const $ = (s, r = document) => r.querySelector(s);

const state = {
  raw: null,
  shows: [],
  byId: {},
  edits: {},                 // { id: { personalRank?, ratings?: {key:val} } }
  view: 'grid',
  sort: [],                  // [{ key, dir }]
  ranges: DEFAULT_RANGES(),
  custom: false,
};

const rank = s => effRank(s, state.edits);

/** True while nothing diverges from what the build pre-rendered. */
function isDefaultState() {
  return !state.custom && state.view === 'grid' && !state.sort.length
    && !Object.keys(state.edits).length
    && RATING_KEYS.every(k => state.ranges[k][0] === 0 && state.ranges[k][1] === 10);
}

/* ---------- edits ---------- */

function ensureEdit(id) { return state.edits[id] || (state.edits[id] = {}); }

function pruneEdit(id) {
  const e = state.edits[id];
  if (!e) return;
  const s = state.byId[id];
  if (e.personalRank === s.personalRank) delete e.personalRank;
  if (e.ratings) {
    for (const k of RATING_KEYS) if (e.ratings[k] === s.ratings[k]) delete e.ratings[k];
    if (!Object.keys(e.ratings).length) delete e.ratings;
  }
  if (!Object.keys(e).length) delete state.edits[id];
}

function changedRecords() {
  return state.shows.filter(s => state.edits[s.id]).map(s => {
    const e = state.edits[s.id];
    const rec = { id: s.id };
    if (e.personalRank != null) rec.personalRank = e.personalRank;
    if (e.ratings && Object.keys(e.ratings).length) rec.ratings = { ...e.ratings };
    return rec;
  });
}

/* ---------- URL state ---------- */

const b64encode = s => btoa(unescape(encodeURIComponent(s)));
const b64decode = s => decodeURIComponent(escape(atob(s)));

function serializeURL() {
  const p = new URLSearchParams();
  if (state.sort.length) p.set('sort', state.sort.map(s => `${s.key}:${s.dir}`).join(','));
  if (state.view !== 'grid') p.set('view', state.view);
  if (state.custom) p.set('custom', '1');
  for (const k of RATING_KEYS) {
    const [mn, mx] = state.ranges[k];
    if (mn !== 0 || mx !== 10) p.set(RATING_META[k].short, `${mn}-${mx}`);
  }
  const recs = changedRecords();
  if (recs.length) {
    const map = {};
    for (const r of recs) {
      map[r.id] = {};
      if (r.personalRank != null) map[r.id].personalRank = r.personalRank;
      if (r.ratings) map[r.id].ratings = r.ratings;
    }
    p.set('edits', b64encode(JSON.stringify(map)));
  }
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function parseURL() {
  const p = new URLSearchParams(location.search);
  if (p.get('sort')) {
    state.sort = p.get('sort').split(',').map(t => {
      const [key, dir] = t.split(':');
      return SORT_KEYS.includes(key) ? { key, dir: dir === 'desc' ? 'desc' : 'asc' } : null;
    }).filter(Boolean);
  }
  if (p.get('view') === 'table') state.view = 'table';
  if (p.get('custom') === '1') state.custom = true;
  for (const k of RATING_KEYS) {
    const raw = p.get(RATING_META[k].short);
    if (raw && /^\d+-\d+$/.test(raw)) {
      let [mn, mx] = raw.split('-').map(Number);
      mn = clamp(mn, 0, 10); mx = clamp(mx, 0, 10);
      if (mn > mx) [mn, mx] = [mx, mn];
      state.ranges[k] = [mn, mx];
    }
  }
  if (p.get('edits')) {
    try {
      const map = JSON.parse(b64decode(p.get('edits')));
      for (const [id, e] of Object.entries(map)) {
        if (!state.byId[id]) continue;
        const t = ensureEdit(id);
        if (Number.isInteger(e.personalRank)) t.personalRank = e.personalRank;
        if (e.ratings) {
          t.ratings = t.ratings || {};
          for (const k of RATING_KEYS) if (Number.isInteger(e.ratings[k])) t.ratings[k] = clamp(e.ratings[k], 0, 10);
        }
        pruneEdit(id);
      }
    } catch (err) { console.warn('bad edits param', err); }
  }
}

/* ---------- sort chips ---------- */

function cycleSort(key, additive) {
  const chain = state.sort;
  const idx = chain.findIndex(s => s.key === key);
  if (additive) {
    if (idx < 0) chain.push({ key, dir: 'asc' });
    else if (chain[idx].dir === 'asc') chain[idx].dir = 'desc';
    else chain.splice(idx, 1);
  } else if (chain.length === 1 && idx === 0) {
    if (chain[0].dir === 'asc') chain[0].dir = 'desc';
    else state.sort = [];
  } else {
    state.sort = [{ key, dir: 'asc' }];
  }
  update();
}

function renderSortChips() {
  const box = $('#sortchips');
  if (state.custom || !state.sort.length) { box.innerHTML = ''; return; }
  box.innerHTML = '<span class="lbl">Sort:</span>' + state.sort.map((s, i) => '<span class="chip">'
    + `<span class="ord">${state.sort.length > 1 ? i + 1 : ''}</span>`
    + `${SORT_LABEL[s.key]} ${s.dir === 'asc' ? '↑' : '↓'}`
    + `<button class="x" title="remove" data-remove-sort="${s.key}">✕</button></span>`).join('');
}

$('#sortchips').addEventListener('click', e => {
  const btn = e.target.closest('[data-remove-sort]');
  if (!btn) return;
  state.sort = state.sort.filter(s => s.key !== btn.dataset.removeSort);
  update();
});

/* ---------- drag reorder (custom mode) ---------- */

let dragId = null;

function clearDropMarks() {
  document.querySelectorAll('.drop-before,.drop-after')
    .forEach(n => n.classList.remove('drop-before', 'drop-after'));
}

function reorder(fromId, toId, after) {
  const order = [...state.shows].sort((a, b) => rank(a) - rank(b)).map(s => s.id);
  order.splice(order.indexOf(fromId), 1);
  let toIdx = order.indexOf(toId);
  if (after) toIdx += 1;
  order.splice(toIdx, 0, fromId);
  // dense rewrite 1..N
  order.forEach((id, i) => {
    const nextRank = i + 1;
    if (state.byId[id].personalRank === nextRank) {
      if (state.edits[id]) { delete state.edits[id].personalRank; pruneEdit(id); }
    } else {
      ensureEdit(id).personalRank = nextRank;
    }
  });
  update();
}

const listRoot = $('#listRoot');

listRoot.addEventListener('dragstart', e => {
  const tr = e.target.closest('tr.drag-row');
  if (!tr) return;
  dragId = tr.dataset.id;
  tr.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});
listRoot.addEventListener('dragend', e => {
  e.target.closest('tr.drag-row')?.classList.remove('dragging');
  clearDropMarks();
});
listRoot.addEventListener('dragover', e => {
  const tr = e.target.closest('tr.drag-row');
  if (!tr) return;
  e.preventDefault();
  if (tr.dataset.id === dragId) return;
  const rect = tr.getBoundingClientRect();
  clearDropMarks();
  tr.classList.add(e.clientY > rect.top + rect.height / 2 ? 'drop-after' : 'drop-before');
});
listRoot.addEventListener('drop', e => {
  const tr = e.target.closest('tr.drag-row');
  if (!tr) return;
  e.preventDefault();
  const targetId = tr.dataset.id;
  if (!dragId || dragId === targetId) return;
  const rect = tr.getBoundingClientRect();
  reorder(dragId, targetId, e.clientY > rect.top + rect.height / 2);
  clearDropMarks();
});

/* ---------- list interactions ---------- */

listRoot.addEventListener('click', e => {
  const th = e.target.closest('th[data-sort-key]');
  if (th) { cycleSort(th.dataset.sortKey, e.shiftKey); return; }
  if (state.custom) return; // rows are drag handles / inline editors there
  const item = e.target.closest('.card[data-id], tr[data-id]');
  if (item) openDetail(item.dataset.id);
});

listRoot.addEventListener('change', e => {
  const input = e.target.closest('input[data-rating]');
  if (!input) return;
  const id = input.closest('[data-id]').dataset.id;
  const k = input.dataset.rating;
  const v = clamp(Math.round(Number(input.value) || 0), 0, 10);
  input.value = String(v);
  const edit = ensureEdit(id);
  edit.ratings = edit.ratings || {};
  edit.ratings[k] = v;
  pruneEdit(id);
  update();
});

/* ---------- detail + lightbox ---------- */

let lbShots = [];
let lbIdx = 0;
let detailId = null;

function openDetail(id) {
  const show = state.byId[id];
  if (!show) return;
  detailId = id;
  $('#detailBody').innerHTML = detailHtml(show, state.edits);
  $('#detail').showModal();
}

$('#detailBody').addEventListener('click', e => {
  const img = e.target.closest('img[data-shot]');
  if (img) openLightbox(state.byId[detailId].screenshots, Number(img.dataset.shot));
});

function openLightbox(shots, idx) {
  lbShots = shots;
  lbIdx = idx;
  const lb = $('#lightbox');
  lb.innerHTML = '<button class="lb-nav prev" data-step="-1">‹</button>'
    + `<img src="${shots[idx]}" alt="">`
    + '<button class="lb-nav next" data-step="1">›</button>'
    + `<span class="lb-count">${idx + 1} / ${shots.length}</span>`;
  if (!lb.open) lb.showModal();
}

function stepLightbox(d) {
  lbIdx = (lbIdx + d + lbShots.length) % lbShots.length;
  openLightbox(lbShots, lbIdx);
}

$('#lightbox').addEventListener('click', e => {
  const nav = e.target.closest('[data-step]');
  if (nav) { stepLightbox(Number(nav.dataset.step)); return; }
  if (e.target.tagName === 'IMG') return;
  if (e.target.id === 'lightbox') $('#lightbox').close();
});

document.addEventListener('keydown', e => {
  if (!$('#lightbox').open) return;
  if (e.key === 'ArrowLeft') stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
});

$('#detailClose').addEventListener('click', () => $('#detail').close());

/* ---------- unsaved bar + export ---------- */

function updateUnsaved() {
  const recs = changedRecords();
  $('#unsaved').classList.toggle('show', recs.length > 0);
  $('#unsavedN').textContent = `${recs.length} unsaved change${recs.length === 1 ? '' : 's'}`;
}

function buildMergedDb() {
  const db = structuredClone(state.raw);
  for (const s of db.shows) {
    const e = state.edits[s.id];
    if (!e) continue;
    if (e.personalRank != null) s.personalRank = e.personalRank;
    if (e.ratings) for (const k of RATING_KEYS) if (e.ratings[k] != null) s.ratings[k] = e.ratings[k];
  }
  db.updated = new Date().toISOString().slice(0, 10);
  return JSON.stringify(db, null, 2) + '\n';
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 1600);
}

async function copyToClipboard(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    const ta = document.createElement('textarea');
    ta.style.cssText = 'position:fixed;opacity:0';
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(msg);
  }
}

function downloadBlob(text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = 'shows.json';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

$('#copyPatch').addEventListener('click', () => copyToClipboard(JSON.stringify(changedRecords(), null, 2), 'Patch copied'));

$('#downloadJson').addEventListener('click', async () => {
  const text = buildMergedDb();

  // Guard: never write empty/invalid content. If this trips, the bug is upstream.
  try { JSON.parse(text); } catch { toast('Aborted: generated JSON was invalid'); return; }
  if (!text || text.length < 2) { toast('Aborted: nothing to write'); return; }

  // Native "Save As" picker where supported (Chromium, secure context incl. localhost).
  // Some embedded/preview browsers implement the File System Access API incompletely
  // and write a blank file, so we verify the write by reading it back; on any failure
  // we fall back to a normal download so data is never lost.
  if (window.showSaveFilePicker) {
    let handle;
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: 'shows.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled the dialog
      console.error(err); // picker itself failed — fall through to download
    }
    if (handle) {
      try {
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        // Verify: read the file back and confirm it isn't blank/truncated.
        const written = await (await handle.getFile()).text();
        if (written.length === text.length) { toast('shows.json saved'); return; }
        console.warn(`Save verification failed: wrote ${text.length}, read back ${written.length}.`);
      } catch (err) {
        console.error('Save failed:', err);
      }
      // In-place save was unreliable — hand the user a good copy instead of leaving them stuck.
      downloadBlob(text);
      toast('Save picker misbehaved — downloaded a copy instead');
      return;
    }
  }
  downloadBlob(text);
  toast('shows.json downloaded');
});

$('#discardEdits').addEventListener('click', () => {
  if (confirm('Discard all unsaved changes?')) { state.edits = {}; update(); }
});

/* ---------- filter controls ---------- */

function buildRange(container, key) {
  const [mn, mx] = state.ranges[key];
  container.innerHTML = '<div class="track"><div class="rail"></div><div class="fill"></div>'
    + `<input type="range" min="0" max="10" step="1" value="${mn}" data-bound="lo">`
    + `<input type="range" min="0" max="10" step="1" value="${mx}" data-bound="hi"></div>`;

  const fill = container.querySelector('.fill');
  const lo = container.querySelector('[data-bound="lo"]');
  const hi = container.querySelector('[data-bound="hi"]');

  const paint = () => {
    let a = Number(lo.value);
    let b = Number(hi.value);
    if (a > b) {
      if (document.activeElement === lo) hi.value = lo.value; else lo.value = hi.value;
      a = Number(lo.value); b = Number(hi.value);
    }
    fill.style.left = (a / 10 * 100) + '%';
    fill.style.width = ((b - a) / 10 * 100) + '%';
    $('#' + RATING_META[key].short + 'Val').textContent = (a === 0 && b === 10) ? '' : `${a}–${b}`;
  };
  const commit = () => { state.ranges[key] = [Number(lo.value), Number(hi.value)]; update(); };

  lo.addEventListener('input', paint);
  hi.addEventListener('input', paint);
  lo.addEventListener('change', commit);
  hi.addEventListener('change', commit);
  paint();
}

function syncFilterInputs() {
  for (const k of RATING_KEYS) buildRange($(`.range[data-key="${k}"]`), k);
}

$('#resetFilters').addEventListener('click', () => {
  state.ranges = DEFAULT_RANGES();
  syncFilterInputs();
  update();
});

/* ---------- toolbar ---------- */

$('#viewSeg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  state.view = b.dataset.view;
  update();
});

$('#customBtn').addEventListener('click', () => { state.custom = !state.custom; update(); });

const addSortSel = $('#addSort');
addSortSel.insertAdjacentHTML('beforeend',
  SORT_KEYS.map(k => `<option value="${k}">${SORT_LABEL[k]}</option>`).join(''));
addSortSel.addEventListener('change', () => {
  if (!addSortSel.value) return;
  cycleSort(addSortSel.value, true);
  addSortSel.value = '';
});

/* ---------- main render ---------- */

function update(reserialize = true, { skipList = false } = {}) {
  [...$('#viewSeg').children].forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  $('#customBtn').classList.toggle('active', state.custom);
  $('#filters').classList.toggle('hidden', state.custom);
  $('#customHint').style.display = state.custom ? '' : 'none';
  $('#addSort').disabled = state.custom;
  renderSortChips();

  const list = visibleShows(state.shows, state);
  $('#count').textContent = countLabel(list, state.shows, state.custom);

  if (!skipList) listRoot.innerHTML = listRootHtml(list, state);

  updateUnsaved();
  if (reserialize) serializeURL();
}

/* ---------- boot ---------- */

async function boot() {
  let db;
  try {
    const res = await fetch('data/shows.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    db = await res.json();
  } catch (err) {
    listRoot.innerHTML = `<div class="empty">Couldn't load data/shows.json (${err.message}). `
      + 'Serve this folder over a static file server — e.g. <code>python3 -m http.server</code> — '
      + 'then open the printed URL.</div>';
    return;
  }

  state.raw = db;
  state.shows = db.shows;
  state.byId = Object.fromEntries(db.shows.map(s => [s.id, s]));
  parseURL();
  syncFilterInputs();

  // The build pre-renders the default grid. When nothing in the URL diverges
  // from it, keep that DOM instead of repainting identical markup.
  const prerendered = listRoot.firstElementChild?.dataset.render === 'grid';
  update(false, { skipList: prerendered && isDefaultState() });
}

boot();
