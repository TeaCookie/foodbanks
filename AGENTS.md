# AGENTS.md — foodbanks

This file compiles high-signal, repo-specific guidance for future OpenCode sessions.
Every line below answers: "Would an agent likely miss this without help?"
If not, it is left out.

## Quick start

- The test-mock app is a static HTML page at `test-mock/index.html`.
  Open it in a browser; it loads MapLibre GL JS from unpkg and displays 3 BC food banks.
- The app uses ES modules (`<script type="module">`, `import` statements).
  Module boundaries are: `app.js` → `csv.js`, `data.js`, `map.js`.
- To regenerate the CSV data from the BC WFS service:
  ```
  python3 test-mock/build_food_banks_csv.py
  ```
  Requires internet access and Python 3.8+.
- Mock network fetch is simulated in `test-mock/js/data.js`; `networkHits` increments
  each time `mockNetworkFetch` is called (useful for testing cache behavior).
  The mock caches responses under `CACHE_NAME = "food-banks-static"` and returns
  a 600ms-delayed CSV with 3 records via `mockNetworkFetch`.

## Module import structure

- `app.js` imports from relative paths `./csv.js`, `./data.js`, `./map.js`.
- `csv.js` exports `parseCsv(text)` and `toGeoJSON(records)` — the parser handles
  quoted fields with embedded commas per RFC 4180.
- `map.js` exports `addLayers(geojson)`, `fitToData(geojson)` — initializes
  MapLibre GL Map, adds clustered point layers with popup rendering.
- `data.js` exports `loadCsv({ force })` and `networkHits` — mocks a network
  fetch with a 600ms timeout and caches the result under `CACHE_NAME`.

## What to verify before coding

- The git repo has **no commits yet** (`fatal: your current branch 'main' does not
  have any commits yet`). Do not rely on git history for entrypoints; read the
  source files directly.
- The PRD documents in `PRD/` contain the authoritative architecture decisions.
  Key constraints from those documents:
  - MapLibre GL JS is the chosen map library (not Leaflet, not Google Maps).
  - Frontend is framework‑less semantic HTML/CSS/JS; Vite may be used optionally.
  - Data backend is proposed as Supabase + PostgreSQL/PostGIS (not yet implemented).
  - Event publishing requires **human approval** before a candidate becomes confirmed.
  - Public events are limited to a rolling 30‑day window; past events are retained
    internally but not exposed publicly.
  - Ingestion uses a hybrid approach: deterministic source‑specific scripts plus
    a bounded LLM‑assisted discovery agent, all under a maintained allowlist.
  - Map tiles/style, geocoding, and hosting providers must be chosen and their
    terms/rate limits respected before waycoding.

## Commands you'll use most

| Goal | Command |
|---|---|
| Run the mock app | Open `test-mock/index.html` in a browser |
| Regenerate CSV from WFS | `python3 test-mock/build_food_banks_csv.py` |
| Understand CSV parsing | Read `test-mock/js/csv.js` — parseCsv handles quoted fields |
| Understand mock networking | Read `test-mock/js/data.js` — mockNetworkFetch + CACHE_NAME |
| Understand map layers | Read `test-mock/js/map.js` — addLayers, fitToData, clustering |

## Architecture notes (from PRD)

- **No framework dependency**: The public UI uses semantic HTML, CSS, and vanilla
  JS/TS with MapLibre directly. Do not assume React, Vue, or Svelte is available.
- **CSS layout**: Desktop sidebar/list + map; mobile bottom sheet/drawer. Patterns
  are in `test-mock/css/styles.css`.
- **Clustering**: MapLibre clustering is used (`cluster: true`, `clusterRadius: 45`).
  Markers cluster at higher zoom levels; individual popups show on click.
- **External directions**: The app does not build routing links; directions are
  handed off to Google Maps / Apple Maps externally (per PRD).
- **30‑day public window**: If/when event data is added, only events within the
  next 30 days should be visible publicly; past records stay internal.