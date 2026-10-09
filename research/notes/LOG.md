# Working log

Decisions, open questions, and anything that could not be verified. Newest entries at the bottom.

## 2026-10-08: Repository initialised
- Added `CLAUDE.md`, then the owner's full brief (`CLAUDE.md` v2, `DESIGN.md`, `KICKOFF.md`, `ROADMAP.md`).

## 2026-10-08: Phase 1 decisions
- **AADR release:** v66.p1 (Dataverse v14.0, 2026-06-08, CC0). v66.0 and v62.0 are decommissioned by the maintainers (161 Papuan genomes released in error), so we must never use them. Planning lead (a) was partly outdated (see `research/sources/aadr.md`).
- **Lead (b)** (an open-source AADR explorer on Polars/DuckDB-WASM/deck.gl): not found. Not needed.
- **Year axis:** astronomical integer years (1 BCE = 0). BP converted as `1950 − BP`. See `research/chronology/date-conventions.md`.
- **Renderer:** d3-geo Equal Earth + Canvas 2D instead of MapLibre + deck.gl. Reasons are in ARCHITECTURE.md (equal-area honesty for density, no tile infrastructure, modest data volume). This changes a CLAUDE.md default, with the reason written down as required. **Owner may want to review.**
- **`packages/ui` deferred** until it has a second consumer.
- **Added categories:** `archaic_population` (Neandertals, Denisovans) and `geographic_population` (region-and-period groupings that are not genetic clusters). Added relationship type `shared_ancestry` (non-directional affinity).
- **Population membership** is rule-based (regex over verbatim AADR Group IDs, plus optional date window and bbox). Outlier, duplicate and flagged-problematic labels are excluded by default, and CRITICAL-quality individuals are excluded unless the population opts in (only Oase 1, the subject of its own paper).
- **Population display ranges:** 5th–95th percentile of member date ranges when there are ≥20 members, so a few broad contextual dates do not stretch a lifespan band (e.g. `England_IA` with "800 BCE – 600 CE").
- **Language claims are not displayed.** Several papers attach language-family interpretations (Indo-European, Celtic, Sino-Tibetan, Transeurasian, Austroasiatic, Tocharian). We judged these beyond what the genetic evidence shows directly, and contested. **Owner may want to review this framing decision.**

## 2026-10-08: AADR data issues found
- **136 individuals** have a `Full Date` text that contradicts `date_mean_bp` by more than max(100 years, 1 SD). Patterns: calibrated-BP ranges labelled "calBCE" (offset ≈ 1950 years), BCE/CE swaps, BCE midpoints entered as BP, 14C ages entered as calibrated means. Which field is wrong varies case by case. **Decision:** store the union of both readings (so the uncertainty shows as faintness), flag `full_date_inconsistent_with_mean_bp`, and fix only clear-cut typos through overrides with reasons (5 individuals, `ov-0001`…`ov-0010`). The list is reproducible from the processed parquet. **Possible action for the owner:** report the list to the AADR maintainers, who invite error reports.
- 1 open-ended date (`>43500 calBCE`) is stored as mean ± 2 SD.
- One group label carries `DontUseHighlyProblematic`. It is excluded by the default rule.
- The README's "unique individuals" counts are rows (data versions), not individuals.

## 2026-10-08: Literature
- 74 paper notes; DOI/PMCID/year/first author checked against Europe PMC (`scripts/check_paper_notes.py`). 62 verified from full text, 12 from abstract only (marked; their claims are capped at medium confidence).
- **Erratum found:** Gallego Llorente et al. 2015 (Mota). The headline claim of Eurasian ancestry in Yoruba and Mbuti was withdrawn in a 2016 erratum. Only the unaffected claim is used.
- Not yet read: critiques and re-dating of the White Sands footprints (Bennett 2021 is used at medium confidence, as archaeological context only).
- Papac 2021 fetched but not mined. Robbeets 2021 is deliberately not used (linguistic).

## Open questions
1. Indus Periphery individual IDs (Narasimhan 2019 supplementary table) are needed to complete `indus-periphery` membership.
2. CLV-cline individuals beyond Berezhnovka (Lazaridis 2025 supplement).
3. Iberian Beaker-associated individuals cannot be identified from AADR labels (relabelled `Spain_C`). We grouped by period instead.
4. Should modern borders be available as a reference layer from V0.1? DESIGN.md says "optional"; planned as off by default.

