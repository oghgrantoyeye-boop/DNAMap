"use client";

import { geoGraticule10, geoPath, type GeoProjection } from "d3-geo";
import type { AdmixtureEdge, Relationship } from "@dnamap/data-model";
import { GROUP_COLOR, rgba, timeWeight } from "@dnamap/visualization";
import type { Basemap, Dataset } from "./data";

import type { ThemeId } from "./store";
export type { ThemeId };

export interface MapTheme {
  id: ThemeId;
  name: string;
  dark: boolean;
  page: string; // outside the globe
  ocean: string;
  oceanEdge: string; // vignette colour toward the globe's rim
  land: string;
  coast: string;
  coastWidth: number;
  waterLines: { count: number; gap: number; color: string } | null;
  lake: string;
  river: string;
  riverWidth: number;
  glacier: string;
  graticule: string;
  border: string;
  relief: { blend: GlobalCompositeOperation; alpha: number; gain: number; mid: number } | null;
  paper: { alpha: number } | null;
  neatline: string;
  ink: string; // lines, text
  inkSoft: string;
  unassigned: string; // samples not in a curated population
  halo: string;
  labelFont: (weight: number, size: number) => string;
  field: "wash" | "glow" | "soft";
  sample: "ink" | "ember" | "dot";
  lineColor: string;
}

const SERIF = "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif";
const SANS = "'Inter Variable', Inter, system-ui, sans-serif";

export const THEMES: Record<ThemeId, MapTheme> = {
  engraved: {
    id: "engraved",
    name: "Engraved",
    dark: false,
    page: "#e9e1cf",
    ocean: "#d3dcd6",
    oceanEdge: "#bfcbc4",
    land: "#f3ead6",
    coast: "#4f4334",
    coastWidth: 0.8,
    waterLines: { count: 4, gap: 2.6, color: "rgba(79,98,96,0.42)" },
    lake: "#d3dcd6",
    river: "rgba(84,110,112,0.55)",
    riverWidth: 0.6,
    glacier: "#fbf8f0",
    graticule: "rgba(79,67,52,0.10)",
    border: "rgba(79,67,52,0.4)",
    relief: { blend: "multiply", alpha: 0.7, gain: 2.6, mid: 1.06 },
    paper: { alpha: 0.5 },
    neatline: "#4f4334",
    ink: "#2f271d",
    inkSoft: "#6f604c",
    unassigned: "#a39479",
    halo: "rgba(243,234,214,0.9)",
    labelFont: (w, s) => `italic ${w} ${s + 1.5}px ${SERIF}`,
    field: "wash",
    sample: "ink",
    lineColor: "#3d3226",
  },
  lantern: {
    id: "lantern",
    name: "Lantern",
    dark: true,
    page: "#07090b",
    ocean: "#0d151a",
    oceanEdge: "#070b0e",
    land: "#24211d",
    coast: "#5c5143",
    coastWidth: 0.7,
    waterLines: { count: 3, gap: 3, color: "rgba(120,140,150,0.10)" },
    lake: "#0d151a",
    river: "rgba(70,100,115,0.45)",
    riverWidth: 0.6,
    glacier: "#2d2b28",
    graticule: "rgba(200,190,170,0.035)",
    border: "rgba(200,190,170,0.3)",
    relief: { blend: "overlay", alpha: 0.8, gain: 5, mid: 0.5 },
    paper: { alpha: 0.18 },
    neatline: "#3a352e",
    ink: "#efe3cc",
    inkSoft: "#a8998a",
    unassigned: "#d9c7a6",
    halo: "rgba(13,17,20,0.85)",
    labelFont: (w, s) => `italic ${w} ${s + 1.5}px ${SERIF}`,
    field: "glow",
    sample: "ember",
    lineColor: "#f1e3c8",
  },
  atlas: {
    id: "atlas",
    name: "Clean",
    dark: false,
    page: "#dfe7ea",
    ocean: "#dfe7ea",
    oceanEdge: "#dfe7ea",
    land: "#f6f5f1",
    coast: "#a9b7bd",
    coastWidth: 0.6,
    waterLines: null,
    lake: "#dfe7ea",
    river: "#b9cbd4",
    riverWidth: 0.7,
    glacier: "#ffffff",
    graticule: "rgba(60,80,90,0.07)",
    border: "rgba(80,80,80,0.35)",
    relief: null,
    paper: null,
    neatline: "#a9b7bd",
    ink: "#26323a",
    inkSoft: "#5b666d",
    unassigned: "#5b666d",
    halo: "rgba(246,245,241,0.92)",
    labelFont: (w, s) => `${w} ${s}px ${SANS}`,
    field: "soft",
    sample: "dot",
    lineColor: "#26323a",
  },
};

