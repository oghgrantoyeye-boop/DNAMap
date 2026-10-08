"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Evidence, Source } from "@dnamap/data-model";
import AdSlot from "@/components/AdSlot";
import { dataBase, getJson } from "@/lib/data";
import { THEMES } from "@/lib/mapRender";
import { shortCitation } from "@/lib/cite";
import { reportUrl } from "@/lib/report";
import { getState, readUrlState, setState } from "@/lib/store";
import type { SceneApi } from "./scene";

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  text: string;
  evidence_ids: string[];
  facts: { label: string; value: string; evidence_ids: string[] }[];
  caveat?: string;
}

interface ExtractionDoc {
  chapters: Chapter[];
  evidence: Evidence[];
  sources: Source[];
}

/** Chapters whose 3D model has an exploded view (see scene.ts). */
const EXPLODABLE = new Set(["remains", "clean-room", "damage", "library"]);
const EXPLODE_LABEL: Record<string, string> = {
  remains: "Look inside the bone",
  "clean-room": "Lift the glass",
  damage: "Show the breaks",
  library: "Take apart",
};
const TOUR_SECONDS = 14;


function Sources({ doc, ids }: { doc: ExtractionDoc; ids: string[] }) {
  const ev = new Map(doc.evidence.map((e) => [e.id, e]));
  const src = new Map(doc.sources.map((s) => [s.id, s]));
  const sids = [...new Set(ids.map((i) => ev.get(i)?.source_id).filter((x): x is string => !!x))];
  return (
    <>
      {sids.map((id, n) => {
        const s = src.get(id);
        const href = s?.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${s.pmcid}/` : (s?.url ?? (s?.doi ? `https://doi.org/${s.doi}` : undefined));
        return (
          <span key={id}>
            {n > 0 && "; "}
            {href ? (
              <a href={href} target="_blank" rel="noreferrer">
                {shortCitation(s, id)}
              </a>
            ) : (
              shortCitation(s, id)
            )}
          </span>
        );
      })}
    </>
  );
}

