# CLAUDE.md — Human Population History

Standing instructions for every session in this repository. Read this before doing anything. The current task, if any, is in `KICKOFF.md` or the session prompt.

## What we are building

An interactive website — an "interactive scientific history book" — that shows who was where, when, and how human populations changed and interacted, ~50,000 BCE → 1500 CE for V1 (designed to extend to ~200,000 BCE → present later).

Core experience: a continuous timeline driving a world map of ancient DNA samples and curated population groups, with explicit relationships (admixture, split, expansion, continuity, etc.), a detail panel per population, visible evidence/sources for every claim, visible uncertainty, and later trace-backward/forward and a guided story mode.

Conceptual inspiration: David Reich's *Who We Are and How We Got Here* and the ancient-DNA literature. **Never reproduce text or figures from the book or any paper.** The visualization and prose must be original; papers are cited, not copied.

## Non-negotiable scientific rules

1. "Population" is not ethnicity, nation, race, culture, or place. Keep these distinct in data and language: ancient individuals, genetic clusters, archaeological cultures/horizons, geographic populations, historical populations, modern populations.
2. No deterministic lineage language. Not "X became Y". Write "X-related ancestry contributed to Y" or "populations associated with X carried substantial Y-related ancestry".
3. Every substantive claim has evidence → source. If you cannot cite a checked primary source, the claim does not ship. Do not assume a paper says something — open it and check.
4. Uncertainty is shown, not hidden. Confidence levels on claims and relationships; inferred things look inferred (dashed/faint); sparse data is flagged as sparse.
5. Observed ≠ inferred. Visually and in the data model, separate: observed sample location / inferred population distribution / inferred movement or ancestry relationship.
6. No fake routes, no invented interpolation. If a population is attested at two times/places with no evidence between, show the gap, not a path.
7. The data is not a census. aDNA sampling is extremely uneven; the UI must communicate sampling density and bias.
8. Modern populations are a separate category, linked only by supported ancestry contributions. Modern ethnic/national identities are recent and must not be projected backward.
9. When sources disagree, represent the disagreement. Don't silently pick one.
10. When in doubt, research; when unsupported, remove. Never guess a historical or genetic claim.

## Priorities

correctness > completeness · provenance > impressive claims · simple architecture > premature infrastructure · good UX > maximal data density · nuance > oversimplification. Beauty never substitutes for evidence.

## Data rules

- Raw source files (AADR etc.) are immutable. Pipeline: raw → ingestion → normalization → validation → curated → visualization. Every step is a reproducible script.
- Any change to a date, coordinate, or label is recorded with a reason (a changelog/override file with source + justification), never a silent edit.
- Large raw files are not committed to git. Commit a download script with source URL, version, and checksum; store raw data under `data/raw/` (gitignored). Commit small processed/curated outputs needed by the app.
- Record dataset version and licence/terms of use in `SOURCES.md` before using any dataset.

## Conceptual data model (refine after inspecting real data)

Three levels plus provenance:

- **AncientIndividual** — direct observation: id, coordinates (+ precision), date range (+ dating method, calibrated or not), site, region, group label from source, archaeological context, haplogroups, publication/source ids.
- **Population** — curated entity: id, name, category (`genetic_cluster | archaeological_population | historical_population | modern_population`), time range, regions, description, member-individual criteria, confidence, evidence ids.
- **PopulationRelationship** — explicit edge: source, target, type (`ancestry | admixture | migration | split | expansion | continuity`, extend if needed), time range, proportion estimates with ranges where published, confidence, evidence ids.
- **Evidence** — claim text (our words), source id, confidence, notes, and where in the source it is supported.
- **Source** — full citation, DOI/URL, type (paper, dataset, book, database).

Chain: claim → evidence → source → relationship → visualization. The UI must eventually answer "Why is this connection shown?"

## Architecture defaults

One Git repository, pnpm workspace. Starting layout (change it only with a written reason in `ARCHITECTURE.md`):

```
apps/web/            Next.js + TypeScript + React
packages/data-model/ shared TS types + JSON schemas
packages/visualization/  map/timeline layers
packages/ui/
data/{raw,processed,curated,schemas}/
pipeline/{aadr,populations,validation}/   Python + Polars → Parquet/JSON
research/{papers,populations,chronology,sources,notes}/
scripts/  tests/
```

Stack defaults: Next.js, TypeScript, MapLibre GL, deck.gl, D3; Python + Polars + Parquet for processing; DuckDB/DuckDB-WASM only if it earns its place. No backend for V1 unless clearly needed. Don't add tech for fashion; optimize for iteration speed, correctness, reproducibility, rendering performance, maintainability. Basemap/boundaries must come from real published geographic data with compatible licences.

## Conventions

- Years: store as integers on a single astronomical axis (e.g. 1 BCE = 0, 2 BCE = −1) or as BP — choose one, document it in `DATA_MODEL.md`, and convert only at display time. Always keep date ranges, never a single point unless the source gives one.
- Keep source group labels verbatim alongside any normalized label.
- Coordinates: keep the source value and a precision/quality flag.

## How to work

Before major implementation decisions:

1. Inspect the repo and relevant research/data.
2. State the approach briefly (in the relevant doc or commit message).
3. Implement the smallest useful version.
4. Run tests/validation.
5. Review for scientific inaccuracies against rule list above.
6. Update docs (`RESEARCH.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `SOURCES.md`, `POPULATIONS.md`).

Commit in small, described steps. Keep a running log in `research/notes/LOG.md` of decisions, open questions, and anything you could not verify.

## Working unattended

You may be running without anyone watching. Don't stall on questions: take the most reasonable reading, record the assumption in `research/notes/LOG.md`, and continue. Stop and write up the decision (rather than acting) only for things that are hard to undo or that change the project's scientific framing.

If a download or website is blocked by the network sandbox, do not try to route around it. Record exactly what is needed (URL, file, version) in `research/notes/BLOCKED.md`, work with what is reachable (papers, documentation, small samples), and continue with the rest of the task.