export interface FrameInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  projection: GeoProjection;
  data: Dataset;
  theme: MapTheme;
  time: number;
  halfWindow: number;
  selectedPop: string | null;
  hoverPop: string | null;
  selectedSample: number | null;
  highlightMembers: boolean;
  showLowConfidence: boolean;
  modelChoice: Record<string, string>;
}

export interface FrameOutput {
  visible: { i: number; x: number; y: number }[];
  labels: { popId: string; x: number; y: number; w: number; h: number }[];
  popWeight: Float32Array;
  sampleW: Float32Array;
  pos: Float32Array;
}

// ---------- paper grain (generated once, deterministic) ----------
let paperCanvas: HTMLCanvasElement | null = null;
function paperPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (!paperCanvas) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const img = g.createImageData(256, 256);
    let seed = 1234567;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 256 * 256; i++) {
      const v = 200 + rnd() * 55;
      img.data[4 * i] = v;
      img.data[4 * i + 1] = v - 3;
      img.data[4 * i + 2] = v - 10;
      img.data[4 * i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.06;
    g.strokeStyle = "#5a4a32";
    for (let k = 0; k < 40; k++) {
      g.beginPath();
      const x = rnd() * 256,
        y = rnd() * 256,
        a = rnd() * Math.PI;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 20 * Math.cos(a + 0.4), y + 20 * Math.sin(a + 0.4), x + 40 * Math.cos(a), y + 40 * Math.sin(a));
      g.lineWidth = 0.6;
      g.stroke();
    }
    paperCanvas = c;
  }
  return ctx.createPattern(paperCanvas, "repeat");
}

