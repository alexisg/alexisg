#!/usr/bin/env node
// Populate posters, screenshots, and external ratings in data/shows.json from TMDB.
//
// TMDB is the ONLY external API. Read the key from process.env.TMDB_API_KEY
// (works with both a v3 API key and a v4 read-access bearer token).
//
// The script FILLS MISSING FIELDS ONLY. It never overwrites personalRank,
// ratings, notes, or description. It downloads images to assets/ (skipping any
// file that already exists) so the app works offline, and it logs every show it
// couldn't resolve instead of failing the whole run.
//
// Usage (from the alexisg repo root):
//   TMDB_API_KEY=... node src/lists/scripts/fetch-metadata.mjs [--dry-run] [--force-search]
//
// Flags:
//   --dry-run       Resolve + report, but write no files and don't touch shows.json.
//   --force-search  Re-run /search/tv even for shows that already have a tmdbId
//                   (still won't overwrite anything else).

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_PATH = join(ROOT, "data", "shows.json");
const POSTER_DIR = join(ROOT, "assets", "posters");
const SCREENS_DIR = join(ROOT, "assets", "screens");

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w780"; // good quality, reasonable filesize
const BACKDROP_SIZE = "w1280";
const SCREENSHOT_COUNT = 4;

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has("--dry-run");
const FORCE_SEARCH = argv.has("--force-search");

const KEY = process.env.TMDB_API_KEY;
if (!KEY) {
  console.error("ERROR: TMDB_API_KEY is not set. Export it and re-run.");
  process.exit(1);
}
// v4 read-access tokens are long JWTs (two dots); v3 keys go in the query string.
const USE_BEARER = KEY.split(".").length === 3;

const unresolved = []; // { id, title, reason, candidates? }
const notes = []; // human-facing log lines

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdb(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!USE_BEARER) url.searchParams.set("api_key", KEY);
  const headers = { accept: "application/json" };
  if (USE_BEARER) headers.authorization = `Bearer ${KEY}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") || 1) * 1000;
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`TMDB ${res.status} on ${path}: ${body.slice(0, 200)}`);
    }
    return res.json();
  }
  throw new Error(`TMDB rate-limited repeatedly on ${path}`);
}

// Normalize a title for loose comparison: lowercase, strip punctuation/whitespace.
const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

function yearOf(dateStr) {
  const m = /^(\d{4})/.exec(dateStr || "");
  return m ? Number(m[1]) : null;
}

// Resolve a title to a single TMDB tv result, or return { ambiguous } / null.
async function resolveShow(show) {
  const data = await tmdb("/search/tv", {
    query: show.title,
    include_adult: "false",
  });
  const results = data.results || [];
  if (results.length === 0) return { match: null, reason: "no search results" };

  const target = norm(show.title);
  const exact = results.filter(
    (r) => norm(r.name) === target || norm(r.original_name) === target
  );

  // Prefer an exact title match; disambiguate multiple exacts by year.
  let pool = exact.length ? exact : results;
  if (show.year) {
    const sameYear = pool.filter((r) => yearOf(r.first_air_date) === show.year);
    if (sameYear.length === 1) return { match: sameYear[0] };
    if (sameYear.length > 1) pool = sameYear;
  }

  if (exact.length === 1) return { match: exact[0] };
  if (pool.length === 1) return { match: pool[0] };

  // Ambiguous: an exact match is missing and several plausible candidates remain,
  // OR the top result isn't an obvious title match. Don't guess — log for review.
  const top = pool[0];
  const topIsExact = norm(top.name) === target || norm(top.original_name) === target;
  if (topIsExact && exact.length <= 1) return { match: top };

  return {
    match: null,
    reason: "ambiguous — needs manual tmdbId",
    candidates: pool.slice(0, 5).map((r) => ({
      tmdbId: r.id,
      name: r.name,
      year: yearOf(r.first_air_date),
      overview: (r.overview || "").slice(0, 80),
    })),
  };
}

async function fileExists(p) {
  try {
    await access(p, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function download(imgPath, size, destAbs) {
  if (await fileExists(destAbs)) return { skipped: true };
  if (DRY_RUN) return { dryRun: true };
  const res = await fetch(`${IMG}/${size}${imgPath}`);
  if (!res.ok) throw new Error(`image ${res.status} for ${imgPath}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destAbs, buf);
  return { written: true };
}

