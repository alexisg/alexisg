# /lists — watch-list app

A self-contained anime/animation watch list, served as a standalone page at
**/lists** on the site. Vanilla HTML/CSS/JS — no build step, no framework, no
runtime dependencies. Eleventy copies this folder verbatim (passthrough), so its
relative `data/` and `assets/` paths resolve under `/lists/`.

## Develop

Use the site's own Eleventy dev server — no separate tooling needed:

```bash
yarn dev
```

Then open <http://localhost:8080/lists/>. Eleventy watches this folder and live-
reloads on save (including `index.html`, `data/shows.json`, and assets).

## Files

```
index.html            The whole app (HTML + inline CSS + ES-module JS)
data/shows.json       Source of truth for the list
assets/posters/       One poster per show
assets/screens/       Up to four screenshots per show
scripts/fetch-metadata.mjs  Populate metadata + images from TMDB (zero-dep)
```

## Refresh metadata

TMDB is the only external API. The script fills **missing fields only** (never
overwrites `personalRank`, `ratings`, `notes`, or `description`) and downloads
images into `assets/`, skipping files that already exist.

```bash
TMDB_API_KEY=your_key node src/lists/scripts/fetch-metadata.mjs [--dry-run]
```

## Editing the list in-app

`data/shows.json` is the source of truth; the UI reads it and can export an
updated copy but never mutates it. Use custom-sort mode to drag-reorder
(`personalRank` stays dense from 1) and edit ratings inline, then **Download
shows.json** (save over `src/lists/data/shows.json`) or **Copy JSON patch**.
