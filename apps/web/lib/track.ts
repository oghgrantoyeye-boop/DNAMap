"use client";

// Usage analytics (Vercel Web Analytics). Cookieless; visitor location and referrer
// come from Vercel itself. We add a few named events for what people open. Event
// properties are item ids from our own data (e.g. "yamnaya") and never anything about
// the visitor. Nothing is sent unless Vercel's analytics script is on the page, so
// local runs and other hosts stay silent.

import { track } from "@vercel/analytics";
import { getState, subscribe, type AppState } from "./store";

type Props = Record<string, string | number | boolean>;

function enabled(): boolean {
  return typeof document !== "undefined" && !!document.querySelector('script[src*="/_vercel/insights"]');
}

export function trackEvent(name: string, props?: Props): void {
  if (!enabled()) return;
  try {
    track(name, props);
  } catch {
    // analytics must never break the map
  }
}

/** Watches app state and link clicks; returns a cleanup function. */
export function initTracking(): () => void {
  let prev: AppState = getState();
  const unsub = subscribe(() => {
    const s = getState();
    if (s.selection !== prev.selection) {
      if (s.selection.kind === "population") trackEvent("population_open", { id: s.selection.id });
      else if (s.selection.kind === "sample") trackEvent("sample_open");
    }
    if (s.panel !== prev.panel && s.panel === "evidence" && s.selection.kind === "population") trackEvent("evidence_open", { id: s.selection.id });
    if (s.theme !== prev.theme) trackEvent("map_style", { style: s.theme });
    if (s.playing && !prev.playing) trackEvent("timeline_play");
    if (s.highlightMembers && !prev.highlightMembers) trackEvent("view_samples");
    prev = s;
  });

  // Link clicks, by destination type (delegated, so every link is covered).
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    if (href.includes("/issues/new")) trackEvent("report_problem");
    else if (href.includes("doi.org") || a.closest(".evidence, .claim")) trackEvent("citation_click");
    else if (href.includes("methodology")) trackEvent("nav", { to: "methodology" });
    else if (href.includes("about")) trackEvent("nav", { to: "about" });
  };
  document.addEventListener("click", onClick);
  return () => {
    unsub();
    document.removeEventListener("click", onClick);
  };
}