async function main() {
  const raw = await readFile(DATA_PATH, "utf8");
  const db = JSON.parse(raw);

  if (!DRY_RUN) {
    await mkdir(POSTER_DIR, { recursive: true });
    await mkdir(SCREENS_DIR, { recursive: true });
  }

  let changed = false;

  for (const show of db.shows) {
    try {
      // 1. Resolve tmdbId (fill-missing, unless --force-search).
      if (show.tmdbId == null || FORCE_SEARCH) {
        const { match, reason, candidates } = await resolveShow(show);
        if (!match) {
          unresolved.push({ id: show.id, title: show.title, reason, candidates });
          console.warn(`  ! ${show.title}: ${reason}`);
          if (candidates) {
            for (const c of candidates) {
              console.warn(`      candidate ${c.tmdbId} — ${c.name} (${c.year})`);
            }
          }
          continue; // can't do anything else without an id
        }
        if (show.tmdbId == null) {
          show.tmdbId = match.id;
          changed = true;
        }
      }

      // 2. Details: externalRating + imdbId (fill-missing).
      const needRating = show.externalRating == null;
      const needImdb = show.imdbId == null;
      if (needRating || needImdb) {
        const details = await tmdb(`/tv/${show.tmdbId}`, {
          append_to_response: "external_ids",
        });
        if (needRating && typeof details.vote_average === "number") {
          show.externalRating = Math.round(details.vote_average * 10) / 10;
          show.externalSource = "tmdb";
          changed = true;
        }
        if (needImdb && details.external_ids?.imdb_id) {
          show.imdbId = details.external_ids.imdb_id;
          changed = true;
        }
      }

      // 3. Images: highest-voted poster + N backdrops (fill-missing, skip existing files).
      const needPoster = !show.poster;
      const needScreens = !Array.isArray(show.screenshots) || show.screenshots.length === 0;
      if (needPoster || needScreens) {
        const images = await tmdb(`/tv/${show.tmdbId}/images`, {
          include_image_language: "en,null",
        });

        if (needPoster) {
          const posters = [...(images.posters || [])].sort(
            (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
          );
          if (posters[0]) {
            const rel = `assets/posters/${show.id}.jpg`;
            const r = await download(posters[0].file_path, POSTER_SIZE, join(ROOT, rel));
            show.poster = rel;
            changed = true;
            if (r.written) notes.push(`  + poster ${show.id}`);
          } else {
            notes.push(`  ~ no poster art for ${show.title}`);
          }
        }

        if (needScreens) {
          const backdrops = [...(images.backdrops || [])].sort(
            (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
          );
          const picked = backdrops.slice(0, SCREENSHOT_COUNT);
          const paths = [];
          for (let i = 0; i < picked.length; i++) {
            const rel = `assets/screens/${show.id}-${i + 1}.jpg`;
            await download(picked[i].file_path, BACKDROP_SIZE, join(ROOT, rel));
            paths.push(rel);
          }
          if (paths.length) {
            show.screenshots = paths;
            changed = true;
            notes.push(`  + ${paths.length} screenshot(s) ${show.id}`);
          } else {
            notes.push(`  ~ no backdrop art for ${show.title}`);
          }
        }
      }

      console.log(`  ✓ ${show.title}`);
      await sleep(120); // be polite to the API
    } catch (err) {
      // Never fail the whole run for one show.
      unresolved.push({ id: show.id, title: show.title, reason: String(err.message || err) });
      console.warn(`  ! ${show.title}: ${err.message || err}`);
    }
  }

  if (notes.length) {
    console.log("\nImage log:");
    for (const n of notes) console.log(n);
  }

  if (changed && !DRY_RUN) {
    db.updated = new Date().toISOString().slice(0, 10);
    await writeFile(DATA_PATH, JSON.stringify(db, null, 2) + "\n", "utf8");
    console.log(`\nUpdated ${DATA_PATH}`);
  } else if (DRY_RUN) {
    console.log("\n(dry run — no files written)");
  } else {
    console.log("\nNo missing fields to fill; shows.json unchanged.");
  }

  if (unresolved.length) {
    console.log(`\n${unresolved.length} show(s) need attention:`);
    for (const u of unresolved) {
      console.log(`  - ${u.title} (${u.id}): ${u.reason}`);
      if (u.candidates) {
        for (const c of u.candidates) {
          console.log(`      set "tmdbId": ${c.tmdbId}  // ${c.name} (${c.year})`);
        }
      }
    }
    console.log(
      "\nTo fix an ambiguous match, paste the right tmdbId into that show in data/shows.json and re-run."
    );
  } else {
    console.log("\nAll shows resolved.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
