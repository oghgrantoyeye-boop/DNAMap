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

// ---- remembered map style (this browser only; a convenience, safe to lose) ----
const THEME_KEY = "mapofus.theme";
export function storedTheme(): ThemeId | null {
  try {
    const t = window.localStorage.getItem(THEME_KEY);
    return t && (THEME_IDS as string[]).includes(t) ? (t as ThemeId) : null;
  } catch {
    return null;
  }
}
function rememberTheme(t: ThemeId): void {
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    // storage may be blocked; the style still applies for this visit
  }
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
  if (theme && (THEME_IDS as string[]).includes(theme)) {
    out.theme = theme as ThemeId;
    rememberTheme(out.theme);
  } else {
    const st = storedTheme();
    if (st) out.theme = st;
  }
  return out;
}

let urlTimer: ReturnType<typeof setTimeout> | null = null;
export function writeUrlState(s: AppState): void {
  if (typeof window === "undefined") return;
  rememberTheme(s.theme);
  if (urlTimer) clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const q = new URLSearchParams(window.location.search);
    q.set("t", String(Math.round(s.time)));
    q.set("v", `${s.view.lon.toFixed(1)},${s.view.lat.toFixed(1)},${s.view.k.toFixed(2)}`);
    if (s.theme !== initial.theme) q.set("theme", s.theme);
    else q.delete("theme");
    if (s.selection.kind === "population") q.set("pop", s.selection.id);
    else q.delete("pop");
    try {
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
    } catch {
      // sandboxed hosts may refuse history updates; the view still works without them
    }
  }, 250);
}
