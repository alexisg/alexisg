/**
 * Validation for data/shows.json. Runs at build time so a malformed record
 * fails `eleventy` loudly instead of producing a half-empty page.
 */

const STATUSES = new Set(['watched', 'watching', 'queued', 'dropped']);
const RATING_KEYS = ['sexualContent', 'violence', 'humor'];

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function validateDb(db) {
  const errors = [];
  if (!db || !Array.isArray(db.shows)) return ['shows.json: missing top-level "shows" array'];

  const seen = new Set();
  db.shows.forEach((s, i) => {
    const at = `shows[${i}]${s?.id ? ` (${s.id})` : ''}`;
    if (!s?.id) errors.push(`${at}: missing id`);
    else if (seen.has(s.id)) errors.push(`${at}: duplicate id`);
    else seen.add(s.id);

    if (!s?.title) errors.push(`${at}: missing title`);
    if (!isInt(s?.year, 1900, 2100)) errors.push(`${at}: year must be an integer year`);
    if (!STATUSES.has(s?.status)) errors.push(`${at}: status must be one of ${[...STATUSES].join(', ')}`);
    if (!isInt(s?.personalRank, 1, 9999)) errors.push(`${at}: personalRank must be a positive integer`);
    if (s?.externalRating != null && typeof s.externalRating !== 'number') {
      errors.push(`${at}: externalRating must be a number or null`);
    }
    for (const k of RATING_KEYS) {
      if (!isInt(s?.ratings?.[k], 0, 10)) errors.push(`${at}: ratings.${k} must be an integer 0–10`);
    }
  });

  return errors;
}

export function assertValidDb(db) {
  const errors = validateDb(db);
  if (errors.length) {
    throw new Error(`Invalid src/lists/data/shows.json:\n  - ${errors.join('\n  - ')}`);
  }
  return db;
}
