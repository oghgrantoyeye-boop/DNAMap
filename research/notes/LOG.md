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
