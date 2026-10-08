# Kickoff — Phase 1: Research & Architecture

Read `CLAUDE.md` first; its rules apply throughout.

**Do not build the main visualization in this phase.** Research first, then design, then (if nothing blocks) begin implementation.

## Tasks

**Geographic focus for V1:** heaviest on Eurasia and Africa, with a smaller but coherent representation of the Americas and Oceania.

**Unverified leads from an earlier planning conversation** — check them, don't rely on them: (a) AADR v66.0, released around April 2026, with roughly 17,600 ancient individuals; (b) an existing open-source AADR explorer reportedly built with Python/Polars → Parquet → DuckDB-WASM → Next.js/deck.gl/MapLibre, which may be a useful reference or starting point (check its licence before reusing anything).

1. **AADR.** Find the latest Allen Ancient DNA Resource release (don't assume an old version). Document: where it is hosted, version/date, file formats (e.g. `.anno` metadata, genotype files), every metadata column relevant to us, row counts, and known quirks (duplicate individuals, date formats, group-label conventions, coordinate precision, missing values).
2. **Terms of use.** Determine licence/usage terms for AADR and every other dataset and basemap you propose. Note attribution requirements and anything that restricts redistribution of derived data in a public website.
3. **Complementary datasets.** Identify ancient-DNA and archaeological datasets that fill AADR's gaps (e.g. radiocarbon databases, regional aDNA compilations, haplogroup resources). For each: what it adds, licence, format.
4. **Geographic data.** Identify basemaps, coastline/boundary data, and paleo-geography (e.g. sea-level/ice-sheet reconstructions for the Pleistocene) usable under open licences.
5. **Prior art.** Find existing open-source ancient-DNA visualization projects; note what to learn from and what to avoid.
6. **Population definitions.** Investigate how major aDNA studies define and name groups (AADR group-label conventions, qpAdm/admixture-graph-based clusters, culture-based labels). Explain how individuals should map to our curated populations.
7. **Major transitions for V1.** Identify the population transitions to represent (e.g. out-of-Africa dispersals and archaic admixture, early Holocene hunter-gatherer structure, Neolithic farming expansions, steppe-related expansion, peopling of the Americas, Austronesian expansion, Bantu-related expansion, etc. — confirm and refine from the literature). For each: key primary papers, what is well established, what is debated, what evidence is too weak to visualize.
8. **Admixture events.** For each major transition, catalogue the published mixing events: target, sources/proxies, proportions with uncertainty, date estimates of the admixture itself and how they were obtained, sex-biased admixture where reported, and competing models. Include archaic admixture (Neanderthal, Denisovan) since it falls in the V1 date range. Note where proportions depend strongly on the choice of proxy populations.
9. **Data model.** Propose a concrete schema (TypeScript types + JSON Schema, and the Parquet/processed layout) refined against real AADR columns. Include date convention, uncertainty representation, provenance chain, and how disagreement between sources is stored.
10. **Architecture.** Propose the application architecture and data flow from raw files to browser, including how much data the browser loads and how time filtering stays fast.
11. **Initial population set.** Propose ~50–100 curated populations with: name, category, approx. time range, region, defining samples/labels, key sources, confidence.
12. **Problems with that list.** Naming inconsistencies, overlapping definitions, culture-vs-genetics conflation, regions/periods with too few samples, contested claims.

Primary literature first. Researchers to start from include Reich, Krause, Lazaridis, Willerslev, Patterson, Anthony, Kristiansen, and whoever the literature points to. Verify every claim against the actual paper.

## Deliverables

```
research/
├── sources/      one note per dataset/source
├── populations/  one note per proposed population (or grouped by transition)
├── chronology/   date conventions, calibration notes, period definitions
├── papers/       one note per key paper: claims we rely on, our paraphrase, page/figure refs
└── notes/        LOG.md (decisions, open questions), BLOCKED.md if needed
RESEARCH.md       synthesis: transitions, consensus vs debate, what not to visualize
DATA_MODEL.md
ARCHITECTURE.md
SOURCES.md        every source with citation, version, licence
POPULATIONS.md    the proposed set as a table + caveats, plus the admixture-event catalogue
```

Also: a reproducible AADR download/inspection script under `pipeline/aadr/` (with checksum), and a short inspection report of the real file if you can obtain it.

## End-of-phase summary

Finish the phase by writing `research/notes/PHASE1_SUMMARY.md` covering:

- recommended architecture
- recommended data model
- recommended initial population set
- recommended technology stack
- major scientific risks
- major data-quality risks
- licensing/data-use risks
- implementation plan for V0.1

## Then

If no major unresolved issue blocks you (e.g. a licence that forbids the intended use, or AADR being unobtainable), proceed to **V0.1**:

A polished interactive map + timeline, 50,000 BCE → 1500 CE, with AADR sample points, time filtering, ~50 curated populations, a population detail panel with source references, basic relationships with distinct visual semantics, and confidence indicators. Follow the build order: ingestion pipeline → normalized individuals → curated ontology → map → timeline → linked map/timeline → relationships → evidence panel.

If something does block you, stop after the summary and state clearly in `PHASE1_SUMMARY.md` what decision is needed.

V0.1 corresponds to Phases 2–3 in `ROADMAP.md`; follow the per-phase steps there (prerequisites, scientific review pass, summary). Update the roadmap's status table as you go. Later phases are also described in `ROADMAP.md`.
