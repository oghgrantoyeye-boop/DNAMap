# DATA_MODEL

How the project represents observations, curated interpretations, and their provenance. The TypeScript types live in `packages/data-model/src/types.ts` and the JSON Schemas in `data/schemas/`; this document explains them. Refined against real AADR v66.p1 columns (`research/sources/aadr.md`).

## 0. Conventions

- **Years:** integers on the **astronomical axis** (1 CE = 1, 1 BCE = 0, *n* BCE = 1 − *n*). Conversion only at display time. BP (1950-based) → year: `1950 − BP`. See `research/chronology/date-conventions.md`.
- **Ranges, never points:** `TimeRange = { start: number; end: number }` with `start ≤ end`. A single year is allowed only when the source gives one (then `start == end` and `point_source: true`).
- **Verbatim + normalized:** every field we normalize keeps its source value alongside (`source_group_label`, `full_date_text`, `source_lat/lon`).
- **IDs:** lowercase kebab-case for curated entities (`yamnaya-associated`); AADR `Individual ID` verbatim for individuals.
- **Confidence:** `"high" | "medium" | "low"`, defined in §6. It maps to visual style: solid / dashed / faint.

## 1. Three levels plus provenance

```
            Source ──< Evidence >── (claims about) ──┬── Population
                                                    ├── PopulationRelationship
                                                    ├── AdmixtureEvent (models[])
                                                    └── Disagreement
AncientIndividual (observed) ──membership rules──> Population (curated)
```

The UI's answer to "Why is this shown?" is the chain: visual element → entity → `evidence_ids` → Evidence (claim in our words + location in source + verification level) → Source (citation, DOI).

## 2. Observed level: `AncientIndividual`

One record per AADR `Individual ID`, built from all its rows (data versions). Produced by `pipeline/aadr/normalize.py`; never hand-edited (use overrides).

```ts
interface AncientIndividual {
  id: string;                    // AADR Individual ID (verbatim)
  persistent_id: string;         // AADR Persistent Genetic ID of the representative row
  genetic_ids: string[];         // all AADR rows for this individual
  representative_genetic_id: string; // row with most 1240k SNPs hit (AADR's advice)
  source_group_label: string;    // Group ID of the representative row, verbatim
  alt_group_labels: string[];    // differing Group IDs on other rows (66 individuals in v66.p1)
  locality: string;              // verbatim
  political_entity: string;      // modern country — display context only, never identity
  location: {
    lat: number | null; lon: number | null;   // normalized (after overrides)
    source_lat: string; source_lon: string;   // verbatim text
    precision: "fine" | "site" | "coarse" | "missing"; // from decimal places: ≥3 / 2 / 0–1 / none
    shared_coordinate_count: number;          // individuals at the identical coordinate
  };
  date: {
    range: TimeRange;            // 95.4% calibrated or contextual range (astronomical years)
    range_source: "full_date" | "derived_from_mean_sd";
    mean_bp: number; sd_bp: number;           // verbatim numeric AADR fields
    full_date_text: string;      // verbatim
    method_text: string;         // verbatim
    kind: "direct_radiocarbon" | "contextual" | "genetic" | "relative_tethered" | "other";
    calibrated: boolean;
    c14?: { age_bp: number; error: number; lab_code: string };
    warnings: string[];          // extracted WARNING/CAUTION notes
  };
  molecular_sex: string;
  y_haplogroup?: string; mt_haplogroup?: string;
  publication: { key: string; first_key: string; doi?: string };
  data: { type: string; suffixes: string; snps_1240k: number };
  quality: { assessment: string; warnings?: string; usable: boolean }; // usable = not CRITICAL
  population_ids: string[];      // assigned by curated membership rules (§3)
  override_ids: string[];        // overrides applied (§7)
}
```

Representative-row choice and the alternatives are kept in `data/processed/aadr_v66.p1_rows.parquet`, so a different choice can be audited.

## 3. Curated level: `Population`

A population is **our** curated grouping. It is not a people, ethnicity, nation or culture. Its `category` says what kind of grouping it is:

| category | meaning | example |
|---|---|---|
| `genetic_cluster` | individuals grouped by shared genetic ancestry profile in the cited studies | WHG / Oberkassel cluster |
| `archaeological_population` | individuals grouped because they are buried in contexts of one archaeological culture or horizon; their genetics may be heterogeneous | Bell Beaker-associated individuals, Iberia |
| `historical_population` | individuals from a historically documented polity or period | Xiongnu-period individuals |
| `modern_population` | present-day groups (Phase 9; linked only by supported ancestry relationships) | — |
| `archaic_population` | non-*sapiens* hominin groups (added category: Neandertals and Denisovans are not "genetic clusters" of modern humans) | Neandertals |

