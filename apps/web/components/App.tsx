"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEGEND } from "@dnamap/visualization";
import type { Dataset } from "@/lib/data";
import { loadDataset } from "@/lib/data";
import { THEMES } from "@/lib/mapRender";
import { initTracking, trackEvent } from "@/lib/track";
import { getState, readUrlState, setState, subscribe, THEME_IDS, useAppState, writeUrlState } from "@/lib/store";
import MapCanvas from "./MapCanvas";
import Timeline from "./Timeline";
import { EvidencePanel, PopulationPanel, SamplePanel } from "./Panels";

/** Rank: exact acronym or name > word starts with the query > anywhere in the name or aliases. */
function searchPopulations(data: Dataset, query: string) {
  const q = query.trim().toLowerCase();
  const rank = (p: Dataset["ontology"]["populations"][number]): number => {
    const names = [p.name, ...p.aliases.map((a) => a.name)].map((n) => n.toLowerCase());
    if (names.some((n) => n === q)) return 0;
    if (names.some((n) => n.split(/[^a-z0-9\u00c0-\u024f]+/).includes(q))) return 1; // whole word, e.g. "asi" in "(ASI, modelled)"
    if (names.some((n) => n.split(/[^a-z0-9\u00c0-\u024f]+/).some((w) => w.startsWith(q)))) return 2;
    return names.some((n) => n.includes(q)) ? 3 : 9;
  };
  return data.ontology.populations
    .map((p) => ({ p, r: rank(p) }))
    .filter((x) => x.r < 9)
    .sort((a, b) => a.r - b.r)
    .slice(0, 8)
    .map((x) => x.p);
}

export default function App() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selection = useAppState((s) => s.selection);
  const panel = useAppState((s) => s.panel);
  const theme = useAppState((s) => s.theme);
  const showBorders = useAppState((s) => s.showBorders);
  const [legendOpen, setLegendOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setState(readUrlState());
    loadDataset().then(setData, (e) => setError(String(e)));
    const stopTracking = initTracking();
    const stopUrl = subscribe(() => writeUrlState(getState()));
    return () => {
      stopTracking();
      stopUrl();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = THEMES[theme].dark ? "dark" : "light";
    document.documentElement.dataset.maptheme = theme;
  }, [theme]);

  if (error) return <div className="loading">Could not load data: {error}</div>;
  if (!data) return <div className="loading">Loading ancient DNA samples and populations…</div>;

  const pop = selection.kind === "population" ? data.popById.get(selection.id) : undefined;
  const panelOpen = selection.kind === "sample" || !!pop;
  const matches = query.length >= 2 ? searchPopulations(data, query) : [];

  return (
    <div className={panelOpen ? "app panel-open" : "app"}>
      <header className="topbar">
        <div className="brand">
          <span className="title">A Map of Us</span>
          <span className="subtitle">human population history from ancient DNA, 50,000 BCE – 1500 CE</span>
        </div>
        <div className="search">
          <input type="search" placeholder="Find a population" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Find a population" />
          {matches.length > 0 && (
            <ul className="search-results">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      const r = p.range;
                      const a = data.anchors[data.popIndex.get(p.id)!];
                      setState({
                        selection: { kind: "population", id: p.id },
                        panel: "details",
                        ...(r ? { time: Math.round((r.start + r.end) / 2) } : {}),
                        ...(a ? { view: { lon: a.lon, lat: a.lat, k: Math.max(getState().view.k, 2.2) } } : {}),
                      });
                      setQuery("");
                      trackEvent("search_pick", { id: p.id });
                    }}
                  >
                    {p.name}
                    {p.inferred_only && <span className="search-tag"> inferred, not on the map</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav className="topnav">
          <button className="link-btn" onClick={() => setLegendOpen(!legendOpen)} aria-expanded={legendOpen}>
            Key
          </button>
          <Link href="/about/">About the data</Link>
          <Link href="/methodology/">Methodology</Link>
          <Link href="/extraction/">From bone to genome</Link>
        </nav>
      </header>

      <main className="stage">
        <MapCanvas data={data} />
        <p className="census-note">A reconstruction from the ancient genomes sampled so far, not a census. Empty areas usually mean no samples, not no people.</p>
        {legendOpen && (
          <aside className="legend" aria-label="Map key">
            <h3>Map key</h3>
            <ul className="legend-list">
              <li>
                <span className="lg-dot" /> sampled individual (observed). Faint = date range wider than the time shown
              </li>
              <li>
                <span className="lg-dot lg-plain" /> plain dark or light dot: a sampled individual not (yet) part of a named population
              </li>
              <li>
                <span className="lg-dot lg-hollow" /> data flagged critical by AADR
              </li>
              <li>
                <span className="lg-field" /> population field: inferred extent around its sampled members
              </li>
              <li>
                <span className="lg-line" /> strong evidence <span className="lg-line lg-dashed" /> moderate <span className="lg-line lg-dotted" /> weak/proposed
              </li>
              <li>
                <span className="lg-arrow">→</span> ancestry contributed (direction supported) · <span className="lg-double">═</span> shared ancestry (no direction) · <span className="lg-admix">◉</span> admixture (line width ∝ published proportion)
              </li>
              <li>Lines connect populations; they do not trace routes.</li>
            </ul>
            <h3>Colours</h3>
            <ul className="legend-colors">
              {LEGEND.map((l) => (
                <li key={l.label}>
                  <span className="swatch" style={{ background: l.color }} /> {l.label}
                </li>
              ))}
            </ul>
            <p className="small muted">
              <Link href="/privacy/">Privacy</Link>
            </p>
            <label className="toggle small">
              <input type="checkbox" checked={showBorders} onChange={(e) => setState({ showBorders: e.target.checked })} /> show present-day borders (for orientation only)
            </label>
            <div className="small muted theme-switch">
              Map style:{" "}
              {THEME_IDS.map((t) => (
                <button key={t} className={t === theme ? "chip chip-on" : "chip"} onClick={() => setState({ theme: t })} aria-pressed={t === theme}>
                  {THEMES[t].name}
                </button>
              ))}
            </div>
          </aside>
        )}
        {panelOpen && (
          <aside className="side-panel" aria-label="Details">
            <button className="close-btn" aria-label="Close panel" onClick={() => setState({ selection: { kind: "none" }, highlightMembers: false })}>
              ×
            </button>
            {selection.kind === "sample" && <SamplePanel data={data} index={selection.index} />}
            {pop && panel === "details" && <PopulationPanel data={data} pop={pop} />}
            {pop && panel === "evidence" && <EvidencePanel data={data} pop={pop} />}
          </aside>
        )}
      </main>
      <Timeline data={data} />
    </div>
  );
}
