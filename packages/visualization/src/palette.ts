import type { Transition } from "@dnamap/data-model";

// Colour = broad transition group (DESIGN.md: one encoding, used consistently on
// map, timeline and panels). Hues are the dataviz reference categorical slots,
// assigned so that groups that co-occur on the map are the most separable pairs
// (checked with the palette validator: farmers/steppe/hunter-gatherers and
// steppe/South Asia pass the normal-vision floor; residual CVD-band pairs are
// mitigated by direct labels — colour is never the only cue).
export const GROUP_COLOR: Record<Transition, string> = {
  archaic: "#6f665c", // neutral ink-brown: a different kind of group, not a hue slot
  "early-eurasians": "#1baf7a",
  "eur-hg": "#1baf7a",
  "near-east": "#eda100",
  neolithic: "#eda100",
  steppe: "#e34948",
  "south-asia": "#4a3aa7",
  "east-asia": "#2a78d6",
  americas: "#eb6834",
  oceania: "#e87ba4",
  africa: "#008300",
};

export const GROUP_LABEL: Record<Transition, string> = {
  archaic: "Archaic humans",
  "early-eurasians": "Early modern humans",
  "eur-hg": "Hunter-gatherers",
  "near-east": "Near East",
  neolithic: "Early farmers",
  steppe: "Steppe",
  "south-asia": "South Asia",
  "east-asia": "East Asia",
  americas: "Americas",
  oceania: "Oceania",
  africa: "Africa",
};

/** Legend entries (merged groups share a colour). */
export const LEGEND: { color: string; label: string; transitions: Transition[] }[] = [
  { color: GROUP_COLOR["eur-hg"], label: "Hunter-gatherers & early modern humans", transitions: ["early-eurasians", "eur-hg"] },
  { color: GROUP_COLOR.neolithic, label: "Near Eastern & European farmers", transitions: ["near-east", "neolithic"] },
  { color: GROUP_COLOR.steppe, label: "Steppe & its expansions", transitions: ["steppe"] },
  { color: GROUP_COLOR["south-asia"], label: "South Asia", transitions: ["south-asia"] },
  { color: GROUP_COLOR["east-asia"], label: "East & Southeast Asia", transitions: ["east-asia"] },
  { color: GROUP_COLOR.oceania, label: "Oceania", transitions: ["oceania"] },
  { color: GROUP_COLOR.americas, label: "Americas", transitions: ["americas"] },
  { color: GROUP_COLOR.africa, label: "Africa", transitions: ["africa"] },
  { color: GROUP_COLOR.archaic, label: "Archaic humans", transitions: ["archaic"] },
];

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
