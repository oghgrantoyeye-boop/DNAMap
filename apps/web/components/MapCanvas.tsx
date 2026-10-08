"use client";

import { useEffect, useRef } from "react";
import { clampView, makeProjection, type View } from "@dnamap/visualization";
import type { Basemap, Dataset } from "@/lib/data";
import { loadFineBasemap } from "@/lib/data";
import { drawBasemap, drawData, THEMES, type FrameOutput } from "@/lib/mapRender";
import { ReliefLayer } from "@/lib/relief";
import { BASE } from "@/lib/data";
import { getState, setState, subscribe, type AppState } from "@/lib/store";
import { halfWindowFor } from "@/lib/timeWindow";

export default function MapCanvas({ data }: { data: Dataset }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<FrameOutput | null>(null);
  const fineRef = useRef<Basemap | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!,
      base = baseRef.current!,
      top = dataRef.current!;
    let w = 0,
      h = 0,
      dpr = 1;
    let lastBaseKey = "";
    let raf = 0;
    let pending = false;
    const relief = new ReliefLayer(`${BASE}data/relief-4096.jpg`);
    relief.onReady = () => {
      lastBaseKey = "";
      schedule();
    };

    function resize() {
      const r = wrap.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [base, top]) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
      lastBaseKey = "";
      schedule();
    }

    function render() {
      pending = false;
      const s = getState();
      const theme = THEMES[s.theme];
      const proj = makeProjection(w, h, s.view);
      const basemap = s.view.k > 2.6 && fineRef.current ? fineRef.current : data.basemap;
      if (s.view.k > 2.6 && !fineRef.current) {
        loadFineBasemap().then((b) => {
          fineRef.current = b;
          lastBaseKey = "";
          schedule();
        });
      }
      const baseKey = `${s.view.lon},${s.view.lat},${s.view.k},${w},${h},${s.theme},${s.showBorders},${basemap.scale}`;
      if (baseKey !== lastBaseKey) {
        const bctx = base.getContext("2d")!;
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const shade = theme.relief ? relief.render(w, h, dpr, proj.scale(), proj.translate(), s.view.lon, theme.relief.gain, theme.relief.mid) : null;
        drawBasemap(bctx, w, h, proj, basemap, theme, s.showBorders, shade);
        lastBaseKey = baseKey;
      }
      const ctx = top.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      outRef.current = drawData({
        ctx,
        width: w,
        height: h,
        projection: proj,
        data,
        theme,
        time: s.time,
        halfWindow: halfWindowFor(s),
        selectedPop: s.selection.kind === "population" ? s.selection.id : null,
        hoverPop: s.hoverPopulation,
        selectedSample: s.selection.kind === "sample" ? s.selection.index : null,
        highlightMembers: s.highlightMembers,
        showLowConfidence: s.showLowConfidence,
        modelChoice: s.modelChoice,
      });
    }

    function schedule() {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(render);
    }

    // ---- interaction: drag to pan/rotate, wheel/pinch to zoom, click to select
    const pointers = new Map<number, { x: number; y: number }>();
    let dragStart: { x: number; y: number; view: View; moved: boolean } | null = null;
    let pinchStart: { d: number; view: View } | null = null;

    function local(e: PointerEvent | WheelEvent) {
      const r = top.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function panTo(start: View, dx: number, dy: number): View {
      const proj = makeProjection(w, h, start);
      const c = proj.invert!([w / 2 - dx, h / 2 - dy]);
      if (!c || !Number.isFinite(c[0])) return start;
      return clampView({ lon: c[0], lat: c[1], k: start.k });
    }

    function zoomAt(view: View, factor: number, px: number, py: number): View {
      const proj = makeProjection(w, h, view);
      const g = proj.invert!([px, py]);
      const nv = clampView({ ...view, k: view.k * factor });
      if (!g) return nv;
      const proj2 = makeProjection(w, h, nv);
      const p2 = proj2(g);
      if (!p2) return nv;
      return panTo(nv, -(p2[0] - px), -(p2[1] - py));
    }

    function onPointerDown(e: PointerEvent) {
      top.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 1) dragStart = { ...local(e), view: getState().view, moved: false };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), view: getState().view };
        dragStart = null;
      }
    }
    function onPointerMove(e: PointerEvent) {
      const p = local(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinchStart && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        setState({ view: zoomAt(pinchStart.view, d / pinchStart.d, (a.x + b.x) / 2, (a.y + b.y) / 2) });
        return;
      }
      if (dragStart) {
        const dx = p.x - dragStart.x,
          dy = p.y - dragStart.y;
        if (Math.hypot(dx, dy) > 3) dragStart.moved = true;
        if (dragStart.moved) setState({ view: panTo(dragStart.view, dx, dy) });
        return;
      }
      // hover
      const hit = hitTest(p.x, p.y);
      top.style.cursor = hit ? "pointer" : "grab";
      const hp = hit?.kind === "population" ? hit.id : null;
      const hs = hit?.kind === "sample" ? hit.index : null;
      const s = getState();
      if (s.hoverPopulation !== hp || s.hoverSample !== hs) setState({ hoverPopulation: hp, hoverSample: hs });
    }
    function onPointerUp(e: PointerEvent) {
      const p = local(e);
      const wasClick = dragStart && !dragStart.moved && pointers.size === 1;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (wasClick) {
        const hit = hitTest(p.x, p.y);
        if (hit?.kind === "sample") setState({ selection: { kind: "sample", index: hit.index }, panel: "details" });
        else if (hit?.kind === "population") setState({ selection: { kind: "population", id: hit.id }, panel: "details" });
        else setState({ selection: { kind: "none" } });
      }
      dragStart = null;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const p = local(e);
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018));
      setState({ view: zoomAt(getState().view, factor, p.x, p.y) });
    }

    function hitTest(x: number, y: number): { kind: "sample"; index: number } | { kind: "population"; id: string } | null {
      const out = outRef.current;
      if (!out) return null;
      for (const l of out.labels) if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) return { kind: "population", id: l.popId };
      let best = -1,
        bd = 49;
      for (const v of out.visible) {
        const d = (v.x - x) ** 2 + (v.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = v.i;
        }
      }
      return best >= 0 ? { kind: "sample", index: best } : null;
    }

    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const v = getState().view;
      const step = 60 / v.k;
      if (e.key === "+" || e.key === "=") setState({ view: clampView({ ...v, k: v.k * 1.25 }) });
      else if (e.key === "-") setState({ view: clampView({ ...v, k: v.k / 1.25 }) });
      else if (e.key === "ArrowLeft" && e.shiftKey) setState({ view: clampView({ ...v, lon: v.lon - step }) });
      else if (e.key === "ArrowRight" && e.shiftKey) setState({ view: clampView({ ...v, lon: v.lon + step }) });
      else if (e.key === "ArrowUp" && e.shiftKey) setState({ view: clampView({ ...v, lat: v.lat + step / 2 }) });
      else if (e.key === "ArrowDown" && e.shiftKey) setState({ view: clampView({ ...v, lat: v.lat - step / 2 }) });
      else return;
      e.preventDefault();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    top.addEventListener("pointerdown", onPointerDown);
    top.addEventListener("pointermove", onPointerMove);
    top.addEventListener("pointerup", onPointerUp);
    top.addEventListener("pointercancel", onPointerUp);
    top.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    let prev: AppState = getState();
    const unsub = subscribe(() => {
      const s = getState();
      if (
        s.time !== prev.time ||
        s.view !== prev.view ||
        s.selection !== prev.selection ||
        s.theme !== prev.theme ||
        s.showBorders !== prev.showBorders ||
        s.showLowConfidence !== prev.showLowConfidence ||
        s.highlightMembers !== prev.highlightMembers ||
        s.hoverPopulation !== prev.hoverPopulation ||
        s.modelChoice !== prev.modelChoice ||
        s.zoomWindow !== prev.zoomWindow
      )
        schedule();
      prev = s;
    });
    resize();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      window.removeEventListener("keydown", onKey);
      top.removeEventListener("pointerdown", onPointerDown);
      top.removeEventListener("pointermove", onPointerMove);
      top.removeEventListener("pointerup", onPointerUp);
      top.removeEventListener("pointercancel", onPointerUp);
      top.removeEventListener("wheel", onWheel);
    };
  }, [data]);

  return (
    <div ref={wrapRef} className="map-wrap">
      <canvas ref={baseRef} className="map-canvas" aria-hidden="true" />
      <canvas
        ref={dataRef}
        className="map-canvas map-interactive"
        role="img"
        aria-label="World map of ancient DNA samples and curated populations at the selected time. Drag to move, scroll or pinch to zoom; click a dot or label for details."
        tabIndex={0}
      />
    </div>
  );
}