## 2026-10-08: Visual direction (owner feedback)
- The first V0.1 pass looked too academic to the owner, who pointed to the Invisible Cities and lens-lab explorables as the ambition. I prototyped a 3D space-time block ("Deep time"). The owner found it too much and asked for a **stylistic 2D map**, with the clean view kept as an option. The 3D prototype was removed (screenshot kept in `docs/design/direction-deep-time.png`).
- Next: stylised 2D treatments (engraved atlas with real shaded relief and watercolour washes; a dark "lantern" variant) plus a strata lens. The clean "atlas" theme remains selectable.
- Built: **Engraved** (default: paper, offshore water-lines, Natural Earth shaded relief, italic serif labels), **Lantern** (dark; samples glow) and **Clean** (the original). The owner then said the lens was only an example of interesting graphics, not a feature request. **No lens**; effort stays on the map style.
- Preview hosting: `scripts/build-single-page.mjs` bundles the same components (esbuild) into one HTML page plus `data/`, for hosts that serve plain files. "About the data" opens as an overlay there. URL state (query string) is not available on such hosts; the view still works.

## 2026-10-08: Encoding damage in AADR free text
- AADR v66.p1 `.anno` contains 23 U+FFFD replacement characters, all in free-text date notes: `NNNN�NN BP` (a radiocarbon age ± error) and once `2141�1962 cal BCE` (a range). The raw file and processed tables keep the text verbatim. The browser export (`pipeline/export/web.py`, `repair_text`) shows them as `±` and `–` respectively, only when digit-bounded. These notes are display text; no date, coordinate or label values change, so no override entry.

## 2026-10-08: Methodology page, archaic-ancestry preset, owner's next features
- Added `/methodology/`: the chain of evidence, how individuals, dates, places, populations, relationships and confidence are handled, the build checks, a per-continent coverage table (from `manifest.coverage`, via `pipeline/geo/continents.py`), a filterable register of every claim, and how to challenge one. "Report a problem" links (claims, populations, sample records) open a prefilled public GitHub issue form (`.github/ISSUE_TEMPLATE/claim-correction.yml`). The page promises that reports are checked and that unsupported claims are corrected, downgraded or removed. This is a commitment the owner should be comfortable keeping.
- Timeline preset `archaic-admixture` ("Neandertal and Denisovan ancestry") opens the panel of the inferred shared ancestors of non-Africans, where six published models sit side by side. The main Neandertal event has no location (its target is inferred, not sampled), so it shows in the panel and timeline, not as a line. Presets may now name a population to open (`select`).
- Relationship lines now start from the time-weighted centre of each population's members at the moment shown, falling back to the all-time centroid. The Neandertal all-time centroid lay in Central Asia because members span Croatia to the Altai.
- Owner priorities after launch: (1) "where a population's DNA comes from": mixtures and their effect on later and present-day populations (ROADMAP Phase 6, plus Phase 9 for present-day populations); (2) maybe an interactive chat assistant on a small model. Open points before building: chaining proportions across studies is not valid without caveats; present-day populations need their own curated, sourced entries (CLAUDE.md rule 8); a chat assistant needs a server-side key, i.e. the first backend.

## 2026-10-08: Blank hosted preview (fixed)
- Version 2 of the hosted preview showed a blank page: `lib/report.ts` reads `process.env.NEXT_PUBLIC_REPO_URL`, which Next inlines but the single-page esbuild bundle did not define, so the bundle threw `ReferenceError: process is not defined` before rendering. Version 1 had no such read. The preview was republished without re-running a check.
- Fixes: the bundle defines `process.env` as `{}` and the build refuses to emit a bundle that still references `process.*`; the page shows "Loading the map…" before scripts run and prints any startup error instead of going blank; the relief image is requested with CORS and a refused texture or shader only disables relief.
- New `scripts/check-single-page.mjs` runs the built page in a sandboxed iframe under a strict CSP and fails on any page error or if the map does not render. Run it before every publish.

## 2026-10-08: Caribbean ceramic people drawn in India (coordinate sign error, fixed)
- Reported by the owner from the live site. Five individuals (CDE001–CDE005, Cuba_Ceramic, Cueva de los Esqueletos 1, Camagüey) have longitude `77.844` in AADR v66.p1 instead of `-77.844`. The population label sat at the mean of 205 members, pulled toward India, and the five dots sat in central India.
- Fix at the source of the problem, per CLAUDE.md: overrides ov-0011…ov-0015 (field `lon`, with reason), a regression test for CDE001, and a general test that no site in an American country has a positive longitude (Guam and the Mariana Islands are recorded under `USA` with genuinely eastern longitudes and are excluded; Chukotka and Tonga near −170° are correct). A scan of all 17,173 individuals found no other sign errors of this kind. Worth reporting upstream to the AADR maintainers.
- Not checked: coordinate errors that do not flip a sign (e.g. a mistyped digit); a per-country plausibility check against borders would catch more of these.

## 2026-10-08: Population overviews, further reading, map smoothness

