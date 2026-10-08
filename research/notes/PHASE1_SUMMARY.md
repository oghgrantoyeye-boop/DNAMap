# Phase 1 summary: research and architecture

Date: 2026-10-08. Status: **complete. No blocker, so the work proceeds to V0.1 (Phases 2–3).**

## For the owner's judgment (review points)
1. **Population list** (`POPULATIONS.md`): 81 populations (73 with AADR members, 8 inferred-only). Check the naming, the use of "-associated" for culture-defined groups, and the `geographic_population` category for region-and-period groupings.
2. **Data model** (`DATA_MODEL.md`): added the categories `archaic_population` and `geographic_population` and the relationship type `shared_ancestry`, plus an `AdmixtureEvent` with multiple models.
3. **Renderer change:** d3-geo Equal Earth + Canvas instead of MapLibre + deck.gl (reasons in `ARCHITECTURE.md`). This is the one deviation from CLAUDE.md's stack defaults.
4. **No language claims in the UI**, even where papers make them (`RESEARCH.md`, "Not visualized"). This is a framing decision.
5. **AADR date inconsistencies (136 individuals):** whether to report them to the AADR maintainers (`research/notes/LOG.md`).

## Recommended architecture
A static site with no backend. A Python + Polars pipeline (download pinned/checksummed AADR → parse → normalize → membership → validate → export) produces compact JSON that a Next.js static export loads (~0.7 MB gzipped initially). The map is d3-geo Equal Earth rendered on Canvas 2D, with longitude rotation so the Pacific is never cut. The timeline is an SVG segmented linear scale with visible breaks and brush zoom. Time filtering uses date-range overlap weights computed per frame over typed arrays. DuckDB-WASM is not needed. Details: `ARCHITECTURE.md`.

## Recommended data model
Three levels plus provenance: `AncientIndividual` (one per AADR Individual ID, verbatim and normalized fields side by side, date ranges on an astronomical axis, coordinate precision class, quality flags, overrides) → `Population` (curated, categorised, rule-based membership, derived footprint, confidence, evidence) → `PopulationRelationship` and `AdmixtureEvent` (competing models side by side, proportions with interval type, admixture dates distinct from sample dates, sex bias). Provenance runs `Evidence` (our-words claim, location in source, verification level) → `Source`, plus `Disagreement` records. Validation enforces that confidence never exceeds the evidence, that abstract-only evidence is at most medium, that complete models sum to 1, and a deterministic-wording lint. Details: `DATA_MODEL.md`; schemas in `data/schemas/`.

## Recommended initial population set
81 populations across 11 transitions (`POPULATIONS.md`): archaic (3), earliest Eurasians (5), Late Pleistocene and early Holocene hunter-gatherers (13), Near East (7), Neolithic Europe (4), steppe and expansions (17), South Asia (4), East and Southeast Asia (10), Americas (7), Oceania (4), Africa (8). It is backed by 141 evidence records from 73 usable papers, with 21 admixture events (30+ models), 46 other relationships and 9 represented disagreements. V0.1 renders all of them; the 27 sparse ones are badged.

## Recommended technology stack
Next.js 15 (static export), React 19, TypeScript; d3-geo/d3-zoom/d3-scale/topojson-client; Canvas 2D; fonts Source Serif 4 + Inter (self-hosted, OFL); Vitest + Playwright. Pipeline: Python 3.13, Polars, PyArrow, jsonschema, pytest, uv. Data: AADR v66.p1 (CC0) and Natural Earth (public domain).

## Major scientific risks
- **Over-reading proportions.** Many are model- and proxy-dependent. Mitigation: every bar is labelled "modelled as …", with a model switcher and interval type.
- **Sampling bias read as population size or presence.** Mitigation: the density strip, sparse badges, an equal-area projection, and an About-the-data page.
- **Culture/genetics conflation** in population names. Mitigation: categories, "-associated" naming, caveats, and explicit counter-examples (Gravettian, Beaker, Pastoral Neolithic).
- **Inferred populations looking real** (Basal Eurasian, ANI/ASI/AASI, ghost founders). Mitigation: `inferred_only`, no map footprint, a faint/dashed style, and display windows marked as such.
- **Contested topics** (Yamnaya formation, Americas entry timing, Iranian-related ancestry in South Asia). Mitigation: disagreement records, with all models shown.
- **Language framing.** Not displayed.

## Major data-quality risks
- AADR date-field inconsistencies (136 individuals). Stored as union ranges and flagged; 5 fixed by override.
- Site-level coordinates with variable precision (up to 466 individuals at one coordinate). Mitigation: precision classes, deterministic jitter in display, never a "burial location" claim.
- Multiple rows per individual with conflicting labels (66). Mitigation: representative-row rule, with alternatives kept.
- Group labels that do not encode culture (Iberian Beaker), or that include anachronisms. Mitigation: membership notes, and labels never used as names.
- Incomplete memberships (Indus Periphery, CLV). Flagged in `POPULATIONS.md`.

## Licensing and data-use risks
- AADR is CC0. Citation norms (Dataverse version + Mallick 2024 + original papers) are met by a per-sample publication link and the About page. Never redistribute the decommissioned v62.0/v66.0 data.
- Natural Earth is public domain.
- Indigenous data sensitivity (Americas, Oceania, Australia): respectful presentation, no images of remains, and no links to present-day communities beyond the published ancestry relationships.
- Fonts are OFL and self-hosted. All JS dependencies are MIT/ISC/Apache.
- Complementary datasets (Poseidon, p3k14c, XRONOS) have unverified licences and are not used (`BLOCKED.md`).

## Implementation plan for V0.1
1. **Phase 2 (mostly done):** normalize ✓, curated ontology ✓, validation ✓, membership report ✓. Remaining: basemap fetch (Natural Earth, pinned), browser export (columnar samples, detail shards, ontology with derived footprints and admixture edges), data report, and the one-command build.
2. **Phase 3:** 2–3 visual directions in `docs/design/` → choose one → app scaffold → map (basemap, samples with date-weight opacity, population fields) → timeline (segmented scale, density strip, lifespans, admixture-date bands, presets, play) → linking → relationships with typed styles → population, sample and evidence panels → phone layout → screenshots and polish rounds.
