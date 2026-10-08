// Segmented linear time scale (research/chronology/periods.md, ARCHITECTURE.md).
// Each segment maps a span of years linearly onto a share of the width; segment
// boundaries are drawn as visible breaks so the distortion is never hidden.
// When the user zooms into a window, the scale becomes plain linear.

export interface Segment {
  start: number; // astronomical year
  end: number;
  share: number; // fraction of width
  label: string;
}

export const DEFAULT_SEGMENTS: Segment[] = [
  { start: -49999, end: -14999, share: 0.2, label: "Pleistocene" },
  { start: -14999, end: -5999, share: 0.22, label: "Late Glacial to early Holocene" },
  { start: -5999, end: 0, share: 0.38, label: "Farming to antiquity" },
  { start: 0, end: 1500, share: 0.2, label: "First millennium and a half CE" },
];

export interface TimeScale {
  domain: [number, number];
  segmented: boolean;
  segments: Segment[];
  /** year → [0,1] */
  toUnit(year: number): number;
  /** [0,1] → year */
  fromUnit(u: number): number;
  /** years represented by one unit of width around `year` (for adaptive windows) */
  yearsPerUnit(year: number): number;
}

export function segmentedScale(segments: Segment[] = DEFAULT_SEGMENTS): TimeScale {
  const total = segments.reduce((a, s) => a + s.share, 0);
  const segs = segments.map((s) => ({ ...s, share: s.share / total }));
  const offsets: number[] = [];
  let acc = 0;
  for (const s of segs) {
    offsets.push(acc);
    acc += s.share;
  }
  const domain: [number, number] = [segs[0].start, segs[segs.length - 1].end];
  return {
    domain,
    segmented: true,
    segments: segs,
    toUnit(year) {
      if (year <= domain[0]) return 0;
      if (year >= domain[1]) return 1;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (year <= s.end) return offsets[i] + ((year - s.start) / (s.end - s.start)) * s.share;
      }
      return 1;
    },
    fromUnit(u) {
      if (u <= 0) return domain[0];
      if (u >= 1) return domain[1];
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (u <= offsets[i] + s.share) return s.start + ((u - offsets[i]) / s.share) * (s.end - s.start);
      }
      return domain[1];
    },
    yearsPerUnit(year) {
      const s = segs.find((x) => year <= x.end) ?? segs[segs.length - 1];
      return (s.end - s.start) / s.share;
    },
  };
}

export function linearScale(start: number, end: number): TimeScale {
  return {
    domain: [start, end],
    segmented: false,
    segments: [{ start, end, share: 1, label: "" }],
    toUnit: (y) => (y - start) / (end - start),
    fromUnit: (u) => start + u * (end - start),
    yearsPerUnit: () => end - start,
  };
}

/**
 * Tick years for a scale, chosen per segment so each segment gets readable ticks.
 * Ticks fall on round *calendar* years (e.g. 45,000 BCE = astronomical −44,999),
 * so labels read naturally.
 */
export function ticksFor(scale: TimeScale, widthPx: number): number[] {
  const toCal = (a: number) => (a <= 0 ? a - 1 : a); // 0 → −1 (1 BCE)
  const toAstro = (c: number) => (c < 0 ? c + 1 : c);
  const out: number[] = [];
  for (const s of scale.segments) {
    const px = s.share * widthPx;
    const n = Math.max(1, Math.floor(px / 70));
    const c0 = toCal(s.start),
      c1 = toCal(s.end);
    const step = niceStep((c1 - c0) / n);
    const first = Math.ceil(c0 / step) * step;
    for (let c = first; c < c1; c += step) out.push(toAstro(c === 0 ? 1 : c));
  }
  return Array.from(new Set(out)).filter((y) => y >= scale.domain[0] && y <= scale.domain[1]);
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}
