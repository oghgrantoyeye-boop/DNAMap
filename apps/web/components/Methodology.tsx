"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Evidence, Manifest, Ontology } from "@dnamap/data-model";
import AdSlot from "@/components/AdSlot";
import { getJson } from "@/lib/data";
import { THEMES } from "@/lib/mapRender";
import { repoLink, reportUrl, REPO_URL } from "@/lib/report";
import { getState, readUrlState, setState } from "@/lib/store";

type UsedBy = { kind: string; label: string }[];

type ExtractionChapters = { chapters: { id: string; title: string; evidence_ids: string[]; facts: { evidence_ids: string[] }[] }[] };

function usedByIndex(o: Ontology, ex: ExtractionChapters | null): Map<string, UsedBy> {
  const m = new Map<string, UsedBy>();
  const add = (id: string, kind: string, label: string) => {
    const l = m.get(id) ?? [];
    if (!l.some((x) => x.kind === kind && x.label === label)) l.push({ kind, label });
    m.set(id, l);
  };
  const name = new Map(o.populations.map((p) => [p.id, p.name]));
  for (const p of o.populations) p.evidence_ids.forEach((i) => add(i, "population", p.name));
  for (const r of o.relationships) r.evidence_ids.forEach((i) => add(i, r.type.replace("_", " "), `${name.get(r.source)} → ${name.get(r.target)}`));
  for (const e of o.admixture_events)
    for (const md of e.models) md.evidence_ids.forEach((i) => add(i, "admixture model", `${name.get(e.target)}`));
  for (const d of o.disagreements) for (const pos of d.positions) pos.evidence_ids.forEach((i) => add(i, "disagreement", d.topic));
  for (const c of ex?.chapters ?? []) {
    for (const i of c.evidence_ids) add(i, "From bone to genome", c.title);
    for (const f of c.facts) for (const i of f.evidence_ids) add(i, "From bone to genome", c.title);
  }
  return m;
}

function shortCitation(o: Ontology, sourceId: string): { text: string; href: string | null } {
  const s = o.sources.find((x) => x.id === sourceId);
  if (!s) return { text: sourceId, href: null };
  const short = s.citation.split("(")[0].replace(/,\s*$/, "").replace(/, et al\.?$/, " et al.");
  return { text: `${short} ${s.year}`, href: s.url ?? (s.doi ? `https://doi.org/${s.doi}` : null) };
}

const CONTINENT_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

