"use client";

import { useEffect, useRef } from "react";
import { clampView, makeProjection, type View } from "@dnamap/visualization";
import type { Basemap, Dataset } from "@/lib/data";
import { loadFineBasemap } from "@/lib/data";
import { drawBasemap, drawData, drawDecor, THEMES, type FrameOutput } from "@/lib/mapRender";
import { GpuBase, GPU_MAX_K } from "@/lib/gpuBase";
import { ReliefLayer } from "@/lib/relief";
import { dataBase } from "@/lib/data";
import { getState, setState, subscribe, type AppState } from "@/lib/store";
import { halfWindowFor } from "@/lib/timeWindow";

export default function MapCanvas({ data }: { data: Dataset }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<FrameOutput | null>(null);
  const fineRef = useRef<Basemap | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!,
      gl = glRef.current!,
      base = baseRef.current!,
      top = dataRef.current!;
    let w = 0,
      h = 0,
      dpr = 1;
    let lastBaseKey = "";
    let raf = 0;
    let pending = false;
    // Moving the view does not repaint the canvases. They are moved with a CSS transform
    // (composited by the GPU, so it follows the pointer at full frame rate) and repainted
    // when the view settles (130 ms of no change), or every 350 ms during a long gesture
    // in a lighter "fast" form. renderedView is the view the canvases were last painted for.
    let renderedView: View | null = null;
    let fastNext = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let throttleTimer: ReturnType<typeof setTimeout> | undefined;
    let lastViewAt = 0;
    let gpuSettleTimer: ReturnType<typeof setTimeout> | undefined;
    // GPU base map (see lib/gpuBase.ts): used up to GPU_MAX_K; vector canvas beyond that or without WebGL.
    const gpu = new GpuBase(gl, {
      sdf: `${dataBase()}data/atlas-sdf-4096.png`,
      overlay: `${dataBase()}data/atlas-overlay-4096.png`,
      relief: `${dataBase()}data/relief-4096.jpg`,
    });
    gpu.onReady = () => schedule();
    const gpuFor = (k: number) => gpu.ready && !gpu.failed && k <= GPU_MAX_K;
    // How long a repaint really takes on this device (time to two frames after it), so that
    // slow devices repaint less often mid-gesture and fast ones more often.
    let paintCost = 100;
    const relief = new ReliefLayer(`${dataBase()}data/relief-4096.jpg`);
    relief.onReady = () => {
      lastBaseKey = "";
      schedule();
    };

    function resize() {
      const r = wrap.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [gl, base, top]) {
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
      const useGpu = gpuFor(s.view.k);
      // GPU frames are cheap, so only the data layer is lightened, and only while the view is moving.
      const fast = useGpu ? performance.now() - lastViewAt < 150 : fastNext;
      const basemap = !useGpu && s.view.k > 2.6 && fineRef.current && !fast ? fineRef.current : data.basemap;
      if (!useGpu && s.view.k > 2.6 && !fineRef.current && !fast) {
        loadFineBasemap().then((b) => {
          fineRef.current = b;
          lastBaseKey = "";
          schedule();
        });
      }
      fastNext = false;
      renderedView = s.view;
      base.style.transform = top.style.transform = "";
      let drawnOnGpu = false;
      if (useGpu) drawnOnGpu = gpu.draw(w, h, dpr, proj.scale(), proj.translate(), s.view.lon, theme, fast ? 0.6 : 1);
      gl.style.visibility = drawnOnGpu ? "visible" : "hidden";
      base.style.visibility = drawnOnGpu ? "hidden" : "visible";
      const baseKey = `${s.view.lon},${s.view.lat},${s.view.k},${w},${h},${s.theme},${s.showBorders},${basemap.scale},${fast}`;
      if (!drawnOnGpu && baseKey !== lastBaseKey) {
        const bctx = base.getContext("2d")!;
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const shade = theme.relief ? relief.render(w, h, dpr, proj.scale(), proj.translate(), s.view.lon, theme.relief.gain, theme.relief.mid) : null;
        drawBasemap(bctx, w, h, proj, basemap, theme, s.showBorders, shade, fast);
        lastBaseKey = baseKey;
      }
      const t0 = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => (paintCost = Math.max(30, performance.now() - t0 - 16))));
      const ctx = top.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (drawnOnGpu) drawDecor(ctx, proj, data.basemap, theme, s.showBorders);
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
        fast,
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
    // Smooth zoom: a wheel notch adds to a pending zoom (in log scale) that is eased in over
    // the next frames, instead of jumping the whole step in one frame.
    let zoomPending = 0;
    let zoomAnchor = { x: 0, y: 0 };
    let zoomRaf = 0;
    let zoomLast = 0;
    function zoomTick(t: number) {
      const dt = Math.min(50, t - zoomLast);
      zoomLast = t;
      let step = zoomPending * (1 - Math.exp(-dt / 90));
      if (Math.abs(zoomPending) < 0.003) step = zoomPending;
      zoomPending -= step;
      const before = getState().view;
      const after = zoomAt(before, Math.exp(step), zoomAnchor.x, zoomAnchor.y);
      if (after.k === before.k && Math.abs(step) > 0) zoomPending = 0; // at the zoom limit
      else setState({ view: after });
      zoomRaf = Math.abs(zoomPending) >= 0.003 ? requestAnimationFrame(zoomTick) : 0;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      lastWheelAt = performance.now();
      zoomAnchor = local(e);
      zoomPending = Math.max(-1.5, Math.min(1.5, zoomPending - e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)));
      if (!zoomRaf) {
        zoomLast = performance.now();
        zoomRaf = requestAnimationFrame(zoomTick);
      }
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

    /**
     * Follow a view change by moving the painted canvases. Returns false when the change is
     * too large for that to look right (a jump to another region, a big zoom), in which case
     * the caller repaints immediately.
     */
    let lastWheelAt = -1e9;
    function armSettle() {
      clearTimeout(settleTimer);
      // Wheel notches arrive 100-200 ms apart; wait longer after one so the repaint does not
      // land in the gap and stall the next notch.
      const delay = performance.now() - lastWheelAt < 500 ? 280 : 130;
      settleTimer = setTimeout(() => {
        if (zoomRaf !== 0) {
          armSettle(); // still easing a zoom: repaint when it has finished
          return;
        }
        clearTimeout(throttleTimer);
        throttleTimer = undefined;
        fastNext = false;
        lastBaseKey = ""; // repaint in full even if the view equals the last light paint
        schedule();
      }, delay);
    }

    function viewMoved(v: View): boolean {
      if (!renderedView || w === 0) return false;
      const sc = v.k / renderedView.k;
      const q = makeProjection(w, h, renderedView)([v.lon, v.lat]);
      if (!q || Math.abs(Math.log(sc)) > 0.7 || Math.hypot(q[0] - w / 2, q[1] - h / 2) > 0.8 * Math.min(w, h)) return false;
      base.style.transform = top.style.transform = `matrix(${sc},0,0,${sc},${w / 2 - q[0] * sc},${h / 2 - q[1] * sc})`;
      armSettle();
      if (throttleTimer === undefined) {
        throttleTimer = setTimeout(() => {
          throttleTimer = undefined;
          fastNext = true;
          schedule();
        }, Math.min(2500, Math.max(350, 4 * paintCost)));
      }
      return true;
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
      if (s.view !== prev.view && gpuFor(s.view.k) && gpuFor(prev.view.k)) {
        // GPU map: draw every frame; finish the data layer in full once the view settles.
        lastViewAt = performance.now();
        clearTimeout(gpuSettleTimer);
        gpuSettleTimer = setTimeout(schedule, 170);
        schedule();
      } else if (s.view !== prev.view) {
        const gesture = performance.now() - lastViewAt < 250;
        lastViewAt = performance.now();
        if (!viewMoved(s.view)) {
          // Too far to follow with the old picture. Mid-gesture, repaint lightly and finish in
          // full on settle; a deliberate jump (preset, search) repaints in full at once.
          if (gesture) {
            fastNext = true;
            armSettle();
          }
          schedule();
        }
      }
      if (
        s.time !== prev.time ||
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
      cancelAnimationFrame(zoomRaf);
      clearTimeout(gpuSettleTimer);
      clearTimeout(settleTimer);
      clearTimeout(throttleTimer);
      clearTimeout(settleTimer);
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
      <canvas ref={glRef} className="map-canvas" aria-hidden="true" />
      <canvas ref={baseRef} className="map-canvas" aria-hidden="true" style={{ visibility: "hidden" }} />
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