### Overviews (owner feedback: descriptions had no real information or reading)
- All 81 populations now have a sectioned `overview` (2–5 sections of 40–110 words, our own wording) and a "Further reading" list (the studies behind the page, with a free full-text link where one exists). Written by a delegated research subtask under `research/notes/overview-brief.md`; 295 new evidence statements (2 of 295 are abstract-only, 17 are rated low and 207 medium confidence, the rest high; ev-papac2021-st1…9 required a proper reading note, `research/papers/steppe-papac2021.md`). Validation: 0 errors; the new rule requires every section to cite evidence the population already lists.
- Full text could not be fetched (not open access), so these papers are used only through existing verified notes or abstract-level evidence: van de Loosdrecht 2018, Gallego Llorente 2015 (and its erratum), Patin 2017, Schlebusch 2017, Bennett 2021, Moreno-Mayar 2018a/b, Willerslev & Meltzer 2021, McColl 2018, Yang 2020.
- Four older one-line descriptions made language claims or overstated a link and were rewritten: taiwan-iron-age, caribbean-ceramic, vanuatu-post-lapita, western-african-related-farmers.
- **For owner review** (the drafting agent's `concerns`; full text in `research/notes/overview-drafts/*.json`): iberia-chalcolithic-steppe-related "earliest detection" vs Olalde 2019's dates; maikop evidence not Maikop-specific; solutrean-associated rests on one AADR individual; vestonice-cluster 11 matched vs 14 in Fu 2016 (split with the early founders is a modelling choice); hoabinhian rests on an abstract; yellow-river-farmers geography (upper/middle basin); mota omits the ~30% ghost ancestry; southern-african-foragers counts and sources are mixed; swahili-medieval individuals run to 1800 CE; natufians "about half" vs 44%/38.5%; anatolia-neolithic-farmers western Anatolia not in its evidence; se-europe-early-farmers heterogeneous; basal-eurasian ±10 error; first-americans-founders mixes models that disagree on dates; ancient-beringians "two infants" relies on an abstract; clovis-anzick is one individual typed as a cluster; caribbean-ceramic Arawak link holds in ADMIXTURE not f4; denisovans 4–6% is a first estimate; oase estimate varies by method; zlatykun-ranis kinship claim partly right; indus-periphery membership incomplete; aasi/asi/ani display windows; bismarck-related-source undated.
- The owner holds final review of historical claims. These overviews have been checked by the pipeline's rules, not yet by the owner.

### Map smoothness
- Measured with a CPU profile and frame timings in headless Chromium (software rendering, so absolute numbers are pessimistic): JavaScript was idle ~92% of the time; the cost was repainting the canvases on every pointer step. Dragging took ~400 ms (world) and ~1,800 ms (zoomed) per frame.
- Changes: during a drag or zoom the already-painted canvases are moved with a CSS transform (GPU-composited); they are repainted after 130 ms of no movement, or every ≥350 ms mid-gesture in a lighter form (no water rings, paper, rivers, glaciers; coarse coastline), with the interval scaled to the measured paint time. The land outline is projected once per frame instead of seven times; per-sample radial gradients became cached sprites; the timeline's "samples in view" strip recomputes only after the view settles.
- Result in the test: drag ≈ 17 ms per frame (world) and ≈ 52 ms (zoomed), from ≈ 400 and ≈ 1,800 ms. Full repaints on settle still take 0.2–0.9 s in the Clean style and 2.5–3.5 s in Lantern and Engraved in this software-rendered test (the WebGL terrain shading dominates there). On a real GPU these should be far faster, but this is **not yet measured on a real device**. `scripts/perf.mjs` and `scripts/profile.mjs` reproduce the measurements.

### Owner feedback not yet built
- The site informs but does not tell a story: needs Story mode (ROADMAP Phase 7). Task #11.

### 2026-10-08: GPU base map
- Owner: scroll-zoom still felt steppy. Researched how browser map apps stay smooth (geometry on the GPU, camera as a matrix, work off the main thread) and the known per-pixel inverse-projection technique for rasters. mapofus.us (suggested reference) is blocked in the sandbox; see BLOCKED.md.
- Built a WebGL base layer (`lib/gpuBase.ts`) with two baked textures (`geo/atlas.py`: coast distance field 730 KB, overlay 145 KB). Looks very close to the vector version in all three styles (screenshots at world, k=4, k=9, and across the date line, where no seam shows). The vector renderer remains as the fallback (verified with WebGL disabled).
- **Not measurable here:** this sandbox runs WebGL in software, so frame times in `scripts/perf.mjs` (Engraved drag ≈ 250 ms) say nothing about a real GPU; a full-screen shader with a handful of texture reads is trivial for one. Needs the owner's feel on a real device. If a weak GPU is slow, the first lever is a lower resolution while moving (already 60%).
- Known approximations: the coastline is quantised (8-bit distance field) so beyond k≈10 the vector renderer takes over; tiny islands can look blobby at the world view; rivers are 1-texel lines; water rings fade out when zoomed in far.

## 2026-10-08: "From bone to genome" page (live)
- Owner asked for an in-depth 3D demo of ancient DNA extraction and sequencing as a separate page, inspired by *Invisible Cities* (Migdał) and *Plane of Focus* (sael.net). Built `/extraction/`: ten procedural 3D stations on a bench with depth-of-field focus, tour, exploded views, text mode, no-WebGL fallback (see ARCHITECTURE.md).
- Text: 10 chapters by a research subtask from 16 newly read methods papers (`research/papers/methods-*.md`) plus the AADR paper; 106 evidence statements, all full text (35 high, 71 medium). Reviewed by the parent session: spot-checked figures against evidence; one figure reworded (Sawyer 2012's 10% observation had been presented as a "rule of thumb"). Validation 0 errors.
- **For owner review** (full list in `research/notes/extraction-draft.json`, `concerns`): Hansen 2017 gives the skull-vault figure as 2.2% (abstract) and 2.8% (results), shown as "about 2–3%"; several method papers used animal or archaic material, so their numbers are labelled "one study"; most protocol detail comes from two lab traditions (Leipzig; Harvard/Reich, which also maintains the AADR), so the page may read as those labs' protocol despite "a common approach" wording; dated figures (">70% of data from 1240k", ">10,000 individuals", two-thirds from Europe and Russia) come from 2022–2024 papers and will age; the sentence "the dots on this site's map come from the AADR's annotation file" is a fact about our pipeline, not a paper claim. Papers that could not be read are in BLOCKED.md.

## 2026-10-09: Prose rewrite and Akbari et al. 2026

### Prose rewrite (owner: "this text is poor"; Reich's book as the baseline register)
- Diagnosis, common to all 81 pages:
  - the description and "Who they were" repeat each other;
  - facts repeat across sections;
  - numbers and lineage codes are listed without meaning, and jargon is left unexplained;
  - display notes ("display window", "panel") sit inside the science.
- Style guide: `research/notes/writing-style.md`. It takes the register only, never text.
- Tools: `curation/prose_dossier.py` (everything a writer may draw on) and `curation/apply_prose.py` (checks, applies, archives).
- Benchmark: `non-african-ancestors`, rewritten by the parent session with every sentence checked against its evidence. Two details were cut because no evidence carries them: "buried" at Ust'-Ishim, and "hundreds of genomes".
- The other 80 populations are being drafted by nine regional writers. The first launch hit a usage limit with nothing saved; they were relaunched with save-after-each-population.
- A separate reviewer checks every sentence before anything is applied.
- Panel source lines now use short citations ("Green et al. 2010").

### Akbari et al. 2026 (owner: "could we integrate Akbari's paper?")
- **What the paper is.** Read in full (Nature 654:419–428, CC BY): a study of natural selection, not population history. It covers 15,836 ancient West Eurasians and finds 479 loci with strong evidence of directional selection in about the last 10,000 years.
- **Its new individuals are not on our map.**
  - The paper withholds the sites and context of its ~10,000 new individuals and says later papers should be the references for population history.
  - AADR v66.p1 credits it for 488 mapped individuals; all but one were first published elsewhere.
  - Added a line to Methodology → Coverage explaining this gap.
- **Integrated now (within the project's current scope):**
  - Sources `akbari2026` and `barrie2024` (both read in full).
  - Evidence `ev-akbari2026-2` and `ev-barrie2024-1`.
  - Disagreement `d-ms-risk-steppe` on the Yamnaya panel. Barrie 2024 traces the selected rise of HLA-DRB1*15:01, the main multiple sclerosis risk allele, to steppe pastoralists. Akbari 2026 finds the selection began south of the Caucasus in people without steppe ancestry, and that stronger later selection in northern Europe drove the north–south difference.
  - The steppe writer adds one or two sentences on this to the Yamnaya page.
- **Decision for the owner (not built):** a natural-selection feature. This would extend the project's framing from ancestry and movement to traits.
  - Candidate content: our own drawings of dated single-variant stories (celiac HLA-DQ2, blood group B, TYK2 and tuberculosis, HFE, CCR5-Δ32, the light-skin loci, CFTR's null result).
  - **Recommendation:** use single variants with clear biology and dates. Leave out, or show only with the paper's own caveats and the published critiques, the polygenic-score trends for behavioural traits (intelligence-test scores, income, schooling). The paper says these traits exist only in present-day societies and their signal overlaps with diabetes-related traits. Without that framing they invite misreading.
