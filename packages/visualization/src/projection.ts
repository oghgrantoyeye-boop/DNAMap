import { geoEqualEarth, type GeoProjection } from "d3-geo";

// Equal Earth, rotated so the view's centre longitude is the central meridian
// (ARCHITECTURE.md). View = centre (lon, lat) + zoom factor k.
export interface View {
  lon: number;
  lat: number;
  k: number;
}

export const MIN_K = 0.9;
export const MAX_K = 40;

/** Base scale so that k = 1 fits the whole world into the box. */
export function baseScale(width: number, height: number): number {
  // Equal Earth at scale 1: width ≈ 5.4133, height ≈ 2.6347 (in projected units)
  return Math.min(width / 5.42, height / 2.64) * 0.98;
}

export function makeProjection(width: number, height: number, view: View): GeoProjection {
  const p = geoEqualEarth()
    .rotate([-view.lon, 0])
    .scale(baseScale(width, height) * view.k)
    .translate([width / 2, height / 2])
    .precision(0.3);
  // Shift so that (lon, lat) projects to the box centre.
  const c = p([view.lon, view.lat]);
  if (c) p.translate([width / 2 + (width / 2 - c[0]), height / 2 + (height / 2 - c[1])]);
  return p;
}

export function clampView(v: View): View {
  return {
    lon: ((((v.lon + 180) % 360) + 360) % 360) - 180,
    lat: Math.max(-58, Math.min(72, v.lat)),
    k: Math.max(MIN_K, Math.min(MAX_K, v.k)),
  };
}

/** View that shows `spanDeg` degrees of longitude around a centre, for presets. */
export function viewForSpan(width: number, height: number, center: [number, number], spanDeg: number): View {
  // At k = 1 the full 360° spans about the full width.
  const fullWidthPx = baseScale(width, height) * 5.4133;
  const k = (fullWidthPx / width) * (360 / spanDeg);
  return clampView({ lon: center[0], lat: center[1], k });
}