export default function Methodology() {
  const [o, setO] = useState<Ontology | null>(null);
  const [m, setM] = useState<Manifest | null>(null);
  const [ex, setEx] = useState<ExtractionChapters | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [conf, setConf] = useState("all");
  const [ver, setVer] = useState("all");

  useEffect(() => {
    // Standalone route: wear the current map style's page colours, as the map does.
    const root = document.documentElement;
    // standalone page: use the style chosen on the map (URL, then this browser's memory)
    const t = readUrlState().theme ?? getState().theme;
    if (t !== getState().theme) setState({ theme: t });
    root.dataset.maptheme = t;
    root.dataset.theme = THEMES[t].dark ? "dark" : "light";
    getJson<ExtractionChapters>("extraction.json").then(setEx, () => setEx(null));
    Promise.all([getJson<Ontology>("ontology.json"), getJson<Manifest>("manifest.json")]).then(
      ([a, b]) => {
        setO(a);
        setM(b);
      },
      (e) => setErr(String(e)),
    );
  }, []);

  const used = useMemo(() => (o ? usedByIndex(o, ex) : new Map<string, UsedBy>()), [o, ex]);
  const rows = useMemo(() => {
    if (!o) return [] as Evidence[];
    const needle = q.trim().toLowerCase();
    return o.evidence.filter((e) => {
      if (conf !== "all" && e.confidence !== conf) return false;
      if (ver !== "all" && e.verification !== ver) return false;
      if (!needle) return true;
      const c = shortCitation(o, e.source_id).text;
      const u = (used.get(e.id) ?? []).map((x) => x.label).join(" ");
      return `${e.id} ${e.claim} ${c} ${u}`.toLowerCase().includes(needle);
    });
  }, [o, q, conf, ver, used]);

  const c = m?.counts ?? {};
  const cov = m?.coverage?.by_continent;
  const covTotal = cov ? Object.values(cov).reduce((a, x) => a + x.samples, 0) : 0;
  const pct = (n: number) => (covTotal ? `${((100 * n) / covTotal).toFixed(n / covTotal < 0.1 ? 1 : 0)}%` : "");

  return (
    <main className="about methodology">
      <p className="small">
        <Link href="/">← Back to the map</Link>
      </p>
      <h1>Methodology</h1>
      <p className="lede">
        How this map is built, what each mark means, and how to tell us when something is wrong. The data, the code and the reasoning are public, so every step can be checked.
      </p>
      {m && (
        <p className="small muted build-stamp">
          AADR release {m.aadr_release} ({m.aadr_release_date}) · built {m.built} · commit <span className="mono">{m.git_commit}</span> · {c.evidence} claims from {c.sources - 2} publications
        </p>
      )}

      <nav className="toc small" aria-label="On this page">
        <a href="#m-chain">The chain of evidence</a>
        <a href="#m-individuals">Individuals</a>
        <a href="#m-dates">Dates</a>
        <a href="#m-places">Places</a>
        <a href="#m-populations">Populations</a>
        <a href="#m-relationships">Relationships</a>
        <a href="#m-confidence">Confidence</a>
        <a href="#m-checks">Checks</a>
        <a href="#m-coverage">Coverage and limits</a>
        <a href="#m-claims">Every claim</a>
        <a href="#m-challenge">Challenge a claim</a>
      </nav>

      <h2 id="m-chain">The chain of evidence</h2>
      <p>Everything on the map rests on one chain. If a link is missing, the item is not shown.</p>
      <ol className="chain">
        <li>
          <strong>A published study.</strong> A peer-reviewed paper or a documented dataset, cited in full.
        </li>
        <li>
          <strong>A claim in our own words</strong>, with where in the study it is stated (section, figure, table or supplement) and whether we checked the full text or only the abstract.
        </li>
        <li>
          <strong>An item that rests on the claim</strong>: a population, a relationship between populations, or an admixture model.
        </li>
        <li>
          <strong>What you see</strong>: a field, a line, a label or a number, drawn in a style that shows its confidence.
        </li>
      </ol>
      <p>
        We compile and present published results. We do not run our own genetic analyses, and we never copy text or figures from the studies.
      </p>

      <h2 id="m-individuals">The individuals (the dots)</h2>
      <ul>
        <li>
          Each dot is one ancient person whose genome has been published, as compiled in the Allen Ancient DNA Resource (AADR), release {m?.aadr_release ?? "…"}, which is public domain (CC0). We use its annotation file (who, where, when, which publication), not the genotypes.
        </li>
        <li>When AADR lists several data rows for the same person, we keep the row with the most sites covered on the standard 1240k panel, as AADR&rsquo;s documentation advises.</li>
        <li>
          Excluded: present-day people and reference rows, people without coordinates, and people dated entirely outside 50,000 BCE – 1500 CE.
          {m && ` Of ${c.ancient_individuals_total.toLocaleString("en-US")} ancient individuals in the release, ${c.samples.toLocaleString("en-US")} are shown.`}
        </li>
        <li>
          How a genome is recovered from a bone in the first place, and how labs tell ancient DNA from contamination, is shown step by step in <Link href="/extraction/">From bone to genome</Link>.
        </li>
        <li>Individuals that AADR flags as having critical data-quality problems are drawn hollow, and are not counted as members of a population unless that population explicitly allows them.</li>
      </ul>

      <h2 id="m-dates">Dates</h2>
      <ul>
        <li>Every individual has a date range, never a single year: the 95.4% calibrated radiocarbon interval, or the archaeological context range, as given in AADR&rsquo;s date text. When that text cannot be read, we use the mean ± 2 standard deviations from AADR&rsquo;s years-BP fields, and flag the record.</li>
        <li>When AADR&rsquo;s text date and numeric date disagree, we keep both readings, show the combined range, and say so on the record.</li>
        <li>
          Clear errors are corrected only in a public <a href={repoLink("data/curated/overrides/aadr_overrides.csv")}>overrides file</a>. Each row gives the original value, the new value, the source and the reason. The original data file is never edited.
        </li>
        <li>Years are stored as astronomical years (1 BCE is year 0) and converted to BCE/CE only for display. &ldquo;Years ago&rdquo; counts back from 2000 CE.</li>
        <li>On the map, a dot&rsquo;s strength shows how much of its date range falls inside the time window around the cursor, so broadly dated individuals look faint.</li>
      </ul>

      <h2 id="m-places">Places</h2>
      <ul>
        <li>Coordinates are AADR&rsquo;s, usually for the site rather than the grave. Each record carries a precision class based on how exactly the source gives the location.</li>
        <li>People buried at the same coordinates are fanned out slightly so each can be seen. The spacing is for display only.</li>
        <li>The base map shows present-day coastlines, rivers and relief (Natural Earth, public domain). Sea level was lower during the Ice Age, so some coasts and land bridges looked different.</li>
        <li>The map uses an equal-area projection (Equal Earth), so the density of dots is not exaggerated toward the poles.</li>
      </ul>

      <h2 id="m-populations">Populations</h2>
      <ul>
        <li>
          Populations are curated from published studies ({c.populations ?? "…"} at present). Each says what kind of grouping it is: a genetic cluster, an archaeological grouping, a region and period, a historical period, or an archaic human group. None is an ethnic group, a nation or a race.
        </li>
        <li>
          Membership is a written rule matched against AADR&rsquo;s group labels exactly as AADR gives them, with optional date and area limits. Individuals labelled as outliers or duplicates in AADR are left out by default. Each population&rsquo;s panel lists the labels it matched and how many people each contributed.
        </li>
        <li>Some populations are inferred only: groups that studies model as ancestors but from which no one has been sampled. They have no members and no place on the map. They appear in panels and on the timeline.</li>
        <li>The coloured field around a population is drawn around its sampled members only. It is not a range map: people lived beyond it, and the space between sampled sites is not filled in.</li>
        <li>A population with fewer than 5 members, or with members from only one site, is labelled &ldquo;sparse evidence&rdquo;.</li>
        <li>The time span shown for a population runs from the 5th to the 95th percentile of its members&rsquo; dates when it has 20 or more members, and over all of them otherwise.</li>
      </ul>

      <h2 id="m-relationships">Relationships and admixture</h2>
      <ul>
        <li>Each line is a relationship stated in a cited study: ancestry contributed, admixture, split, expansion, continuity, or shared ancestry. Lines join population centres. They never trace a route, because the routes people took are rarely known.</li>
        <li>
          Admixture is recorded as an event with one or more published models. When studies disagree, every model is kept and you can switch between them in the panel. Proportions carry their published uncertainty. Where a study estimates when the mixing happened, that date is kept separate from the dates of the people sampled.
        </li>
        <li>The source groups in a model are usually stand-ins: the best-sampled related population. They are labelled as such.</li>
        <li>Where studies disagree on a question{o ? ` (${o.disagreements.length} recorded so far)` : ""}, the panel shows each position side by side with its sources rather than picking one.</li>
      </ul>

      <h2 id="m-confidence">Confidence</h2>
      <dl className="conf-defs">
        <div>
          <dt>
            <span className="badge conf-high">
              <span className="conf-glyph" aria-hidden="true" />
              high
            </span>
          </dt>
          <dd>Shown directly by sampled ancient genomes in at least one study we checked in full, with no published contradiction. Drawn solid.</dd>
        </div>
        <div>
          <dt>
            <span className="badge conf-medium">
              <span className="conf-glyph" aria-hidden="true" />
              medium
            </span>
          </dt>
          <dd>One study only, checked against the abstract only, a result that depends heavily on the model or the stand-in populations chosen, or an inference about the past from present-day genomes. Drawn dashed.</dd>
        </div>
        <div>
          <dt>
            <span className="badge conf-low">
              <span className="conf-glyph" aria-hidden="true" />
              low
            </span>
          </dt>
          <dd>Proposed or weakly supported, hedged by its authors, or contested. Hidden unless you ask for it, and always drawn faint.</dd>
        </div>
      </dl>
      <p>A population or relationship is never rated higher than its best supporting claim, and a claim checked only against an abstract is never rated high.</p>

      <h2 id="m-checks">Checks on every build</h2>
      <p>
        The site is rebuilt from source by <a href={repoLink("pipeline/validation/validate.py")}>one validation script</a> and a build with any error does not ship. It checks that:
      </p>
      <ul>
        <li>every record matches its schema, and every reference to a population, claim or source resolves;</li>
        <li>every population, relationship and admixture model has at least one claim behind it;</li>
        <li>no confidence rating exceeds its evidence, and no abstract-only claim is rated high;</li>
        <li>claims from papers with a published correction say how the correction is handled;</li>
        <li>each published proportion lies inside its own uncertainty range, and complete admixture models add up to 100% (within 3 points);</li>
        <li>
          the wording avoids phrasing the evidence cannot support: one group &ldquo;becoming&rdquo; another, &ldquo;the X people&rdquo;, invasion or conquest, purity or race, and replacement without a proportion.
        </li>
      </ul>

      <h2 id="m-coverage">Coverage and known limits</h2>
      <p>
        The map covers every inhabited continent, but very unevenly. Ancient DNA survives best in cold, dry places, and research has concentrated on Europe. An empty area almost always means no genomes have been sampled there yet, not that no one lived there.
      </p>
      {cov && (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="small muted">Individuals shown on the map, by present-day continent of the site</caption>
            <thead>
              <tr>
                <th scope="col">Continent</th>
                <th scope="col" className="num">
                  Individuals
                </th>
                <th scope="col" className="num">
                  Share
                </th>
                <th scope="col" className="num">
                  In a curated population
                </th>
              </tr>
            </thead>
            <tbody>
              {CONTINENT_ORDER.filter((k) => cov[k]).map((k) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td className="num">{cov[k].samples.toLocaleString("en-US")}</td>
                  <td className="num">
                    <span className="share-bar" style={{ width: `${(60 * cov[k].samples) / covTotal}px` }} aria-hidden="true" />
                    {pct(cov[k].samples)}
                  </td>
                  <td className="num">{cov[k].assigned.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ul>
        <li>Continents are assigned from the present-day country of each site, for this table only (Russia is split at the Urals; Turkey and the Caucasus count as Asia).</li>
        <li>Africa, where modern humans originated and where human genetic diversity is greatest, has the fewest sampled individuals. Heat and humidity destroy DNA, and much of the continent has not yet been studied.</li>
        <li>Many sampled individuals are not yet in any curated population. They are shown on the map in a neutral colour.</li>
        <li>AADR&rsquo;s group labels combine present-day countries, sites, periods and cultures. We keep them verbatim on each record but never use them as population names.</li>
        <li>Population fields, centres and time spans are summaries of who was sampled, so they shift as new genomes are published.</li>
        <li>
          Some genomes are published without their place. A 2026 study of natural selection reported about 10,000 new ancient West Eurasian genomes but held back their sites and archaeological context for later papers (
          <a href="https://doi.org/10.1038/s41586-026-10358-1" target="_blank" rel="noreferrer">
            Akbari et al. 2026
          </a>
          , data availability statement). They cannot be placed on the map until those papers appear.
        </li>
      </ul>

      <AdSlot />

      <h2 id="m-claims">Every claim, with its source</h2>
      <p>
        These are all {o ? o.evidence.length : "the"} claims the map rests on. Each has a permanent ID, the study it comes from, where in the study it is supported, and what on the map depends on it.
      </p>
      {err && <p className="small">Could not load the claims: {err}</p>}
      {o && (
        <>
          <div className="claims-filter">
            <label className="small" htmlFor="claim-q">
              Search
            </label>
            <input id="claim-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, words, author or population" />
            <label className="small" htmlFor="claim-conf">
              Confidence
            </label>
            <select id="claim-conf" value={conf} onChange={(e) => setConf(e.target.value)}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <label className="small" htmlFor="claim-ver">
              Checked against
            </label>
            <select id="claim-ver" value={ver} onChange={(e) => setVer(e.target.value)}>
              <option value="all">Any</option>
              <option value="full_text">Full text</option>
              <option value="abstract_only">Abstract only</option>
            </select>
            <span className="small muted" aria-live="polite">
              {rows.length} of {o.evidence.length}
            </span>
          </div>
          <ol className="claims">
            {rows.map((e) => {
              const cit = shortCitation(o, e.source_id);
              const u = used.get(e.id) ?? [];
              return (
                <li key={e.id} className="claim" id={e.id}>
                  <p className="claim-text">{e.claim}</p>
                  <p className="small claim-meta">
                    {cit.href ? (
                      <a href={cit.href} target="_blank" rel="noreferrer">
                        {cit.text}
                      </a>
                    ) : (
                      cit.text
                    )}{" "}
                    · {e.location} ·{" "}
                    <span className={`badge conf-${e.confidence}`}>
                      <span className="conf-glyph" aria-hidden="true" />
                      {e.confidence}
                    </span>
                    {e.verification === "abstract_only" && <span className="badge badge-weak">abstract only</span>}
                    {e.stance !== "supports" && <span className="badge badge-warn">{e.stance}</span>}
                  </p>
                  {u.length > 0 && (
                    <p className="small muted">
                      Used by: {u.map((x) => `${x.label} (${x.kind})`).join("; ")}
                    </p>
                  )}
                  {u.length === 0 && <p className="small muted">Not yet used on the site.</p>}
                  <p className="small report-row">
                    <span className="mono muted">{e.id}</span>
                    <a className="report-link" href={reportUrl({ id: e.id, text: e.claim, context: "Methodology: claims register" })} target="_blank" rel="noreferrer">
                      Report a problem
                    </a>
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <h2 id="m-challenge">How to challenge a claim</h2>
      <ol>
        <li>Find the claim&rsquo;s ID. It appears under each claim above, in a population&rsquo;s evidence list, and on population panels and sample records.</li>
        <li>
          Choose <strong>Report a problem</strong>. It opens a public form on GitHub with the claim filled in. You need a free GitHub account. You can also <a href={`${REPO_URL}/issues/new?template=claim-correction.yml`}>open a blank report</a>.
        </li>
        <li>Say what is wrong and cite your evidence: a DOI or link, with the page, figure, table or supplementary section.</li>
      </ol>
      <p>
        Reports are public. Each is checked against the cited sources. A claim the evidence does not support is corrected, downgraded or removed, and the change is recorded in the project&rsquo;s public history.
      </p>

      <p className="small muted">
        <Link href="/privacy/">Privacy</Link>
      </p>

      <h2 id="m-reproduce">Rebuild it yourself</h2>
      <ul>
        <li>
          Code and data: <a href={REPO_URL}>{REPO_URL.replace("https://", "")}</a>. Curated populations, claims and sources are plain JSON in <a href={repoLink("data/curated")}>data/curated</a>, and reading notes for each paper are in{" "}
          <a href={repoLink("research/papers")}>research/papers</a>.
        </li>
        <li>
          One command rebuilds everything from the original release: <span className="mono">cd pipeline &amp;&amp; uv run python -m build</span>. It downloads AADR {m?.aadr_release ?? ""}, verifies its checksum, and fails if any check above fails.
        </li>
      </ul>
    </main>
  );
}