function ChapterBody({ doc, c }: { doc: ExtractionDoc; c: Chapter }) {
  return (
    <>
      {c.text.split(/\n\n+/).map((para, n) => (
        <p key={n} className="bench-text">
          {para}
        </p>
      ))}
      {c.facts.length > 0 && (
        <dl className="bench-console" aria-label="Key figures">
          {c.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>
                {f.value}
                <span className="bench-fact-src">
                  {" "}
                  · <Sources doc={doc} ids={f.evidence_ids} />
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {c.caveat && <p className="bench-caveat">{c.caveat}</p>}
      <p className="bench-sources">
        Sources: <Sources doc={doc} ids={c.evidence_ids} />
        {" · "}
        <a href={reportUrl({ id: `extraction:${c.id}`, text: `${c.title}: ${c.text}`, context: "Extraction page" })} target="_blank" rel="noreferrer">
          Report a problem
        </a>
      </p>
    </>
  );
}

export default function Extraction() {
  const [doc, setDoc] = useState<ExtractionDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [touring, setTouring] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [hideUi, setHideUi] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [help, setHelp] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const api = useRef<SceneApi | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    // standalone page: use the style chosen on the map (URL, then this browser's memory)
    const t = readUrlState().theme ?? getState().theme;
    if (t !== getState().theme) setState({ theme: t });
    root.dataset.maptheme = t;
    root.dataset.theme = THEMES[t].dark ? "dark" : "light";
    getJson<ExtractionDoc>("extraction.json").then(setDoc, (e) => setErr(String(e)));
  }, []);

  const n = doc?.chapters.length ?? 0;

  // build the 3D scene (three.js is loaded only here)
  useEffect(() => {
    if (!doc || textMode || !holder.current) return;
    let disposed = false;
    const el = holder.current;
    import("./scene")
      .then(({ createScene, PALETTES }) => {
        if (disposed) return;
        try {
          const dark = THEMES[getState().theme].dark;
          const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
          const s = createScene(el, dark ? PALETTES.dark : PALETTES.light, { atlasUrl: `${dataBase()}data/atlas-sdf-4096.png`, reducedMotion: reduced });
          s.onPick = (idx) => {
            setTouring(false);
            setI(idx);
          };
          s.goTo(0, true);
          api.current = s;
        } catch (e) {
          console.warn("3D view unavailable:", e);
          setNoGl(true);
        }
      })
      .catch(() => setNoGl(true));
    return () => {
      disposed = true;
      api.current?.dispose();
      api.current = null;
    };
  }, [doc, textMode]);

  useEffect(() => {
    api.current?.goTo(i);
    setExploded(false);
  }, [i]);
  useEffect(() => {
    api.current?.setExploded(exploded);
  }, [exploded]);

  // guided tour
  useEffect(() => {
    if (!touring) return;
    const t = setInterval(() => {
      setI((cur) => {
        if (cur >= n - 1) {
          setTouring(false);
          return cur;
        }
        return cur + 1;
      });
    }, TOUR_SECONDS * 1000);
    return () => clearInterval(t);
  }, [touring, n]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright" || k === "pagedown") setI((c) => Math.min(n - 1, c + 1));
      else if (k === "arrowleft" || k === "pageup") setI((c) => Math.max(0, c - 1));
      else if (/^[0-9]$/.test(k)) setI(k === "0" ? 9 : Number(k) - 1);
      else if (k === "t") setTouring((t) => !t);
      else if (k === "x") setExploded((x) => !x);
      else if (k === "h") setHideUi((h) => !h);
      else if (k === "?") setHelp((h) => !h);
      else return;
      if (k !== "t") setTouring(false);
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  if (err)
    return (
      <div className="loading">
        <p>
          This page is being prepared. <Link href="/">Back to the map</Link>
        </p>
      </div>
    );
  if (!doc) return <div className="loading">Setting up the lab bench…</div>;

  const c = doc.chapters[i];
  const explodable = EXPLODABLE.has(c.id);

  if (textMode || noGl) {
    return (
      <main className="about bench-article">
        <p className="small">
          <Link href="/">← Back to the map</Link>
          {!noGl && (
            <>
              {" · "}
              <button className="link-btn" onClick={() => setTextMode(false)}>
                Back to the 3D bench
              </button>
            </>
          )}
        </p>
        <h1>From bone to genome</h1>
        <p className="lede">How a few milligrams of ancient bone become one of the dots on the map: the laboratory steps, and the checks that tell real ancient DNA from contamination.</p>
        {noGl && <p className="small muted">The 3D bench needs WebGL, which this browser does not provide, so here is the text on its own.</p>}
        <ol className="bench-chapters">
          {doc.chapters.map((ch, k) => (
            <li key={ch.id} id={`step-${ch.id}`}>
              <h2>
                <span className="bench-step">{k + 1}</span> {ch.title}
              </h2>
              <p className="bench-summary">{ch.summary}</p>
              <ChapterBody doc={doc} c={ch} />
              {k === 3 && <AdSlot />}
            </li>
          ))}
        </ol>
      </main>
    );
  }

  return (
    <div className={hideUi ? "bench bench-hide" : "bench"}>
      <div ref={holder} className="bench-stage" aria-hidden="true" />
      <p className="bench-note">Illustration, not to scale</p>

      <header className="bench-top">
        <div className="bench-brand">
          <Link href="/">← Map</Link>
          <span className="bench-title">From bone to genome</span>
        </div>
        <div className="bench-actions">
          <button className={touring ? "chip chip-on" : "chip"} onClick={() => setTouring((t) => !t)} aria-pressed={touring}>
            {touring ? "Pause tour" : "Tour"}
          </button>
          <button className={exploded ? "chip chip-on" : "chip"} onClick={() => setExploded((x) => !x)} disabled={!explodable} aria-pressed={exploded} title={explodable ? "" : "No exploded view for this step"}>
            {explodable ? EXPLODE_LABEL[c.id] : "Exploded view"}
          </button>
          <button className="chip" onClick={() => setTextMode(true)}>
            Read as text
          </button>
          <button className="chip" onClick={() => setHelp((h) => !h)} aria-expanded={help} aria-label="Controls">
            ?
          </button>
        </div>
      </header>

      {help && (
        <aside className="bench-help small" aria-label="Controls">
          <p>
            <b>← →</b> previous and next step · <b>1–9, 0</b> jump to a step · <b>T</b> tour · <b>X</b> exploded view · <b>H</b> hide the interface
          </p>
          <p>Drag to look around the station; scroll to move closer. Click a plinth to travel to it.</p>
        </aside>
      )}

      <article className="bench-card" aria-live="polite">
        <p className="bench-count">
          Step {i + 1} of {n}
        </p>
        <h2>{c.title}</h2>
        <p className="bench-summary">{c.summary}</p>
        <ChapterBody doc={doc} c={c} />
        <div className="bench-nav">
          <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
            ← Previous
          </button>
          {i < n - 1 ? (
            <button className="btn btn-primary" onClick={() => setI(i + 1)}>
              Next: {doc.chapters[i + 1].title} →
            </button>
          ) : (
            <Link className="btn btn-primary" href="/">
              See the dots on the map →
            </Link>
          )}
        </div>
      </article>

      <nav className="bench-rail" aria-label="Steps">
        {doc.chapters.map((ch, k) => (
          <button
            key={ch.id}
            className={k === i ? "bench-dot bench-dot-on" : "bench-dot"}
            onClick={() => {
              setTouring(false);
              setI(k);
            }}
            aria-label={`Step ${k + 1}: ${ch.title}`}
            aria-current={k === i ? "step" : undefined}
            title={ch.title}
          >
            {k + 1}
          </button>
        ))}
      </nav>

      {hideUi && (
        <button className="chip bench-show" onClick={() => setHideUi(false)}>
          Show interface
        </button>
      )}
    </div>
  );
}