export function drawBasemap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  projection: GeoProjection,
  basemap: Basemap,
  theme: MapTheme,
  showBorders: boolean,
  relief: HTMLCanvasElement | null,
): void {
  const path = geoPath(projection, ctx);
  const L = basemap.layers;
  ctx.save();
  ctx.fillStyle = theme.page;
  ctx.fillRect(0, 0, width, height);

  // ocean, darkening gently toward the rim
  ctx.beginPath();
  path({ type: "Sphere" });
  const c = projection([-projection.rotate()[0], 0]) ?? [width / 2, height / 2];
  const R = projection.scale() * 2.7;
  const grad = ctx.createRadialGradient(c[0], c[1], R * 0.15, c[0], c[1], R);
  grad.addColorStop(0, theme.ocean);
  grad.addColorStop(1, theme.oceanEdge);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  path({ type: "Sphere" });
  ctx.clip();

  ctx.beginPath();
  path(geoGraticule10());
  ctx.strokeStyle = theme.graticule;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // engraved water-lines: concentric rings offshore (outermost first)
  if (theme.waterLines) {
    const { count, gap, color } = theme.waterLines;
    ctx.lineJoin = "round";
    for (let i = count; i >= 1; i--) {
      ctx.beginPath();
      path(L.land);
      ctx.lineWidth = 2 * i * gap;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.lineWidth = 2 * i * gap - 1.1;
      ctx.strokeStyle = theme.ocean;
      ctx.stroke();
    }
  }

  ctx.beginPath();
  path(L.land);
  ctx.fillStyle = theme.land;
  ctx.fill();

  if (theme.relief && relief) {
    ctx.save();
    ctx.beginPath();
    path(L.land);
    ctx.clip();
    ctx.globalCompositeOperation = theme.relief.blend;
    ctx.globalAlpha = theme.relief.alpha;
    ctx.drawImage(relief, 0, 0, width, height);
    ctx.restore();
  }

  if (L.glaciers) {
    ctx.beginPath();
    path(L.glaciers);
    ctx.fillStyle = theme.glacier;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (L.lakes) {
    ctx.beginPath();
    path(L.lakes);
    ctx.fillStyle = theme.lake;
    ctx.fill();
    ctx.strokeStyle = theme.coast;
    ctx.lineWidth = theme.coastWidth * 0.6;
    ctx.stroke();
  }
  if (L.rivers) {
    ctx.beginPath();
    path(L.rivers);
    ctx.strokeStyle = theme.river;
    ctx.lineWidth = theme.riverWidth;
    ctx.stroke();
  }
  ctx.beginPath();
  path(L.land);
  ctx.strokeStyle = theme.coast;
  ctx.lineWidth = theme.coastWidth;
  ctx.stroke();

  if (showBorders && L.borders) {
    ctx.beginPath();
    path(L.borders);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore(); // sphere clip

  if (theme.paper) {
    const pat = paperPattern(ctx);
    if (pat) {
      ctx.globalCompositeOperation = theme.dark ? "overlay" : "multiply";
      ctx.globalAlpha = theme.paper.alpha;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  }

  // neatline: a double rule around the globe, like an engraved plate
  ctx.beginPath();
  path({ type: "Sphere" });
  ctx.strokeStyle = theme.neatline;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  if (theme.waterLines) {
    const s0 = projection.scale();
    projection.scale(s0 * 1.012);
    ctx.beginPath();
    geoPath(projection, ctx)({ type: "Sphere" });
    ctx.lineWidth = 0.5;
    ctx.stroke();
    projection.scale(s0);
  }
  ctx.restore();
}

function onScreen(x: number, y: number, w: number, h: number, pad = 40): boolean {
  return x > -pad && y > -pad && x < w + pad && y < h + pad;
}

/** Deterministic per-sample pseudo-random numbers, so organic shapes never flicker. */
function hash(i: number, k: number): number {
  let x = (i * 374761393 + k * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}

export function drawData(f: FrameInput): FrameOutput {
  const { width, height, projection, data, time, halfWindow } = f;
  const S = data.samples;
  const pops = data.ontology.populations;
  const k = projection.scale();
  const popWeight = new Float32Array(pops.length);
  const sampleW = new Float32Array(S.n);
  const pos = new Float32Array(S.n * 2);
  const visible: FrameOutput["visible"] = [];

  const jitter = Math.max(1.6, Math.min(3.2, k / 220));
  for (let i = 0; i < S.n; i++) {
    const w = timeWeight(S.start[i], S.end[i], time, halfWindow);
    if (w <= 0) continue;
    const p = projection([S.lon[i], S.lat[i]]);
    if (!p) continue;
    const r = data.siteRank[i];
    let x = p[0],
      y = p[1];
    if (r > 0) {
      const rad = jitter * Math.sqrt(r);
      const a = r * 2.39996;
      x += rad * Math.cos(a);
      y += rad * Math.sin(a);
    }
    if (!onScreen(x, y, width, height)) continue;
    sampleW[i] = w;
    pos[2 * i] = x;
    pos[2 * i + 1] = y;
    if (S.pop[i] >= 0) popWeight[S.pop[i]] += w;
    visible.push({ i, x, y });
  }

  // Where each population's members are at this moment (weighted by time). Lines
  // start here, so they join the people actually shown rather than a centroid
  // over the population's whole lifetime.
  const live = new Float32Array(pops.length * 2).fill(Number.NaN);
  for (let pi = 0; pi < pops.length; pi++) {
    if (popWeight[pi] <= 0) continue;
    let sx = 0,
      sy = 0,
      sw = 0;
    for (const i of data.members[pi]) {
      const w = sampleW[i];
      if (w <= 0) continue;
      sx += pos[2 * i] * w;
      sy += pos[2 * i + 1] * w;
      sw += w;
    }
    if (sw > 0) {
      live[2 * pi] = sx / sw;
      live[2 * pi + 1] = sy / sw;
    }
  }

  const selectedIdx = f.selectedPop ? (data.popIndex.get(f.selectedPop) ?? -1) : -1;
  drawFields(f, sampleW, pos, popWeight, selectedIdx);
  drawRelationships(f, popWeight, live);
  drawSamples(f, visible, sampleW, pos, selectedIdx);
  const labels = drawLabels(f, popWeight, sampleW, pos);
  return { visible, labels, popWeight, sampleW, pos };
}

function drawFields(f: FrameInput, sampleW: Float32Array, pos: Float32Array, popWeight: Float32Array, selectedIdx: number): void {
  const { ctx, data, theme, projection } = f;
  const pops = data.ontology.populations;
  const k = projection.scale();
  const rPx = Math.max(10, Math.min(60, (180 / 6371) * k));
  ctx.save();
  if (theme.field === "wash") ctx.globalCompositeOperation = "multiply";
  if (theme.field === "glow") ctx.globalCompositeOperation = "lighter";
  for (let pi = 0; pi < pops.length; pi++) {
    if (popWeight[pi] <= 0) continue;
    const col = GROUP_COLOR[pops[pi].transition];
    const emphasis = selectedIdx < 0 ? 1 : pi === selectedIdx ? 1.6 : 0.4;
    for (const i of data.members[pi]) {
      const w = sampleW[i];
      if (w <= 0) continue;
      const x = pos[2 * i],
        y = pos[2 * i + 1];
      if (theme.field === "wash") {
        // watercolour: two irregular translucent blobs per member, multiplied
        for (let b = 0; b < 2; b++) {
          const rr = rPx * (0.55 + 0.45 * hash(i, b));
          const ox = (hash(i, b + 7) - 0.5) * rPx * 0.5,
            oy = (hash(i, b + 13) - 0.5) * rPx * 0.5;
          ctx.beginPath();
          const n = 9;
          for (let v = 0; v <= n; v++) {
            const a = (v / n) * Math.PI * 2;
            const rv = rr * (0.78 + 0.32 * hash(i * 31 + b, v % n));
            const px = x + ox + rv * Math.cos(a),
              py = y + oy + rv * Math.sin(a);
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = rgba(col, Math.min(0.16, 0.07 * w * emphasis));
          ctx.fill();
        }
      } else {
        const g = ctx.createRadialGradient(x, y, 0, x, y, rPx);
        const a = theme.field === "glow" ? Math.min(0.2, 0.09 * w * emphasis) : Math.min(0.32, 0.16 * w * emphasis);
        g.addColorStop(0, rgba(col, a));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - rPx, y - rPx, 2 * rPx, 2 * rPx);
      }
    }
  }
  ctx.restore();
}

function mixToWhite(hex: string, t: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  const m = (c: number) => Math.round(c + (255 - c) * t);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

function drawSamples(f: FrameInput, visibleIn: FrameOutput["visible"], sampleW: Float32Array, pos: Float32Array, selectedIdx: number): void {
  const { ctx, data, theme, projection } = f;
  const S = data.samples;
  const pops = data.ontology.populations;
  const k = projection.scale();
  const rDot = Math.max(1.5, Math.min(3.2, 1.2 + k / 500));
  const colorOf = (i: number) => (S.pop[i] >= 0 ? GROUP_COLOR[pops[S.pop[i]].transition] : theme.unassigned);
  // samples outside any curated population recede: smaller, unstroked, drawn first
  const assigned = (i: number) => S.pop[i] >= 0;
  const visible = [...visibleIn].sort((a, b) => Number(assigned(a.i)) - Number(assigned(b.i)));
  const dimmed = (i: number) => selectedIdx >= 0 && f.highlightMembers && !(S.pop[i] === selectedIdx || (S.popExtra[String(i)] ?? []).includes(selectedIdx));
  ctx.save();
  if (theme.sample === "ember") {
    // embers: an additive halo, then a bright core
    ctx.globalCompositeOperation = "lighter";
    const hr = rDot * 3.2;
    for (const v of visible) {
      const w = sampleW[v.i] * (dimmed(v.i) ? 0.25 : 1);
      const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, hr);
      g.addColorStop(0, rgba(colorOf(v.i), (assigned(v.i) ? 0.28 : 0.1) * w));
      g.addColorStop(1, rgba(colorOf(v.i), 0));
      ctx.fillStyle = g;
      ctx.fillRect(v.x - hr, v.y - hr, 2 * hr, 2 * hr);
    }
    ctx.globalCompositeOperation = "source-over";
    for (const v of visible) {
      const w = sampleW[v.i] * (dimmed(v.i) ? 0.3 : 1);
      ctx.globalAlpha = 0.25 + 0.75 * w;
      ctx.beginPath();
      ctx.arc(v.x, v.y, rDot * (assigned(v.i) ? 0.75 : 0.5), 0, 2 * Math.PI);
      ctx.fillStyle = mixToWhite(colorOf(v.i), 0.45);
      ctx.fill();
      if (!S.usable[v.i]) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, rDot * 0.35, 0, 2 * Math.PI);
        ctx.fillStyle = theme.land;
        ctx.fill();
      }
    }
  } else {
    // ink / dot: crisp dots with a ring that separates overlaps
    for (const v of visible) {
      const w = sampleW[v.i] * (dimmed(v.i) ? 0.35 : 1);
      ctx.globalAlpha = Math.min(1, 0.25 + 0.75 * w);
      ctx.beginPath();
      ctx.arc(v.x, v.y, (assigned(v.i) ? rDot : rDot * 0.7) + 0.8, 0, 2 * Math.PI);
      ctx.fillStyle = theme.halo;
      ctx.fill();
    }
    for (const v of visible) {
      const i = v.i;
      const w = sampleW[i] * (dimmed(i) ? 0.35 : 1);
      ctx.globalAlpha = 0.18 + 0.82 * w;
      ctx.beginPath();
      ctx.arc(v.x, v.y, assigned(i) ? rDot : rDot * 0.7, 0, 2 * Math.PI);
      ctx.fillStyle = colorOf(i);
      ctx.fill();
      if (theme.sample === "ink" && assigned(i)) {
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = theme.ink;
        ctx.stroke();
      }
      if (!S.usable[i]) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, rDot * 0.45, 0, 2 * Math.PI);
        ctx.fillStyle = theme.land;
        ctx.fill();
      }
    }
  }
  if (f.selectedSample !== null && sampleW[f.selectedSample] > 0) {
    const i = f.selectedSample;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    ctx.arc(pos[2 * i], pos[2 * i + 1], rDot + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function anchorXY(f: FrameInput, pi: number, live: Float32Array): [number, number] | null {
  if (!Number.isNaN(live[2 * pi])) return [live[2 * pi], live[2 * pi + 1]];
  const a = f.data.anchors[pi];
  if (!a) return null;
  const p = f.projection([a.lon, a.lat]);
  return p ? [p[0], p[1]] : null;
}

function styleFor(ctx: CanvasRenderingContext2D, confidence: string, timeEstimated: boolean): number {
  // solid = strong evidence, dashed = moderate, faint dotted = proposed/weak
  if (confidence === "high") ctx.setLineDash([]);
  else if (confidence === "medium") ctx.setLineDash([6, 4]);
  else ctx.setLineDash([2, 4]);
  let alpha = confidence === "low" ? 0.35 : 0.85;
  if (!timeEstimated) alpha *= 0.8;
  return alpha;
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, size: number): void {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - size * Math.cos(a - 0.45), y1 - size * Math.sin(a - 0.45));
  ctx.lineTo(x1 - size * Math.cos(a + 0.45), y1 - size * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

function shorten(x0: number, y0: number, x1: number, y1: number, d0: number, d1: number): [number, number, number, number] {
  const L = Math.hypot(x1 - x0, y1 - y0);
  if (L < d0 + d1 + 4) return [x0, y0, x1, y1];
  const ux = (x1 - x0) / L,
    uy = (y1 - y0) / L;
  return [x0 + ux * d0, y0 + uy * d0, x1 - ux * d1, y1 - uy * d1];
}

function drawRelationships(f: FrameInput, popWeight: Float32Array, live: Float32Array): void {
  const { ctx, data, theme, time, width } = f;
  const wide = Math.max(f.halfWindow * 4, 300);
  const sel = f.selectedPop;
  const items: { r: Relationship | AdmixtureEdge; type: string; conf: string; est: boolean }[] = [];
  for (const r of data.ontology.relationships) {
    if (r.confidence === "low" && !f.showLowConfidence) continue;
    if (sel && r.source !== sel && r.target !== sel) continue;
    const active = r.time_range.start - wide <= time && r.time_range.end + wide >= time;
    if (!active && !sel) continue;
    if (!sel && popWeight[data.popIndex.get(r.source)!] <= 0 && popWeight[data.popIndex.get(r.target)!] <= 0) continue;
    items.push({ r, type: r.type, conf: r.confidence, est: r.time_estimated });
  }
  for (const e of data.ontology.admixture_edges) {
    const ev = data.ontology.admixture_events.find((x) => x.id === e.event_id)!;
    const chosen = f.modelChoice[e.event_id] ?? ev.default_model_id ?? ev.models[0].id;
    if (e.model_id !== chosen) continue;
    if (sel && e.source !== sel && e.target !== sel) continue;
    const active = e.time_range.start - wide <= time && e.time_range.end + wide >= time;
    if (!active && !sel) continue;
    if (!sel && popWeight[data.popIndex.get(e.target)!] <= 0) continue;
    items.push({ r: e, type: "admixture", conf: data.popById.get(e.target)!.confidence, est: e.time_estimated });
  }
  const targetsWithAdmixture = new Set<string>();
  ctx.save();
  for (const it of items) {
    const a = anchorXY(f, data.popIndex.get(it.r.source)!, live),
      b = anchorXY(f, data.popIndex.get(it.r.target)!, live);
    if (!a || !b) continue;
    if (Math.abs(a[0] - b[0]) > width * 0.7) continue; // would wrap around the projection edge
    const emph = sel ? 1 : 0.55;
    const alpha = styleFor(ctx, it.conf, it.est) * emph;
    const [x0, y0, x1, y1] = shorten(a[0], a[1], b[0], b[1], 8, 10);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = theme.lineColor;
    ctx.fillStyle = theme.lineColor;
    let lw = 1.2;
    if (it.type === "admixture") {
      const p = (it.r as AdmixtureEdge).proportion;
      lw = p ? 1 + 6 * p.value : 1.6;
      targetsWithAdmixture.add(it.r.target);
    }
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    if (it.type === "continuity") ctx.setLineDash([1, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (it.type === "shared_ancestry") {
      const L = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = (-(y1 - y0) / L) * 3,
        ny = ((x1 - x0) / L) * 3;
      ctx.beginPath();
      ctx.moveTo(x0 + nx, y0 + ny);
      ctx.lineTo(x1 + nx, y1 + ny);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const dir = "direction_supported" in it.r ? it.r.direction_supported : true;
    if (it.type !== "shared_ancestry" && it.type !== "split" && it.type !== "continuity" && dir) drawArrowHead(ctx, x0, y0, x1, y1, 4 + lw);
    if (it.type === "split") {
      ctx.beginPath();
      ctx.arc(x0, y0, 3, 0, 2 * Math.PI);
      ctx.stroke();
    }
    if (it.type === "expansion") {
      for (const t of [0.35, 0.6]) drawArrowHead(ctx, x0, y0, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 5);
    }
  }
  for (const t of targetsWithAdmixture) {
    const b = anchorXY(f, data.popIndex.get(t)!, live);
    if (!b) continue;
    ctx.globalAlpha = sel ? 1 : 0.7;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(b[0], b[1], 6, 0, 2 * Math.PI);
    ctx.fillStyle = theme.halo;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.lineColor;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b[0], b[1], 2.2, 0, 2 * Math.PI);
    ctx.fillStyle = theme.lineColor;
    ctx.fill();
  }
  ctx.restore();
}

function drawLabels(f: FrameInput, popWeight: Float32Array, sampleW: Float32Array, pos: Float32Array): FrameOutput["labels"] {
  const { ctx, data, theme } = f;
  const pops = data.ontology.populations;
  const order = Array.from(popWeight.keys())
    .filter((i) => popWeight[i] > 0.15 || (f.selectedPop && pops[i].id === f.selectedPop))
    .sort((a, b) => {
      const sa = f.selectedPop === pops[a].id ? 1e9 : popWeight[a];
      const sb = f.selectedPop === pops[b].id ? 1e9 : popWeight[b];
      return sb - sa;
    });
  const placed: FrameOutput["labels"] = [];
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (const pi of order) {
    let sx = 0,
      sy = 0,
      sw = 0;
    for (const i of data.members[pi]) {
      const w = sampleW[i];
      if (w <= 0) continue;
      sx += pos[2 * i] * w;
      sy += pos[2 * i + 1] * w;
      sw += w;
    }
    if (sw <= 0) continue;
    const x = sx / sw,
      y = sy / sw - 14;
    const isSel = f.selectedPop === pops[pi].id || f.hoverPop === pops[pi].id;
    const name = shortName(pops[pi].name);
    ctx.font = theme.labelFont(isSel ? 650 : 500, 11.5);
    const w = ctx.measureText(name).width + 8;
    const sparse = pops[pi].stats.sparse;
    const h = sparse ? 28 : 16;
    const box = { popId: pops[pi].id, x: x - w / 2, y: y - 8, w, h };
    if (placed.some((p) => !(box.x + box.w < p.x || p.x + p.w < box.x || box.y + box.h < p.y || p.y + p.h < box.y))) continue;
    if (box.x < 4 || box.y < 4 || box.x + box.w > f.width - 4 || box.y + box.h > f.height - 4) continue;
    placed.push(box);
    ctx.globalAlpha = Math.min(1, 0.6 + popWeight[pi] / 3);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.halo;
    ctx.lineJoin = "round";
    ctx.strokeText(name, x, y);
    ctx.fillStyle = theme.ink;
    ctx.fillText(name, x, y);
    if (sparse) {
      ctx.font = `400 9.5px ${SANS}`;
      ctx.fillStyle = theme.inkSoft;
      ctx.strokeText("sparse evidence", x, y + 13);
      ctx.fillText("sparse evidence", x, y + 13);
    }
  }
  ctx.restore();
  return placed;
}

/** Map labels drop parenthetical qualifiers; the panel shows the full name. */
export function shortName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "");
}
