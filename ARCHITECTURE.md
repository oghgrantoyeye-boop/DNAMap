# ARCHITECTURE

## Summary
A static website (no backend) built from a reproducible Python pipeline:

```
AADR .anno (CC0, pinned + md5) ─┐
Natural Earth (public domain) ──┼─> pipeline/ (Python, Polars) ──> data/processed/*.parquet (gitignored)
research/papers/*.md ───────────┤                               └> data/curated/*.json (+ schemas, validation)
data/curated/*.json (hand) ─────┘                                        │
                                                         export step     ▼
                                              apps/web/public/data/*.json  (compact, committed)
                                                                         │
                                         Next.js static export (React, TS, d3, Canvas 2D)
```

One command rebuilds everything from raw: `pnpm data` (runs `uv run python -m build` in `pipeline/`).

## Repository layout
As CLAUDE.md specifies, with two recorded changes:

```
apps/web/                 Next.js (App Router, `output: "export"`), React, TypeScript
packages/data-model/      shared TS types, time/date utilities, JSON-schema-derived validators
packages/visualization/   projection + canvas renderers (basemap, samples, fields, relationships), timeline scale
data/{raw,processed,curated,schemas}/
pipeline/{aadr,curation,populations,validation,export}/   Python 3.11+, Polars, uv
research/{papers,populations,chronology,sources,notes}/
scripts/                  fetch_paper.py, check_paper_notes.py, fetch_basemap.py, screenshots
tests/                    cross-cutting e2e (Playwright); unit tests live next to code
```

**Change 1, `packages/ui/` deferred.** UI components live in `apps/web/components/` until a second consumer exists (e.g. a separate story-authoring tool). Creating an empty package now would be premature structure. Revisit in Phase 7.

**Change 2, `pipeline/curation/` and `pipeline/export/` added** next to `aadr/`, `populations/` and `validation/`. Curation parses the research notes into sources; export writes the browser files.

## Map rendering: d3-geo + Canvas 2D instead of MapLibre GL + deck.gl

CLAUDE.md's default is MapLibre + deck.gl. We propose a different renderer, for these reasons:

1. **Honest projection.** MapLibre supports only Web Mercator and a globe. Mercator inflates areas at the latitudes where most aDNA samples lie, e.g. ×2.4 at 50°N vs the equator, and shrinks Africa relative to Europe. That misleads exactly where this site makes claims about sampling density and population extent. A globe hides half the world at once. DESIGN.md asks for a projection that does not badly distort the regions most data sits in. We use **Equal Earth** (equal-area, d3-geo built-in), rotated so the view's centre longitude is always the central meridian, so the region being looked at has the least shape distortion. Density fields and halos are then area-honest.
2. **No tile infrastructure needed.** The basemap is a handful of static Natural Earth layers (land, lakes, rivers, glaciers): ~300 KB as TopoJSON at 1:110m + 1:50m. There are no labels-heavy vector tiles to serve, and no tile server, API key or third-party style.
3. **Modest data volume.** ~17,000 points and ~60 populations. Canvas 2D handles this at interactive rates when points are batched per opacity bucket. deck.gl's strengths (millions of points, 3D) are not needed, and it only supports Web Mercator, globe or planar views, so an equal-area projection would require pre-projected planar coordinates and would lose rotation.
4. **Full control of visual semantics.** Distinct relationship styles, soft population fields, dashed and faint inferred elements, and label collision handling are all simple in one canvas pipeline.

Costs, accepted: we implement pan/zoom/rotate ourselves (d3-zoom for gestures) and label placement ourselves. If performance fails on phones, the fallback is WebGL point rendering (regl) under the same projection. The decision would be revisited if V1 grows past ~200k points.

