import { linearScale, segmentedScale, type TimeScale } from "@dnamap/visualization";
import type { AppState } from "./store";

export const OVERVIEW = segmentedScale();

export function scaleFor(s: Pick<AppState, "zoomWindow">): TimeScale {
  return s.zoomWindow ? linearScale(s.zoomWindow[0], s.zoomWindow[1]) : OVERVIEW;
}

/**
 * Half-width of the time window used to weight samples. It adapts to the
 * timeline's local resolution (≈1.5% of the width's worth of years at the
 * cursor), so the map shows "what is resolvable at this zoom", not a fixed slice.
 */
export function halfWindowFor(s: Pick<AppState, "zoomWindow" | "time">): number {
  const sc = scaleFor(s);
  return Math.max(10, sc.yearsPerUnit(s.time) * 0.015);
}
