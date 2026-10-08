// Types for the browser data exported by pipeline/export/web.py.
// See DATA_MODEL.md for the meaning of each field. Years are astronomical
// (1 BCE = 0, n BCE = 1 − n); see time.ts for display conversion.

export type Confidence = "high" | "medium" | "low";

export interface TimeRange {
  start: number;
  end: number;
}

export type PopulationCategory =
  | "genetic_cluster"
  | "archaeological_population"
  | "geographic_population"
  | "historical_population"
  | "modern_population"
  | "archaic_population";

export type Transition =
  | "archaic"
  | "early-eurasians"
  | "eur-hg"
  | "near-east"
  | "neolithic"
  | "steppe"
  | "south-asia"
  | "east-asia"
  | "americas"
  | "oceania"
  | "africa";

/** Columnar sample table (samples.json). Arrays are parallel, length n. */
export interface SampleTable {
  n: number;
  id: string[];
  lon: number[];
  lat: number[];
  start: number[];
  end: number[];
  kind: number[]; // index into kinds
  precision: number[]; // index into precisions
  site: number[]; // shared-coordinate group
  group: number[]; // index into groups (verbatim AADR Group ID)
  pub: number[]; // index into publications
  pop: number[]; // primary population index, −1 = unassigned
  popExtra: Record<string, number[]>;
  usable: number[]; // 1 = quality usable, 0 = CRITICAL
  conflict: number[]; // 1 = AADR date fields disagree (range is a union)
  shard: number[];
  kinds: string[];
  precisions: string[];
  groups: string[];
  publications: { key: string; doi: string | null }[];
}

export interface SampleDetail {
  individual_id: string;
  persistent_id: string;
  skeletal_code: string | null;
  group_label: string;
  alt_group_labels: string[];
  locality: string;
  political_entity: string | null;
  source_lat: string;
  source_lon: string;
  precision: string;
  shared_coordinate_count: number;
  start: number;
  end: number;
  range_source: string;
  date_conflict: string | null;
  mean_bp: number;
  sd_bp: number;
  full_date_text: string;
  method_text: string;
  date_kind: string;
  calibrated: boolean;
  c14_age_bp: number | null;
  c14_error: number | null;
  lab_code: string | null;
  date_warnings: string[];
  molecular_sex: string;
  y_hg: string | null;
  mt_hg: string | null;
  publication: string;
  first_publication: string;
  doi: string | null;
  data_repository: string | null;
  data_type: string;
  snps_1240k: number;
  assessment: string;
  assessment_warnings: string | null;
  family_relations: string | null;
  genetic_ids: string[];
  representative_genetic_id: string;
  override_ids: string[];
  population_ids: string[];
}

export interface Proportion {
  value: number;
  low?: number;
  high?: number;
  kind: "estimate_se" | "ci95" | "range" | "approximate";
  note?: string;
}

export interface Population {
  id: string;
  name: string;
  aliases: { name: string; used_by: string[] }[];
  category: PopulationCategory;
  transition: Transition;
  description: string;
  genetic_profile?: string;
  archaeological_context?: string;
  overview?: { heading: string; text: string; evidence_ids: string[] }[];
  region: { name: string; note?: string };
  membership: { notes: string; defining_source_ids: string[] };
  inferred_only: boolean;
  time_range?: TimeRange;
  location_hint?: { lat: number; lon: number; label: string; source_ids: string[] };
  confidence: Confidence;
  evidence_ids: string[];
  caveats: string[];
  range: TimeRange | null;
  stats: {
    members: number;
    sites: number;
    display_range: TimeRange | null;
    sparse: boolean;
    labels: [string, number][];
    publications?: number;
    earliest?: number;
    latest?: number;
  };
}

export type RelationshipType =
  | "ancestry"
  | "migration"
  | "split"
  | "expansion"
  | "continuity"
  | "shared_ancestry"
  | "admixture";

export interface Relationship {
  id: string;
  type: Exclude<RelationshipType, "admixture">;
  source: string;
  target: string;
  time_range: TimeRange;
  time_estimated: boolean;
  time_note?: string;
  time_basis?: string;
  point_source?: boolean;
  direction_supported: boolean;
  proportion?: Proportion;
  confidence: Confidence;
  evidence_ids: string[];
  disagreement_ids?: string[];
  wording: string;
}

export interface AdmixtureComponent {
  population_id: string | null;
  proxy_label: string;
  is_proxy: boolean;
  proportion: Proportion | null;
}

export interface AdmixtureModel {
  id: string;
  label: string;
  source_id: string;
  method: string;
  complete: boolean;
  components: AdmixtureComponent[];
  admixture_date?: {
    range?: TimeRange;
    method: string;
    note?: string;
    point_source?: boolean;
    generations_before_sample?: [number, number];
  };
  pulse_model?: string;
  sex_bias?: string;
  evidence_ids: string[];
}

export interface AdmixtureEvent {
  id: string;
  target: string;
  region: string;
  archaic: boolean;
  default_model_id?: string;
  evidence_ids: string[];
  models: AdmixtureModel[];
}

export interface AdmixtureEdge {
  id: string;
  event_id: string;
  model_id: string;
  type: "admixture";
  source: string;
  target: string;
  proportion: Proportion | null;
  proxy_label: string;
  time_range: TimeRange;
  time_estimated: boolean;
  archaic: boolean;
}

export interface Evidence {
  id: string;
  source_id: string;
  claim: string;
  location: string;
  verification: "full_text" | "abstract_only";
  confidence: Confidence;
  stance: "supports" | "qualifies" | "contradicts";
  note?: string;
}

export interface Source {
  id: string;
  type: "paper" | "dataset" | "book" | "database";
  title?: string;
  citation: string;
  doi?: string;
  url?: string;
  pmcid?: string | null;
  year: number;
  verification: "full_text" | "abstract_only" | "not_applicable";
  status: "usable" | "erratum" | "unmined";
  licence?: string;
  version?: string;
}

export interface Disagreement {
  id: string;
  topic: string;
  summary: string;
  status: "open" | "narrowed";
  positions: { label: string; evidence_ids: string[] }[];
  affects: string[];
}

export interface Period {
  id: string;
  label: string;
  window: TimeRange;
  view: { center: [number, number]; span_deg: number };
  select?: string; // population whose panel the preset opens
  source_ids: string[];
}

export interface Ontology {
  populations: Population[];
  relationships: Relationship[];
  admixture_events: AdmixtureEvent[];
  admixture_edges: AdmixtureEdge[];
  evidence: Evidence[];
  sources: Source[];
  disagreements: Disagreement[];
  periods: Period[];
}

export interface Manifest {
  aadr_release: string;
  aadr_release_date: string;
  built: string;
  git_commit: string;
  window: TimeRange;
  counts: Record<string, number>;
  coverage?: {
    by_continent: Record<string, { samples: number; assigned: number }>;
    unmapped: number;
    populations_by_group: Record<string, number>;
  };
  hashes: Record<string, string>;
}
