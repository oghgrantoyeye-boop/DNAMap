// Display conversion for the astronomical year axis (DATA_MODEL.md §0).
// Stored: 1 CE = 1, 1 BCE = 0, n BCE = 1 − n. Never round stored values; only display.

export const PRESENT_FOR_YEARS_AGO = 2000;

/** Calendar label for an astronomical year, e.g. -2999 → "3000 BCE", 1200 → "1200 CE". */
export function formatYear(year: number, opts: { round?: number } = {}): string {
  const r = opts.round ?? autoRound(year);
  if (year <= 0) {
    const bce = 1 - year;
    return `${group(roundTo(bce, r))} BCE`;
  }
  return `${group(roundTo(year, r))} CE`;
}

/** "years ago" relative to 2000 CE (stated in the UI; not BP, which is 1950-based). */
export function formatYearsAgo(year: number, opts: { round?: number } = {}): string {
  const ago = PRESENT_FOR_YEARS_AGO - year;
  const r = opts.round ?? autoRound(year);
  return `${group(roundTo(ago, r))} years ago`;
}

/** Range label that avoids repeating the era: "3300–2600 BCE", "200 BCE – 100 CE". */
export function formatRange(start: number, end: number, opts: { round?: number } = {}): string {
  if (start === end) return formatYear(start, opts);
  const rs = opts.round ?? autoRound(start);
  const re = opts.round ?? autoRound(end);
  if (start <= 0 && end <= 0) return `${group(roundTo(1 - start, rs))}–${group(roundTo(1 - end, re))} BCE`;
  if (start >= 1 && end >= 1) return `${group(roundTo(start, rs))}–${group(roundTo(end, re))} CE`;
  return `${formatYear(start, { round: rs })} – ${formatYear(end, { round: re })}`;
}

/** Rounding that matches the precision dates typically carry at that depth. */
export function autoRound(year: number): number {
  const ago = PRESENT_FOR_YEARS_AGO - year;
  if (ago > 15000) return 100;
  if (ago > 5000) return 10;
  return 1;
}

export function roundTo(v: number, r: number): number {
  return r <= 1 ? Math.round(v) : Math.round(v / r) * r;
}

function group(n: number): string {
  return n >= 10000 ? n.toLocaleString("en-US") : String(n);
}

export function bpToYear(bp: number): number {
  return Math.round(1950 - bp);
}
