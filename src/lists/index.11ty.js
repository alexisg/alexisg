/**
 * Pre-renders /lists at build time.
 *
 * The page is a static shell (index.html) plus markup produced by render.mjs —
 * the same module the browser runs — so crawlers get the full list instead of
 * an empty `#listRoot`, and the client can skip the first repaint.
 */
const fs = require('node:fs');
const path = require('node:path');

const SHELL = path.join(__dirname, 'index.html');
const DATA = path.join(__dirname, 'data', 'shows.json');

/** Replaces an HTML comment marker, failing loudly if the shell no longer has it. */
function fill(html, marker, value) {
  const token = `<!-- ${marker} -->`;
  if (!html.includes(token)) {
    throw new Error(`src/lists/index.html is missing the "${token}" marker`);
  }
  return html.replace(token, value);
}

function jsonLd(shows) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Watch List',
    numberOfItems: shows.length,
    itemListElement: shows.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'TVSeries',
        name: s.title,
        datePublished: String(s.year),
        description: s.description || s.notes,
        genre: s.tags?.length ? s.tags : undefined,
        url: s.tmdbId ? `https://www.themoviedb.org/tv/${s.tmdbId}` : undefined,
        sameAs: s.imdbId ? `https://www.imdb.com/title/${s.imdbId}` : undefined,
      },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

module.exports = class {
  data() {
    return { permalink: '/lists/index.html' };
  }

  async render() {
    const [render, { assertValidDb }] = await Promise.all([
      import('./render.mjs'),
      import('./validate.mjs'),
    ]);

    const db = assertValidDb(JSON.parse(fs.readFileSync(DATA, 'utf8')));
    const shows = db.shows;

    // Mirror the client's default state: grid view, no filters, no sort.
    const list = render.visibleShows(shows);

    return fill(
      fill(
        fill(fs.readFileSync(SHELL, 'utf8'), 'ssr:list', render.listRootHtml(list, { view: 'grid' })),
        'ssr:count', render.countLabel(list, shows),
      ),
      'ssr:head', jsonLd(shows),
    );
  }
};
