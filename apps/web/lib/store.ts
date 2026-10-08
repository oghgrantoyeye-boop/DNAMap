"use client";

import { useSyncExternalStore } from "react";
import type { View } from "@dnamap/visualization";

export type ThemeId = "engraved" | "lantern" | "atlas";
export const THEME_IDS: ThemeId[] = ["engraved", "lantern", "atlas"];

export type Selection =
  | { kind: "none" }
  | { kind: "population"; id: string }
  | { kind: "sample"; index: number }
  | { kind: "relationship"; id: string }
  | { kind: "event"; id: string };

export type PanelView = "details" | "evidence";

export interface AppState {
  time: number; // astronomical year at the cursor
  zoomWindow: [number, number] | null; // timeline zoom (linear) or null for segmented overview
  view: View;
  selection: Selection;
  panel: PanelView;
  playing: boolean;
  hoverSample: number | null;
  hoverPopulation: string | null;
  showBorders: boolean;
  showLowConfidence: boolean;
  highlightMembers: boolean;
  modelChoice: Record<string, string>; // admixture event id → model id
  theme: ThemeId;
  lens: { lon: number; lat: number } | null; // strata lens centre, or off
}

type Listener = () => void;

const initial: AppState = {
  time: -2999,
  zoomWindow: null,
  view: { lon: 35, lat: 28, k: 1.25 },
  selection: { kind: "none" },
  panel: "details",
  playing: false,
  hoverSample: null,
  hoverPopulation: null,
  showBorders: false,
  showLowConfidence: false,
  highlightMembers: false,
  modelChoice: {},
  theme: "engraved",
  lens: null,
};

let state: AppState = initial;
const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(initial));
}

// ---- URL state (shareable views; back button) ----
export function readUrlState(): Partial<AppState> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Partial<AppState> = {};
  const t = q.get("t");
  if (t && !Number.isNaN(+t)) out.time = +t;
  const v = q.get("v");
  if (v) {
    const [lon, lat, k] = v.split(",").map(Number);
    if ([lon, lat, k].every((x) => Number.isFinite(x))) out.view = { lon, lat, k };
  }
  const pop = q.get("pop");
  if (pop) out.selection = { kind: "population", id: pop };
  const theme = q.get("theme");
  if (theme && (THEME_IDS as string[]).includes(theme)) out.theme = theme as ThemeId;
  const lens = q.get("lens");
  if (lens) {
    const [lon, lat] = lens.split(",").map(Number);
    if (Number.isFinite(lon) && Number.isFinite(lat)) out.lens = { lon, lat };
  }
  return out;
}

let urlTimer: ReturnType<typeof setTimeout> | null = null;
export function writeUrlState(s: AppState): void {
  if (typeof window === "undefined") return;
  if (urlTimer) clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const q = new URLSearchParams(window.location.search);
    q.set("t", String(Math.round(s.time)));
    q.set("v", `${s.view.lon.toFixed(1)},${s.view.lat.toFixed(1)},${s.view.k.toFixed(2)}`);
    if (s.lens) q.set("lens", `${s.lens.lon.toFixed(2)},${s.lens.lat.toFixed(2)}`);
    else q.delete("lens");
    if (s.theme !== initial.theme) q.set("theme", s.theme);
    else q.delete("theme");
    if (s.selection.kind === "population") q.set("pop", s.selection.id);
    else q.delete("pop");
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  }, 250);
}
