# ROADMAP — Human Population History

Phases after the research phase. `CLAUDE.md` rules apply to every phase. Work one phase at a time; each phase ends with a written handoff so the next session (which starts with no memory) can pick up.

## How to run a phase

1. Read `CLAUDE.md`, this file, the previous phase's `research/notes/PHASEn_SUMMARY.md`, and `research/notes/LOG.md`.
2. Check the phase's **Prerequisites**. If they aren't met, finish them first or record why not.
3. Build in small commits. Tests and validation pass before moving on.
4. Do a **scientific review pass** before closing the phase: re-read every new claim, label, relationship and story text against the rules in `CLAUDE.md` (no deterministic language, every claim sourced, inferred things look inferred, disagreement represented).
5. Write `research/notes/PHASEn_SUMMARY.md`: what was built, what was deferred, known issues, open scientific questions, and what the next phase needs. Update the status table below.

Phases may be reordered if the summary of a previous phase gives a reason; record the reason here.

**Owner review points.** The owner reviews in particular: Phase 1 (population list, data model), Phase 3 (visual direction), and Phase 7 (story text). In each summary, list the specific items needing their judgment at the top. If unattended, continue on your best judgment and flag those items rather than stopping.

## Status

| Phase | Name | Status |
|---|---|---|
| 1 | Research & architecture | done 2026-10-08 (`research/notes/PHASE1_SUMMARY.md`) |
| 2 | Data pipeline & curated ontology | in progress |
| 3 | V0.1 — map + timeline | not started |
| 4 | Relationships & evidence | not started |
| 5 | Uncertainty & sampling-bias visual language | not started |
| 6 | Trace backward / forward | not started |
| 7 | Story mode | not started |
| 8 | Quality, accessibility, performance, deployment | not started |
| 9 | Later history & modern populations | not started |
| 10 | Deep time (~200,000 BCE) | not started |

---

## Phase 2 — Data pipeline & curated ontology

**Goal:** a reproducible path from raw AADR (and any complementary datasets chosen in Phase 1) to validated, curated data the app can load.

**Prerequisites:** Phase 1 summary; AADR obtained (or the blocker recorded in `BLOCKED.md`); `DATA_MODEL.md` agreed.

**Build:**
- `pipeline/aadr/`: download (versioned, checksummed) → parse → normalize to the `AncientIndividual` schema. Keep source labels, dates, and coordinates verbatim beside normalized fields.
- Deduplication of individuals/libraries, date-range normalization to the chosen year convention, coordinate precision flags.
- `data/curated/`: populations, relationships, evidence, sources as schema-validated JSON (or Parquet where large), each with provenance.
- Overrides file: every manual change to a date, coordinate, or label with source and reason.
- `pipeline/validation/`: schema checks; every relationship has evidence; every evidence row has a source; no population without member criteria; date ranges sane; coordinates on land (or flagged).
- Export step that produces the compact browser-ready files the app will load.

**Done when:** one command rebuilds all processed/curated data from raw; validation passes; a short data report (counts by period, region, and population; missing-data rates) is written to `research/notes/`.

## Phase 3 — V0.1: map + timeline

**Goal:** the first polished interactive experience, 50,000 BCE → 1500 CE.

**Prerequisites:** Phase 2 export files; read `DESIGN.md`.

