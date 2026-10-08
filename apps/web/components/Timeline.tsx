"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatYear, formatYearsAgo } from "@dnamap/data-model";
import { GROUP_COLOR, makeProjection, ticksFor, viewForSpan } from "@dnamap/visualization";
import type { Dataset } from "@/lib/data";
import { getState, setState, useAppState } from "@/lib/store";
import { trackEvent } from "@/lib/track";
import { halfWindowFor, scaleFor } from "@/lib/timeWindow";

const PAD_X = 16;

export default function Timeline({ data }: { data: Dataset }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const time = useAppState((s) => s.time);
  const zoomWindow = useAppState((s) => s.zoomWindow);
  const view = useAppState((s) => s.view);
  const selection = useAppState((s) => s.selection);
  const playing = useAppState((s) => s.playing);
  const hoverPop = useAppState((s) => s.hoverPopulation);
  const [showYearsAgo, setShowYearsAgo] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = scaleFor({ zoomWindow });
  const innerW = Math.max(100, width - 2 * PAD_X);
  const x = (y: number) => PAD_X + scale.toUnit(y) * innerW;
  const yearAt = (px: number) => scale.fromUnit((px - PAD_X) / innerW);
  const hw = halfWindowFor({ zoomWindow, time });
  const compact = width < 640;

  // --- sample density for the visible map area (sampling bias made visible)
  const density = useMemo(() => {
    const binPx = 3;
    const nb = Math.ceil(innerW / binPx);
    const bins = new Float32Array(nb);
    const S = data.samples;
    // visible area test via projection
    const mapEl = document.querySelector(".map-wrap") as HTMLElement | null;
    const mw = mapEl?.clientWidth ?? 1000,
      mh = mapEl?.clientHeight ?? 600;
    const proj = makeProjection(mw, mh, view);
    for (let i = 0; i < S.n; i++) {
      const p = proj([S.lon[i], S.lat[i]]);
      if (!p || p[0] < 0 || p[1] < 0 || p[0] > mw || p[1] > mh) continue;
      // spread each sample's weight uniformly over the bins its range covers
      const u0 = scale.toUnit(S.start[i]),
        u1 = scale.toUnit(S.end[i]);
      if (u1 < 0 || u0 > 1) continue;
      const b0 = Math.max(0, Math.floor(u0 * nb)),
        b1 = Math.min(nb - 1, Math.floor(u1 * nb));
      const share = 1 / (b1 - b0 + 1);
      for (let b = b0; b <= b1; b++) bins[b] += share;
    }
    let max = 0;
    for (const v of bins) max = Math.max(max, v);
    return { bins, max, binPx };
  }, [data, view, zoomWindow, innerW]);

  // --- population lifespan bands, packed into lanes
  const lanes = useMemo(() => {
    const items = data.ontology.populations
      .filter((p) => p.range)
      .map((p) => ({ p, x0: x(Math.max(p.range!.start, scale.domain[0])), x1: x(Math.min(p.range!.end, scale.domain[1])) }))
      .filter((d) => d.x1 > PAD_X && d.x0 < PAD_X + innerW)
      .sort((a, b) => a.x0 - b.x0);
    const laneEnds: number[] = [];
    const placed = items.map((it) => {
      let lane = laneEnds.findIndex((e) => e + 2 < it.x0);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = Math.max(it.x0 + 2, it.x1);
      return { ...it, lane };
    });
    return { placed, n: laneEnds.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, zoomWindow, innerW]);

  // --- admixture-date bands (distinct from sample dates)
  const admixMarks = useMemo(() => {
    const out: { x0: number; x1: number; id: string; target: string; label: string }[] = [];
    for (const ev of data.ontology.admixture_events) {
      for (const m of ev.models) {
        const r = m.admixture_date?.range;
        if (!r) continue;
        if (r.end < scale.domain[0] || r.start > scale.domain[1]) continue;
        out.push({ x0: x(Math.max(r.start, scale.domain[0])), x1: x(Math.min(r.end, scale.domain[1])), id: `${ev.id}:${m.id}`, target: ev.target, label: m.label });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, zoomWindow, innerW]);

  // --- play: constant screen speed
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const s = getState();
      const sc = scaleFor(s);
      const u = sc.toUnit(s.time) + dt * 0.022;
      if (u >= 1) {
        setState({ time: sc.domain[1], playing: false });
        return;
      }
      setState({ time: sc.fromUnit(u) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // --- scrubbing
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  function setFromEvent(e: React.PointerEvent) {
    const r = svgRef.current!.getBoundingClientRect();
    const px = Math.max(PAD_X, Math.min(PAD_X + innerW, e.clientX - r.left));
    setState({ time: Math.round(yearAt(px)) });
  }

  const selectedPopId = selection.kind === "population" ? selection.id : null;
  const laneH = compact ? 2 : 3;
  const lanesTop = 6;
  const lanesH = Math.min(lanes.n, compact ? 10 : 16) * (laneH + 1);
  const densTop = lanesTop + lanesH + 6;
  const densH = compact ? 18 : 26;
  const axisY = densTop + densH + 2;
  const svgH = axisY + 22;
  // drop ticks that would collide (segment boundaries bunch ticks together)
  const ticks: number[] = [];
  for (const t of ticksFor(scale, innerW)) {
    if (ticks.length && x(t) - x(ticks[ticks.length - 1]) < 58) continue;
    ticks.push(t);
  }
  const cursorX = x(time);

  return (
    <section className="timeline" aria-label="Timeline">
      <div className="timeline-controls">
        <button
          className="icon-btn"
          aria-label={playing ? "Pause" : "Play through time"}
          onClick={() => {
            const s = getState();
            if (!s.playing && scaleFor(s).toUnit(s.time) >= 0.999) setState({ time: scaleFor(s).domain[0] });
            setState({ playing: !s.playing });
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="time-readout" aria-live="polite">
          <span className="time-main">{showYearsAgo ? formatYearsAgo(time) : formatYear(time)}</span>
          <button className="link-btn" onClick={() => setShowYearsAgo(!showYearsAgo)}>
            {showYearsAgo ? "show BCE/CE" : "show years ago"}
          </button>
          <span className="time-window">± {Math.round(hw).toLocaleString("en-US")} years shown</span>
        </div>
        <div className="presets" role="list">
          {data.ontology.periods.map((p) => (
            <button
              key={p.id}
              role="listitem"
              className="chip"
              title={`${formatYear(p.window.start)} – ${formatYear(p.window.end)}`}
              onClick={() => {
                trackEvent("preset", { id: p.id });
                const mapEl = document.querySelector(".map-wrap") as HTMLElement | null;
                const v = viewForSpan(mapEl?.clientWidth ?? 1000, mapEl?.clientHeight ?? 600, p.view.center, p.view.span_deg);
                setState({
                  time: Math.round((p.window.start + p.window.end) / 2),
                  view: v,
                  zoomWindow: [p.window.start, p.window.end],
                  playing: false,
                  ...(p.select ? { selection: { kind: "population" as const, id: p.select }, panel: "details" as const } : {}),
                });
              }}
            >
              {p.label}
            </button>
          ))}
          {zoomWindow && (
            <button className="chip chip-strong" onClick={() => setState({ zoomWindow: null })}>
              Full timeline
            </button>
          )}
        </div>
      </div>
      <div ref={ref} className="timeline-svg-wrap">
        <svg
          ref={svgRef}
          width={width}
          height={svgH}
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setState({ playing: false });
            setFromEvent(e);
          }}
          onPointerMove={(e) => dragging.current && setFromEvent(e)}
          onPointerUp={() => (dragging.current = false)}
          role="slider"
          aria-label="Time"
          aria-valuemin={scale.domain[0]}
          aria-valuemax={scale.domain[1]}
          aria-valuenow={Math.round(time)}
          aria-valuetext={formatYear(time)}
          tabIndex={0}
          onKeyDown={(e) => {
            const s = getState();
            const sc = scaleFor(s);
            const du = e.shiftKey ? 0.05 : 0.005;
            if (e.key === "ArrowRight") setState({ time: Math.round(sc.fromUnit(Math.min(1, sc.toUnit(s.time) + du))) });
            else if (e.key === "ArrowLeft") setState({ time: Math.round(sc.fromUnit(Math.max(0, sc.toUnit(s.time) - du))) });
            else return;
            e.preventDefault();
          }}
        >
          {/* segment backgrounds and breaks */}
          {scale.segmented &&
            scale.segments.map((s, i) => (
              <g key={s.label}>
                <rect x={x(s.start)} y={0} width={x(s.end) - x(s.start)} height={axisY} className={i % 2 ? "seg-bg seg-alt" : "seg-bg"} />
                {i > 0 && <line x1={x(s.start)} x2={x(s.start)} y1={0} y2={axisY + 6} className="seg-break" />}
              </g>
            ))}
          {/* population lifespans */}
          {lanes.placed
            .filter((d) => d.lane < (compact ? 10 : 16))
            .map((d) => {
              const sel = d.p.id === selectedPopId || d.p.id === hoverPop;
              return (
                <rect
                  key={d.p.id}
                  x={d.x0}
                  y={lanesTop + d.lane * (laneH + 1)}
                  width={Math.max(2, d.x1 - d.x0)}
                  height={sel ? laneH + 1 : laneH}
                  rx={1}
                  fill={sel || (d.p.range!.start <= time && d.p.range!.end >= time) ? GROUP_COLOR[d.p.transition] : "var(--ink-3)"}
                  opacity={selectedPopId ? (sel ? 1 : 0.18) : d.p.inferred_only ? 0.3 : d.p.range!.start <= time && d.p.range!.end >= time ? 0.85 : 0.28}
                  className={d.p.inferred_only ? "band-inferred" : undefined}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setState({ selection: { kind: "population", id: d.p.id }, panel: "details" });
                  }}
                >
                  <title>{`${d.p.name} — ${formatYear(d.p.range!.start)} to ${formatYear(d.p.range!.end)}${d.p.inferred_only ? " (inferred; display window)" : ""}`}</title>
                </rect>
              );
            })}
          {/* admixture-date bands: drawn as hollow brackets, distinct from sample-based lifespans */}
          {admixMarks.map((m) => (
            <g key={m.id} className={m.target === selectedPopId ? "admix-mark admix-sel" : "admix-mark"}>
              <title>{`Estimated date of admixture: ${m.label}`}</title>
              <rect x={m.x0} y={densTop - 4} width={Math.max(3, m.x1 - m.x0)} height={3} />
            </g>
          ))}
          {/* sample density */}
          <g className="density" aria-hidden="true">
            {Array.from(density.bins).map((v, b) =>
              v > 0 ? (
                <rect key={b} x={PAD_X + b * density.binPx} y={densTop + densH - (densH * Math.sqrt(v)) / Math.sqrt(density.max || 1)} width={density.binPx - 0.5} height={(densH * Math.sqrt(v)) / Math.sqrt(density.max || 1)} />
              ) : null,
            )}
          </g>
          <text x={PAD_X + 2} y={densTop + 9} className="density-label">
            samples in view
          </text>
          {/* axis */}
          <line x1={PAD_X} x2={PAD_X + innerW} y1={axisY} y2={axisY} className="axis" />
          {ticks.map((t) => (
            <g key={t} transform={`translate(${x(t)},${axisY})`}>
              <line y2={4} className="axis" />
              <text y={15} textAnchor={x(t) < PAD_X + 24 ? "start" : x(t) > PAD_X + innerW - 24 ? "end" : "middle"} className="tick">
                {tickLabel(t, showYearsAgo)}
              </text>
            </g>
          ))}
          {/* window + cursor */}
          <rect x={x(time - hw)} y={0} width={Math.max(1, x(time + hw) - x(time - hw))} height={axisY} className="cursor-window" />
          <line x1={cursorX} x2={cursorX} y1={0} y2={axisY + 4} className="cursor" />
        </svg>
      </div>
    </section>
  );
}

function tickLabel(y: number, ago: boolean): string {
  if (ago) {
    const a = 2000 - y;
    return a >= 1000 ? `${Math.round(a / 1000)}k ya` : `${a} ya`;
  }
  if (y <= 0) {
    const b = 1 - y;
    return b >= 10000 ? `${Math.round(b / 1000)}k BCE` : `${b} BCE`;
  }
  return y === 1 ? "1 CE" : `${y} CE`;
}