Details:
- **Projection:** `geoEqualEarth().rotate([-λ0, 0])`. Horizontal drag changes λ0 (the world wraps continuously, so the Pacific is never cut). Vertical drag translates, and zoom scales. Phase 10 may blend towards an azimuthal equal-area projection at high zoom for less shape distortion.
- **Layers** (bottom → top): ocean background; land (110m below zoom 3, 50m above), lakes, rivers, glaciers (present-day, stated in About); optional modern borders (off by default); population fields (soft kernels from member sites, weighted by temporal overlap); relationship marks; sample points; labels; selection highlight.
- **Canvases:** a basemap canvas (redrawn on view change only) and a data canvas (redrawn on view, time or selection change), both with devicePixelRatio scaling. Hit-testing uses a spatial grid in screen space, rebuilt per frame for visible samples.

## Timeline
SVG via React plus d3-scale. A custom **segmented linear scale** (`packages/visualization/src/timeScale.ts`) with visible breaks (see `research/chronology/periods.md`), a brush-to-zoom linear mode, a sample-density strip (counts per screen bin for the current map extent, weighted by each sample's date range), population lifespan bands, admixture-date bands drawn differently from sample dates, period presets, and play/pause.

## Time filtering
The app holds sample dates as `Float64Array`s (`start`, `end`). For the current time `t` and a resolution window `w` (≈1.5% of the visible timeline span, so it adapts to zoom), each sample gets a weight:

```
weight = overlap([start, end], [t − w, t + w]) / min(end − start + 1, 2w)   ∈ [0,1]
```

Weight drives opacity. A sample whose 95% range sits entirely in the window is opaque. One with a broad contextual range (e.g. ±500 years) is faint at any single moment. This is how date uncertainty is shown rather than hidden. Weights are computed in one loop over ~17k samples per frame (<1 ms). Population fields use the same weights.

## Data the browser loads
| file | content | size (est.) | when |
|---|---|---|---|
| `data/manifest.json` | versions, hashes, counts | <2 KB | first |
| `data/basemap-110m.json` | TopoJSON land/lakes/rivers | ~150 KB gz | first |
| `data/samples.json` | columnar core fields, ~17k rows | ~400 KB gz | first |
| `data/ontology.json` | populations (+ member site summaries), relationships, admixture events, evidence, sources, disagreements, periods | ~150 KB gz | first |
| `data/basemap-50m.json` | finer land/rivers | ~600 KB gz | lazily, on zoom |
| `data/samples-detail/NN.json` | full sample records, 64 shards | ~30 KB gz each | on click |

The initial payload is about 0.7 MB gzipped plus JS. DuckDB-WASM is **not** used. The data fits in typed arrays, and DuckDB-WASM would add ~5 MB of WASM for no V1 benefit. Revisit only if users need ad-hoc querying over genotype-level data.

## State and interaction
- A single app store (React `useSyncExternalStore` over a small hand-written store; no state library until one is needed): `time`, `timelineDomain`, `view {λ0, y, k}`, `selection {kind, id}`, `filters`, `mode (explore|story)`, `layers`.
- URL state: time, view, selection and story step are mirrored in the query string, so any view is linkable and the browser back button works.
- Story mode (Phase 7) is a sequence of store states plus text, so a story never needs special rendering code.

## Python pipeline
- `aadr/`: download (pinned, md5) → parse (`columns.py`, `dates.py`) → normalize (`normalize.py`: representative row, coordinates precision, date ranges, overrides) → `data/processed/*.parquet`.
- `curation/`: research notes → `sources.json`; loading and checking hand-curated JSON.
- `populations/`: apply membership rules to individuals; compute member summaries, footprints, sparse flags; report per-population matches for review (`research/notes/membership-report.md`).
- `validation/`: JSON Schema + integrity + wording lint + statistical checks (DATA_MODEL.md §9). The build fails on any error.
- `export/`: compact browser files + manifest.
- Tests: pytest (`pipeline/tests/`), including regression tests for every data error traced from the UI (CLAUDE.md).

## Stack and dependencies (all permissive licences)
| layer | choice | licence |
|---|---|---|
| web framework | Next.js 15 (static export), React 19, TypeScript 5 | MIT / MIT / Apache-2.0 |
| geo | d3-geo, d3-zoom, d3-scale, d3-array, topojson-client | ISC / ISC / ISC / ISC / ISC |
| fonts | Source Serif 4 (narrative), Inter (UI) via @fontsource (self-hosted, no Google requests at runtime) | OFL-1.1 |
| tests | Vitest, Playwright | MIT / Apache-2.0 |
| pipeline | Python 3.13, Polars, PyArrow, jsonschema, pytest; uv | MIT / Apache-2.0 / MIT / MIT; MIT/Apache |

## Deployment
Static files (`next build` → `out/`) on any static host (Phase 8). There are no runtime third-party calls: fonts and data are self-hosted, which also keeps visitors' requests private.

## Performance budget (V0.1 target)
- First meaningful map render < 2.5 s on a mid-range phone over 4G.
- Scrubbing time ≥ 45 fps on desktop and ≥ 30 fps on a mid-range phone, with all samples loaded.
- Click → sample card < 150 ms (shard fetch cached afterwards).


## Map rendering (updated 2026-10-08)

Canvas 2D repainting the base map on every pointer step was the cause of the lag the owner reported (profiling showed JavaScript idle; the cost was rasterising the 50 m coastline with wide strokes). The base map is now drawn by one full-screen WebGL fragment shader (`apps/web/lib/gpuBase.ts`) that inverts the Equal Earth projection per pixel and samples three pre-made world pictures: a signed distance field to the coast and an overlay of lakes, glaciers and rivers (both baked by `pipeline/geo/atlas.py` from Natural Earth 1:50m), and the shaded relief (`pipeline/geo/relief.py`). Themes are uniforms; water rings, coastline and paper grain are computed in the shader. Samples, population fields, relationship lines and labels stay on a Canvas 2D overlay (cheap at these counts).

- Used up to view.k = 10 (`GPU_MAX_K`); above that, or without WebGL or high-precision fragment floats, the vector renderer (`mapRender.drawBasemap`) draws instead, with its own gesture handling (CSS-transform of the painted canvases, repaint on settle).
- Equal Earth is area-preserving, so distance in pixels from the distance field is exact on average (geometric mean of the local scales equals the projection scale); it is not isotropic near the poles.
- Reason for not using MapLibre or deck.gl (the stack defaults): neither supports Equal Earth, and an area-preserving projection is part of the design (dot density must not be exaggerated toward the poles).

## "From bone to genome" page (added 2026-10-08)

`/extraction/` explains how ancient DNA is obtained and read. It is a separate route so three.js (about 150 KB compressed) loads only there, through a dynamic import in `components/extraction/Extraction.tsx`.

- Scene (`components/extraction/scene.ts`): ten procedural dioramas on plinths along a bench, built in code (no model files). The camera travels between stations; a depth-of-field pass focuses on the current one. Each station animates only while it or a neighbour is in view. Exploded views exist where taking the model apart explains something (inside the bone, lifting the clean-room glass, DNA breaking into fragments, library parts). Two palettes follow the map's light and dark styles.
- Words (`data/curated/extraction.json`, schema `data/schemas/extraction.schema.json`): each chapter has a title, summary, text, figures and an optional caveat, every one tied to evidence ids; validation enforces that the evidence exists and runs the wording checks. The export writes `public/data/extraction.json` with only the evidence and sources the chapters cite.
- Inspirations: the navigable diorama with chapters attached to places (Piotr Migdał, *Invisible Cities*) and the single explorable model with an exploded view, live readout and section-by-section pairing (*Plane of Focus*, sael.net). No code or assets from either.
- Accessibility: keyboard steps (arrows, digits, T, X, H), a "Read as text" mode with every chapter, reduced motion respected (no camera flights, slower animation), and a text-only fallback without WebGL.
