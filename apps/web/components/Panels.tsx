"use client";

import { useEffect, useState } from "react";
import type { AdmixtureEvent, AdmixtureModel, Evidence, Population, Proportion, SampleDetail } from "@dnamap/data-model";
import { formatRange } from "@dnamap/data-model";
import { GROUP_COLOR } from "@dnamap/visualization";
import type { Dataset } from "@/lib/data";
import { loadSampleDetail } from "@/lib/data";
import { setState, useAppState } from "@/lib/store";
import { reportUrl } from "@/lib/report";

export const CATEGORY_TEXT: Record<string, { label: string; explain: string }> = {
  genetic_cluster: { label: "Genetic cluster", explain: "Individuals grouped because they share an ancestry profile in the cited studies." },
  archaeological_population: { label: "Archaeological grouping", explain: "Individuals grouped by the archaeological culture of their burials. People buried with the same material culture can differ genetically." },
  geographic_population: { label: "Region and period", explain: "Individuals grouped by where and when they lived. Not a single genetic profile." },
  historical_population: { label: "Historical period", explain: "Individuals from the time and place of a documented polity. Not an ethnic identity." },
  archaic_population: { label: "Archaic humans", explain: "A human group distinct from Homo sapiens, known from fossils and genomes." },
  modern_population: { label: "Present-day population", explain: "A present-day group, linked only by published ancestry relationships." },
};

const CONF_TEXT: Record<string, string> = {
  high: "Strong evidence: shown directly by ancient genomes in checked studies.",
  medium: "Moderate: one study, model-dependent, or checked from the abstract only.",
  low: "Weak or proposed: contested or hedged by its authors.",
};

export function ConfidenceBadge({ c }: { c: string }) {
  return (
    <span className={`badge conf-${c}`} title={CONF_TEXT[c]}>
      <span className="conf-glyph" aria-hidden="true" />
      {c} confidence
    </span>
  );
}

function pct(p: Proportion | null): string {
  if (!p) return "proportion not given";
  const f = (v: number) => `${(100 * v).toFixed(v < 0.1 ? 1 : 0)}%`;
  if (p.low !== undefined && p.high !== undefined) return `${p.kind === "approximate" ? "~" : ""}${f(p.value)} (${f(p.low)}–${f(p.high)})`;
  return `${p.kind === "approximate" ? "~" : ""}${f(p.value)}`;
}

function Citation({ data, sourceId }: { data: Dataset; sourceId: string }) {
  const s = data.sourceById.get(sourceId);
  if (!s) return <span>{sourceId}</span>;
  const short = s.citation.split("(")[0].replace(/,\s*$/, "").replace(/, et al\.?$/, " et al.");
  return (
    <a href={s.url ?? (s.doi ? `https://doi.org/${s.doi}` : "#")} target="_blank" rel="noreferrer" title={s.citation}>
      {short} {s.year}
    </a>
  );
}

