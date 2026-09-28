# /lists — watch-list app

A self-contained anime/animation watch list, served at **/lists** on the site.
Vanilla HTML/CSS/JS — no framework, no runtime dependencies.

The page is **pre-rendered at build time**: `index.11ty.js` runs the same
renderer the browser uses (`render.mjs`) and bakes the default grid into
`index.html`, so crawlers and AI readers get the whole list as real markup
instead of an empty container. `app.js` then takes over for filtering,
sorting, custom ordering and the detail dialog. When the URL carries no state,
the client keeps the server's DOM instead of repainting it.

## Develop

```bash
yarn dev
```

Then open <http://localhost:8080/lists/>. Eleventy watches this folder and
live-reloads on save (`index.html`, `render.mjs`, `data/shows.json`, assets).

## Files

```
index.html          Static shell with <!-- ssr:* --> markers
index.11ty.js       Build-time pre-render (fills the markers, emits JSON-LD)
render.mjs          Shared DOM-free renderer — used by BOTH the build and the browser
app.js              Client: state, URL sync, events, export
app.css             Styles
validate.mjs        shows.json schema check; a bad record fails the build
data/shows.json     Source of truth for the list
assets/posters/     One poster per show
assets/screens/     Up to four screenshots per show
scripts/fetch-metadata.mjs  Populate metadata + images from TMDB (zero-dep)
```

Markup lives in `render.mjs` only. Adding a field to a card means editing one
function, and the server and client stay in sync by construction.

## Refresh metadata

TMDB is the only external API. The script fills **missing fields only** (never
overwrites `personalRank`, `ratings`, `notes`, or `description`) and downloads
images into `assets/`, skipping files that already exist.

```bash
TMDB_API_KEY=your_key yarn lists:refresh          # or: ... node src/lists/scripts/fetch-metadata.mjs
TMDB_API_KEY=your_key yarn lists:refresh --dry-run
```

## Editing the list in-app

`data/shows.json` is the source of truth; the UI reads it and can export an
updated copy but never mutates it. Use custom-sort mode to drag-reorder
(`personalRank` stays dense from 1) and edit ratings inline, then **Download
shows.json** (save over `src/lists/data/shows.json`) or **Copy JSON patch**.