```ts
interface Population {
  id: string;
  name: string;                  // our display name; uses "-associated" for culture-defined groups
  aliases: { name: string; used_by: string[] }[]; // e.g. WHG ≡ "Oberkassel cluster" (posth2023)
  category: PopulationCategory;
  description: string;           // original prose, careful language
  genetic_profile?: string;      // kept separate from…
  archaeological_context?: string; // …archaeological context
  time_range: TimeRange;         // curated, from sources and/or member dates
  time_range_basis: "member_samples" | "sources" | "both";
  region: { name: string; note?: string }; // human-readable; geometry comes from members (§3.1)
  membership: MembershipRule;    // how individuals are assigned
  inferred_only: boolean;        // true for ghost/modelled groups with no sampled members (e.g. Basal Eurasian)
  location_hint?: { lat: number; lon: number; label: string; source_ids: string[] }; // only when a source places it
  confidence: Confidence;
  evidence_ids: string[];
  caveats: string[];             // e.g. "label projects a later identity back in time"
}

interface MembershipRule {
  // An individual is a member if it matches ANY include rule and NO exclude rule,
  // and its quality is usable (unless include_questionable).
  include: {
    group_label_regex: string;   // applied to source_group_label (verbatim AADR Group ID)
    date_within?: TimeRange;     // individual's range must overlap this
    bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  }[];
  exclude_group_label_regex?: string;  // default excludes outliers: "-o|_o\\b|\\.o\\b"
  include_individual_ids?: string[];   // explicit additions (with reason in notes)
  exclude_individual_ids?: string[];
  include_questionable?: boolean;
  notes: string;                 // why these rules; which paper defines the grouping
  defining_source_ids: string[];
}
```

### 3.1 Spatial extent is derived, never drawn by hand
A population's footprint on the map is computed from its **member individuals' coordinates**: a soft kernel field per time slice, weighted by each member's date overlap. No hand-drawn polygons. Populations with `inferred_only: true` have no footprint. They appear in the relationship graph and timeline, and on the map only as a `location_hint` marker when a source names a place, styled as inferred.

### 3.2 Sparse flag
`sparse = members < 5 || distinct sites < 2` (computed at export). Sparse populations show an "evidence sparse" badge.

## 4. Relationships

```ts
type RelationshipType =
  | "admixture"      // target received ancestry from source (proportion where published); part of an AdmixtureEvent
  | "ancestry"       // source-related ancestry contributed to target (direction supported, no proportion)
  | "migration"      // movement of people is the paper's explicit inference (direction supported)
  | "split"          // modelled divergence of lineages (model-based date)
  | "expansion"      // a source's ancestry spread over a broad area / several targets
  | "continuity"     // same-region genetic continuity across time
  | "shared_ancestry"; // non-directional extra affinity (e.g. Tianyuan–GoyetQ116-1); added type

interface PopulationRelationship {
  id: string;
  type: RelationshipType;
  source: string;                // population id (or ancestry component id)
  target: string;
  time_range: TimeRange;         // when the relationship is drawn (window of the process, not sample dates)
  time_basis: string;            // e.g. "admixture date (DATES) 3600–3300 BCE" or "between latest source and earliest target sample"
  direction_supported: boolean;  // false → drawn without arrowhead
  proportion?: Proportion;       // only if published (else fixed neutral width)
  confidence: Confidence;
  admixture_event_id?: string;
  evidence_ids: string[];
  disagreement_ids: string[];
  wording: string;               // pre-written careful sentence: "Yamnaya-related ancestry contributed ~75% …"
}

interface Proportion {
  value: number;                 // 0..1
  low?: number; high?: number;   // published interval (±1 SE, 95% CI, or range — see kind)
  kind: "estimate_se" | "ci95" | "range" | "approximate";
  note?: string;
}
```

## 5. `AdmixtureEvent`: competing models side by side

```ts
interface AdmixtureEvent {
  id: string;
  target: string;                // population id
  region: string;
  models: AdmixtureModel[];      // ≥1; never merged
  archaic: boolean;              // Neandertal/Denisovan events
  evidence_ids: string[];
}

interface AdmixtureModel {
  id: string;
  label: string;                 // "modelled as Core Yamnaya + UNHG (qpAdm)"
  source_id: string;             // the paper
  method: "qpAdm" | "admixture_graph" | "f4_ratio" | "ADMIXTURE" | "SFS_model" | "segment_based" | "other";
  components: {
    population_id?: string;      // when the source maps to a curated population
    proxy_label: string;         // the proxy as named in the paper, e.g. "Ukraine_N (UNHG)"
    is_proxy: boolean;           // true when the proxy stands in for an unsampled source
    proportion: Proportion;
  }[];
  complete: boolean;             // true if components are meant to sum to ~1 (validated: |Σ−1| ≤ 0.03)
  admixture_date?: { range: TimeRange; method: string; generation_years?: number; generations_before_sample?: [number, number] };
  pulse_model?: "single_pulse" | "multiple_pulses" | "continuous" | "unspecified";
  sex_bias?: string;             // as reported, in our words
  evidence_ids: string[];
}
```