function CompositionBar({ data, model }: { data: Dataset; model: AdmixtureModel }) {
  const comps = model.components.filter((c) => c.proportion);
  if (comps.length === 0) return null;
  return (
    <div className="comp-bar" role="img" aria-label={model.components.map((c) => `${c.proxy_label} ${pct(c.proportion)}`).join(", ")}>
      {comps.map((c) => {
        const pop = c.population_id ? data.popById.get(c.population_id) : null;
        const color = pop ? GROUP_COLOR[pop.transition] : "#9aa3a8";
        return (
          <div key={c.proxy_label} className="comp-seg" style={{ flexBasis: `${100 * c.proportion!.value}%`, background: color }} title={`${c.proxy_label}: ${pct(c.proportion)}`}>
            {c.proportion!.low !== undefined && c.proportion!.high !== undefined && (
              <span className="comp-range" style={{ width: `${(100 * (c.proportion!.high! - c.proportion!.low!)) / Math.max(0.0001, c.proportion!.value)}%` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdmixtureBlock({ data, ev }: { data: Dataset; ev: AdmixtureEvent }) {
  const choice = useAppState((s) => s.modelChoice[ev.id]);
  const modelId = choice ?? ev.default_model_id ?? ev.models[0].id;
  const model = ev.models.find((m) => m.id === modelId) ?? ev.models[0];
  return (
    <div className="admix">
      <div className="admix-head">
        <h4>Ancestry, as modelled</h4>
        {ev.models.length > 1 && <span className="muted">{ev.models.length} published models</span>}
      </div>
      {ev.models.length > 1 && (
        <div className="model-switch" role="tablist" aria-label="Published models">
          {ev.models.map((m) => (
            <button key={m.id} role="tab" aria-selected={m.id === model.id} className={m.id === model.id ? "chip chip-on" : "chip"} onClick={() => setState((s) => ({ modelChoice: { ...s.modelChoice, [ev.id]: m.id } }))}>
              {data.sourceById.get(m.source_id)?.citation.split(" ")[0].replace(",", "")} {data.sourceById.get(m.source_id)?.year}
            </button>
          ))}
        </div>
      )}
      <p className="model-label">
        Modelled as <em>{model.label}</em>
        <span className="muted">
          {" "}
          · <Citation data={data} sourceId={model.source_id} /> · {model.method.replace("_", " ")}
        </span>
      </p>
      <CompositionBar data={data} model={model} />
      <ul className="comp-list">
        {model.components.map((c) => (
          <li key={c.proxy_label}>
            <span className="swatch" style={{ background: c.population_id ? GROUP_COLOR[data.popById.get(c.population_id)!.transition] : "#9aa3a8" }} />
            {c.population_id ? (
              <button className="link-btn" onClick={() => setState({ selection: { kind: "population", id: c.population_id! }, panel: "details" })}>
                {c.proxy_label}
              </button>
            ) : (
              <span>{c.proxy_label}</span>
            )}
            <span className="muted"> {pct(c.proportion)}</span>
            {c.is_proxy && <span className="muted"> · proxy</span>}
          </li>
        ))}
      </ul>
      {model.admixture_date && (
        <p className="small">
          Date of mixing:{" "}
          {model.admixture_date.range
            ? formatRange(model.admixture_date.range.start, model.admixture_date.range.end)
            : model.admixture_date.generations_before_sample
              ? `${model.admixture_date.generations_before_sample[0]}–${model.admixture_date.generations_before_sample[1]} generations before this individual`
              : ""}{" "}
          <span className="muted">({model.admixture_date.method})</span>
        </p>
      )}
      {model.sex_bias && <p className="small">Sex bias: {model.sex_bias}</p>}
      {!model.complete && <p className="small muted">This model names only some components or gives no numbers for them; it is not a full composition.</p>}
    </div>
  );
}

/** Short citations for the sources behind a set of claims, each linking to the paper. */
function SourceList({ data, evidenceIds }: { data: Dataset; evidenceIds: string[] }) {
  const ids = [...new Set(evidenceIds.map((i) => data.evidenceById.get(i)?.source_id).filter((x): x is string => !!x))];
  return (
    <>
      {ids.map((id, n) => (
        <span key={id}>
          {n > 0 && "; "}
          <Citation data={data} sourceId={id} />
        </span>
      ))}
    </>
  );
}

/** Every paper behind this population (its own claims, its relationships and its admixture models), with a link to a free copy when one exists. */
function ReadingList({ data, pop }: { data: Dataset; pop: Population }) {
  const ids = new Set(pop.evidence_ids);
  for (const ev of data.ontology.admixture_events.filter((x) => x.target === pop.id)) for (const m of ev.models) m.evidence_ids.forEach((i) => ids.add(i));
  for (const r of data.ontology.relationships.filter((x) => x.source === pop.id || x.target === pop.id)) r.evidence_ids.forEach((i) => ids.add(i));
  const bySource = new Map<string, number>();
  for (const i of ids) {
    const e = data.evidenceById.get(i);
    if (e && e.source_id !== "aadr") bySource.set(e.source_id, (bySource.get(e.source_id) ?? 0) + 1);
  }
  const items = [...bySource.entries()]
    .map(([id, n]) => ({ s: data.sourceById.get(id)!, n }))
    .filter((x) => x.s)
    .sort((a, b) => a.s.year - b.s.year);
  if (items.length === 0) return null;
  return (
    <section className="reading">
      <h4>Further reading</h4>
      <p className="small muted">The studies behind this page, oldest first. Links open the publisher or a free full-text copy where one exists.</p>
      <ul className="reading-list">
        {items.map(({ s, n }) => (
          <li key={s.id}>
            <span className="reading-title">{s.title ?? s.citation}</span>
            <span className="small muted">
              {" "}
              {s.citation.split("(")[0].replace(/,\s*$/, "").replace(/, et al\.?$/, " et al.")} ({s.year}) · supports {n} claim{n === 1 ? "" : "s"} here
            </span>
            <span className="small reading-links">
              {s.pmcid && (
                <a href={`https://pmc.ncbi.nlm.nih.gov/articles/${s.pmcid}/`} target="_blank" rel="noreferrer">
                  Free full text
                </a>
              )}
              {(s.doi || s.url) && (
                <a href={s.url ?? `https://doi.org/${s.doi}`} target="_blank" rel="noreferrer">
                  Publisher page
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PopulationPanel({ data, pop }: { data: Dataset; pop: Population }) {
  const cat = CATEGORY_TEXT[pop.category];
  const events = data.ontology.admixture_events.filter((e) => e.target === pop.id);
  const incoming = data.ontology.relationships.filter((r) => r.target === pop.id);
  const outgoing = data.ontology.relationships.filter((r) => r.source === pop.id);
  const contributesTo = data.ontology.admixture_edges.filter((e) => e.source === pop.id);
  const showLow = useAppState((s) => s.showLowConfidence);
  const highlight = useAppState((s) => s.highlightMembers);
  const rng = pop.range;
  return (
    <article className="panel-body">
      <header className="panel-head">
        <span className="group-dot" style={{ background: GROUP_COLOR[pop.transition] }} aria-hidden="true" />
        <h2>{pop.name}</h2>
      </header>
      <div className="badges">
        <span className="badge" title={cat.explain}>
          {cat.label}
        </span>
        <ConfidenceBadge c={pop.confidence} />
        {pop.stats.sparse && !pop.inferred_only && <span className="badge badge-warn">sparse evidence</span>}
        {pop.inferred_only && <span className="badge badge-inferred">inferred, not sampled</span>}
      </div>
      <p className="category-explain">{cat.explain}</p>
      <dl className="facts">
        <div>
          <dt>{pop.inferred_only ? "Display window" : "Sampled"}</dt>
          <dd>{rng ? formatRange(rng.start, rng.end, { round: 10 }) : "–"}</dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{pop.region.name}</dd>
        </div>
        {!pop.inferred_only && (
          <div>
            <dt>Evidence base</dt>
            <dd>
              {pop.stats.members} individual{pop.stats.members === 1 ? "" : "s"} · {pop.stats.sites} site{pop.stats.sites === 1 ? "" : "s"} · {pop.stats.publications} publication{pop.stats.publications === 1 ? "" : "s"}
            </dd>
          </div>
        )}
      </dl>
      <p className="prose">{pop.description}</p>
      {pop.genetic_profile && (
        <section>
          <h4>Genetic profile</h4>
          <p className="prose">{pop.genetic_profile}</p>
        </section>
      )}
      {pop.overview?.map((sec) => (
        <section key={sec.heading} className="overview-sec">
          <h4>{sec.heading}</h4>
          <p className="prose">{sec.text}</p>
          <p className="small muted overview-src">
            Based on: <SourceList data={data} evidenceIds={sec.evidence_ids} />
          </p>
        </section>
      ))}
      {pop.archaeological_context && (
        <section>
          <h4>Archaeological context</h4>
          <p className="prose">{pop.archaeological_context}</p>
        </section>
      )}
      {events.map((ev) => (
        <AdmixtureBlock key={ev.id} data={data} ev={ev} />
      ))}
      {(incoming.length > 0 || outgoing.length > 0 || contributesTo.length > 0) && (
        <section>
          <h4>Relationships</h4>
          <ul className="rel-list">
            {[...incoming, ...outgoing]
              .filter((r) => showLow || r.confidence !== "low")
              .map((r) => {
                const other = r.source === pop.id ? r.target : r.source;
                return (
                  <li key={r.id}>
                    <span className={`rel-glyph rel-${r.type} conf-${r.confidence}`} aria-hidden="true" />
                    <span>{r.wording} </span>
                    <button className="link-btn" onClick={() => setState({ selection: { kind: "population", id: other }, panel: "details" })}>
                      {data.popById.get(other)?.name}
                    </button>
                    {!r.time_estimated && <span className="muted small"> · time not estimated</span>}
                    {r.confidence === "low" && <span className="badge badge-weak">proposed / contested</span>}
                  </li>
                );
              })}
            {contributesTo
              .filter((e, i, a) => a.findIndex((x) => x.target === e.target) === i)
              .map((e) => (
                <li key={e.id}>
                  <span className="rel-glyph rel-admixture" aria-hidden="true" />
                  <span>Ancestry related to this population contributed to </span>
                  <button className="link-btn" onClick={() => setState({ selection: { kind: "population", id: e.target }, panel: "details" })}>
                    {data.popById.get(e.target)?.name}
                  </button>
                  <span className="muted small"> ({pct(e.proportion)} in one model)</span>
                </li>
              ))}
          </ul>
          {incoming.concat(outgoing).some((r) => r.confidence === "low") && (
            <label className="toggle small">
              <input type="checkbox" checked={showLow} onChange={(e) => setState({ showLowConfidence: e.target.checked })} /> show proposed / contested links
            </label>
          )}
        </section>
      )}
      {pop.aliases.length > 0 && (
        <p className="small muted">
          Also called: {pop.aliases.map((a) => a.name).join("; ")}
        </p>
      )}
      {pop.caveats.length > 0 && (
        <section className="caveats">
          <h4>Caveats</h4>
          <ul>
            {pop.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="panel-actions">
        {!pop.inferred_only && (
          <button className="btn" aria-pressed={highlight} onClick={() => setState({ highlightMembers: !highlight })}>
            {highlight ? "Show all samples" : "View samples"}
          </button>
        )}
        <button className="btn btn-primary" onClick={() => setState({ panel: "evidence" })}>
          Show evidence
        </button>
      </div>
      {!pop.inferred_only && (
        <details className="labels-detail">
          <summary className="small">How members are chosen</summary>
          <p className="small">{pop.membership.notes || "AADR group labels matched by the rule below."}</p>
          <ul className="small mono">
            {pop.stats.labels.map(([l, n]) => (
              <li key={l}>
                {l} ({n})
              </li>
            ))}
          </ul>
        </details>
      )}
      <ReadingList data={data} pop={pop} />
      <p className="small report-row">
        <span className="mono muted">{pop.id}</span>
        <a className="report-link" href={reportUrl({ id: pop.id, text: `${pop.name}: ${pop.description}`, context: "Population panel" })} target="_blank" rel="noreferrer">
          Report a problem with this population
        </a>
      </p>
    </article>
  );
}

function EvidenceItem({ data, e }: { data: Dataset; e: Evidence }) {
  const s = data.sourceById.get(e.source_id);
  return (
    <li className="evidence">
      <p className="prose">{e.claim}</p>
      <p className="small">
        <Citation data={data} sourceId={e.source_id} /> · {e.location} · <ConfidenceBadge c={e.confidence} />
        {e.verification === "abstract_only" && <span className="badge badge-weak">checked against abstract only</span>}
        {s?.status === "erratum" && <span className="badge badge-warn">paper has an erratum</span>}
        {e.stance === "contradicts" && <span className="badge badge-warn">contradicts another claim</span>}
      </p>
      {e.note && <p className="small muted">{e.note}</p>}
      <p className="small report-row">
        <span className="mono muted">{e.id}</span>
        <a className="report-link" href={reportUrl({ id: e.id, text: e.claim, context: "Evidence panel" })} target="_blank" rel="noreferrer">
          Report a problem
        </a>
      </p>
    </li>
  );
}

export function EvidencePanel({ data, pop }: { data: Dataset; pop: Population }) {
  const ids = new Set(pop.evidence_ids);
  for (const ev of data.ontology.admixture_events.filter((x) => x.target === pop.id)) for (const m of ev.models) m.evidence_ids.forEach((i) => ids.add(i));
  for (const r of data.ontology.relationships.filter((x) => x.source === pop.id || x.target === pop.id)) r.evidence_ids.forEach((i) => ids.add(i));
  const evs = [...ids].map((i) => data.evidenceById.get(i)!).filter(Boolean);
  const disagreements = data.ontology.disagreements.filter(
    (d) => d.affects.includes(pop.id) || data.ontology.admixture_events.some((ev) => ev.target === pop.id && d.affects.includes(ev.id)) || data.ontology.relationships.some((r) => (r.source === pop.id || r.target === pop.id) && d.affects.includes(r.id)),
  );
  return (
    <article className="panel-body">
      <header className="panel-head">
        <button className="link-btn" onClick={() => setState({ panel: "details" })}>
          ← {pop.name}
        </button>
      </header>
      <h2>Why is this shown?</h2>
      <p className="small muted">Each statement is in our words, checked against the cited paper at the location given. The data behind the map points come from the Allen Ancient DNA Resource ({data.manifest.aadr_release}).</p>
      {disagreements.map((d) => (
        <section key={d.id} className="disagreement">
          <h4>
            Sources disagree: {d.topic} <span className="badge">{d.status}</span>
          </h4>
          <p className="prose">{d.summary}</p>
          <div className="positions">
            {d.positions.map((p) => (
              <div key={p.label} className="position">
                <strong>{p.label}</strong>
                <ul>
                  {p.evidence_ids.map((i) => (
                    <li key={i} className="small">
                      <Citation data={data} sourceId={data.evidenceById.get(i)!.source_id} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
      <ul className="evidence-list">
        {evs.map((e) => (
          <EvidenceItem key={e.id} data={data} e={e} />
        ))}
      </ul>
    </article>
  );
}

export function SamplePanel({ data, index }: { data: Dataset; index: number }) {
  const S = data.samples;
  const [d, setD] = useState<SampleDetail | null | undefined>(undefined);
  useEffect(() => {
    setD(undefined);
    loadSampleDetail(S.shard[index], S.id[index]).then(
      (x) => setD(x ?? null),
      () => setD(null),
    );
  }, [index, S]);
  const pop = S.pop[index] >= 0 ? data.ontology.populations[S.pop[index]] : null;
  const pub = S.publications[S.pub[index]];
  return (
    <article className="panel-body">
      <header className="panel-head">
        <h2 className="mono">{S.id[index]}</h2>
      </header>
      <p className="small muted">An ancient individual: an observation, not an inference.</p>
      <dl className="facts">
        <div>
          <dt>Date (95% range)</dt>
          <dd>
            {formatRange(S.start[index], S.end[index])}
            {S.conflict[index] ? <span className="badge badge-warn">date fields disagree in source</span> : null}
          </dd>
        </div>
        {d && (
          <>
            <div>
              <dt>Dating</dt>
              <dd>
                {d.date_kind.replace(/_/g, " ")}
                {d.c14_age_bp ? ` · ¹⁴C ${d.c14_age_bp}±${d.c14_error} BP` : ""}
                {d.lab_code ? ` (${d.lab_code})` : ""}
                <div className="small muted mono">{d.full_date_text}</div>
                {d.date_warnings.length > 0 && <div className="small warn">{d.date_warnings.join("; ")}</div>}
              </dd>
            </div>
            <div>
              <dt>Site</dt>
              <dd>
                {d.locality}
                {d.political_entity ? <span className="muted"> · present-day {d.political_entity}</span> : null}
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>
                {d.source_lat}, {d.source_lon} <span className="muted">· precision: {d.precision}</span>
                {d.shared_coordinate_count > 1 && <div className="small muted">{d.shared_coordinate_count} individuals share this coordinate (spread apart on the map for visibility).</div>}
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>Source group label</dt>
          <dd className="mono">{S.groups[S.group[index]]}</dd>
        </div>
        <div>
          <dt>Assigned population</dt>
          <dd>
            {pop ? (
              <button className="link-btn" onClick={() => setState({ selection: { kind: "population", id: pop.id }, panel: "details" })}>
                {pop.name}
              </button>
            ) : (
              <span className="muted">none (not part of a curated population)</span>
            )}
          </dd>
        </div>
        {d && (
          <>
            <div>
              <dt>Genetic sex · haplogroups</dt>
              <dd>
                {d.molecular_sex}
                {d.y_hg ? ` · Y ${d.y_hg}` : ""}
                {d.mt_hg ? ` · mt ${d.mt_hg}` : ""}
              </dd>
            </div>
            <div>
              <dt>Data quality (AADR)</dt>
              <dd>
                {d.assessment} · {d.snps_1240k.toLocaleString("en-US")} SNPs
                {d.assessment_warnings ? <div className="small muted">{d.assessment_warnings}</div> : null}
              </dd>
            </div>
            {d.override_ids.length > 0 && (
              <div>
                <dt>Corrections</dt>
                <dd className="small">This record's date was corrected by the project ({d.override_ids.join(", ")}); see the overrides file for the reason.</dd>
              </div>
            )}
          </>
        )}
        <div>
          <dt>Source publication</dt>
          <dd>
            {pub.doi ? (
              <a href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer">
                {pub.key}
              </a>
            ) : (
              pub.key
            )}
          </dd>
        </div>
      </dl>
      {d === undefined && <p className="small muted">Loading record…</p>}
      {d === null && <p className="small muted">The full record could not be loaded. The details above come from the map&rsquo;s summary data.</p>}
      <p className="small report-row">
        <a className="report-link" href={reportUrl({ id: S.id[index], context: "Sample record (AADR)" })} target="_blank" rel="noreferrer">
          Report a problem with this record
        </a>
      </p>
    </article>
  );
}