**Build:**
- First, 2–3 visual directions in `docs/design/` per `DESIGN.md`; choose one and record why.
- Next.js app scaffold per `ARCHITECTURE.md`; MapLibre basemap from openly licensed data; deck.gl sample layer.
- Timeline: continuous scrubbing, BCE/CE labels, zoom into periods (likely a non-linear or zoomable scale, since 50,000 years of sparse data and 5,000 years of dense data shouldn't share one linear axis), play/pause, jump-to-period presets.
- Time filtering of samples using date *ranges* (a sample is shown with its uncertainty, not as a point in time).
- ~50 curated populations rendered as non-misleading markers (centroid/region/halo, decided in Phase 1), appearing and disappearing with time.
- Population detail panel: description, time range, category, confidence, member samples, source references.
- Basic relationships, confidence indicators.

**Done when:** a user can scrub time, see samples and populations change, click a population and see sourced information; works on desktop and phone width; smooth with the full sample set; screenshots at both widths saved to `docs/screenshots/` and checked against `DESIGN.md`; polish rounds continued until one finds nothing substantive (see `DESIGN.md` → Process). The same polish loop applies to Phases 4–7.

## Phase 4 — Relationships & evidence

**Goal:** make population relationships first-class and answer "Why is this connection shown?"

**Build:**
- Distinct visual semantics per relationship type (admixture, split, expansion, continuity, ancestry, migration); legend.
- Relationships animate in their time window.
- Admixture events as first-class objects (see `DESIGN.md`): event markers on map and timeline, ancestry-composition bars with uncertainty, competing models switchable, archaic admixture included.
- Evidence panel: claim (our words) → evidence → source with citation/DOI; multiple sources and disagreements shown side by side.
- A relationship-graph view (the population diagram from the handoff) linked to the map selection.

**Done when:** every visible relationship opens to its evidence; contested relationships visibly show the disagreement.

## Phase 5 — Uncertainty & sampling bias

**Goal:** the UI never implies more certainty or coverage than the data supports.

**Build:**
- Consistent visual language: solid = strong evidence, dashed = inferred, faint = proposed/weak; confidence badges on claims.
- Clear separation of observed sample locations, inferred population distributions, and inferred movements/ancestry.
- Sampling-density layer and "evidence sparse" warnings by region/period.
- Date uncertainty shown for samples (e.g. fade or range bars), not hidden.
- An "About the data" explainer: aDNA is not a census, why sampling is uneven, what labels mean.

**Done when:** a scientific reviewer could not mistake an inference for an observation anywhere in the UI.

## Phase 6 — Trace backward / forward

**Goal:** select a population and follow ancestry through time.

**Build:**
- Graph traversal over relationships (with time and confidence filters).
- Trace backward highlights contributing populations; trace forward highlights populations that received ancestry from or developed alongside it.
- Path explanation in careful language ("X-related ancestry contributed to Y", with proportions and confidence), each step linked to evidence.
- Low-confidence links included only when the user opts in, and visibly marked.

**Done when:** tracing never produces "X became Y" language and every highlighted link is sourced.

## Phase 7 — Story mode

**Goal:** guided narratives that turn the tool into a history book.

**Build:**
- A story format (data, not hard-coded UI): steps each with time, map view, highlighted populations/relationships/samples, original text, sources, and uncertainty notes.
- 3–5 initial stories chosen from Phase 1's major transitions (e.g. out of Africa & archaic admixture, Neolithic farming expansion, steppe-related expansion, peopling of the Americas, Austronesian expansion).
- Free exploration available from any step.

**Done when:** each story step cites sources, shows its uncertainty, and passes the scientific review pass.

## Phase 8 — Quality, accessibility, performance, deployment

**Build:** accessibility (keyboard navigation, colour-blind-safe palettes, screen-reader text for key states), performance budget for initial load, end-to-end tests of core flows, attribution page for all datasets/basemaps per their licences, static deployment.

**Done when:** a public deployment exists and meets every licence's attribution requirements.

## Phase 9 — Later history & modern populations

**Goal:** connect ancient populations to historical (to 1500 CE and beyond) and modern populations without false continuity.

**Prerequisites:** a research mini-phase like Phase 1 for historical/modern sources, written up before building.

**Build:** `historical_population` and `modern_population` categories in the data and UI, linked only by supported ancestry-contribution relationships; explicit messaging that modern ethnic/national identities are recent and can't be projected backward; extend the timeline to the present.

## Phase 10 — Deep time (~200,000 BCE →)

**Goal:** extend back to early *Homo sapiens* and archaic hominins.

**Prerequisites:** research mini-phase on sources for this period (very sparse aDNA; much evidence is from modern genomes, fossils, and archaeology), plus paleogeography (sea level, ice sheets).

**Build:** extend archaic populations (Neanderthal admixture is already in V1; here add earlier archaic and early *Homo sapiens* structure, as evidence supports) as their own categories; time-varying coastlines; timeline scale that handles 200,000 years honestly. Expect most of this era to be shown as low-confidence inference.
