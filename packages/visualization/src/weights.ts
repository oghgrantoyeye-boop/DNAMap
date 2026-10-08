// Time weighting of dated things (ARCHITECTURE.md "Time filtering").
// A sample's 95% range [start, end] is compared with a window [t − w, t + w].
// The weight combines (a) how much of the possible overlap is realised and
// (b) a penalty for ranges much wider than the window, so a 2,000-year
// contextual date is never as bright as a tight radiocarbon date: date
// uncertainty is shown as faintness, not hidden.

export function overlap(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

/**
 * Opacity weight in [0, 1] for a dated range at time t with half-window w.
 * - 0 if the range does not touch the window.
 * - A narrow range fully inside the window → 1.
 * - A range much wider than the window → proportional to 2w / rangeLength (faint),
 *   floored so very broad dates stay barely visible rather than vanishing.
 */
export function timeWeight(start: number, end: number, t: number, w: number): number {
  const len = Math.max(1, end - start);
  const ov = overlap(start, end + 1, t - w, t + w);
  if (ov <= 0) return 0;
  const coverage = ov / Math.min(len, 2 * w); // how much of what could overlap does
  const sharp = Math.min(1, (2 * w) / len); // penalty for broad ranges
  return Math.min(1, coverage) * (0.25 + 0.75 * sharp);
}