## 6. Evidence, Sources, Disagreements

```ts
interface Evidence {
  id: string;
  claim: string;                 // OUR words, one claim
  source_id: string;
  location: string;              // "Abstract; Fig. 2a; SI 14"
  verification: "full_text" | "abstract_only";
  confidence: Confidence;
  stance: "supports" | "qualifies" | "contradicts";
  note?: string;
}

interface Source {
  id: string;                    // e.g. "haak2015" (matches research/papers/<topic>-haak2015.md)
  type: "paper" | "dataset" | "book" | "database";
  citation: string; doi?: string; url?: string; year: number;
  verification: "full_text" | "abstract_only";
  status: "usable" | "erratum" | "unmined";
  note_path?: string;
}

interface Disagreement {
  id: string;
  topic: string;                 // "Formation of Yamnaya-associated ancestry"
  summary: string;               // our words
  positions: { label: string; evidence_ids: string[] }[];
  affects: string[];             // ids of populations/relationships/events
  status: "open" | "narrowed";
}
```

**Confidence levels:**
- `high`: directly shown by sampled ancient genomes in at least one full-text-verified study, with no published contradiction, and preferably corroborated.
- `medium`: one study, or abstract-only verification, or estimates that depend heavily on model/proxy choice, or inferences about ancient events from present-day genomes.
- `low`: proposed or weakly supported, explicitly hedged by the authors, or contested. Hidden by default, shown when the user opts in, always faint.

An entity's confidence is never higher than its best evidence's confidence. Validation enforces this.

## 7. Overrides

`data/curated/overrides/aadr_overrides.csv`, one row per change:

```
override_id, individual_id, persistent_id, field, old_value, new_value, reason, evidence_source_id, date_added
```

Applied in `normalize.py` after parsing, before membership. The old value must match the raw data, or the build fails, so overrides cannot silently go stale when AADR updates. Every applied override is listed on the sample card.

## 8. Files and layout

```
data/raw/aadr/v66.p1/…                          immutable, gitignored, checksummed
data/processed/aadr_v66.p1_rows.parquet         all rows, parsed, + representative flag   (gitignored, rebuildable)
data/processed/aadr_v66.p1_individuals.parquet  one per individual, normalized             (gitignored, rebuildable)
data/curated/sources.json                       generated from research/papers notes + datasets
data/curated/evidence.json                      hand-curated
data/curated/populations.json                   hand-curated (incl. membership rules)
data/curated/relationships.json                 hand-curated
data/curated/admixture_events.json              hand-curated
data/curated/disagreements.json                 hand-curated
data/curated/periods.json                       hand-curated presets
data/curated/overrides/aadr_overrides.csv       hand-curated
data/schemas/*.schema.json                      JSON Schema (draft 2020-12) for each curated file
apps/web/public/data/                           export (committed): compact browser files + manifest.json
```

### Browser export (what the app loads)
- `samples.json`: **columnar** arrays for all ancient individuals in or near the V1 window: `id`, `lon`, `lat`, `start`, `end`, `kind`, `precision`, `pop` (index or −1), `quality`, `pub` (index into a publications table). About 17k rows; ~1.5 MB raw, ~0.4 MB gzipped.
- `samples-detail/<shard>.json`: full per-individual records, sharded by hash (64 shards), fetched on click.
- `ontology.json`: populations (with computed member counts, sparse flags, per-population footprints as weighted point sets), relationships, admixture events, evidence, sources, disagreements, periods.
- `manifest.json`: AADR release, build date, git commit, content hashes, counts.

## 9. Validation (`pipeline/validation/`)
- JSON Schema validation of every curated file.
- Referential integrity: every `evidence_ids` entry exists; every evidence has a source; every relationship/population endpoint exists.
- Every population, relationship and admixture model has ≥1 evidence; every evidence's source has status `usable` or `erratum` (and erratum evidence must carry a `note`).
- Confidence of an entity ≤ max confidence of its evidence; `abstract_only` evidence ≤ `medium`.
- Admixture models with `complete: true` sum to 1 ± 0.03.
- Date ranges: `start ≤ end`; individual ranges inside −250000…2000; population ranges within the V1 window or explicitly flagged.
- Coordinates within bounds; on land or flagged (Natural Earth land, 50m, with a buffer for coastal sites).
- No population without membership rules unless `inferred_only`; non-inferred populations must have ≥1 member (or be flagged `no_members_in_v66` with a reason).
- Wording lint: forbid deterministic phrases (`became`, `turned into`, `were replaced by` without a proportion, `the X people`) in curated prose fields.
