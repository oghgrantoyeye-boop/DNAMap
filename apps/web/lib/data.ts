"use client";

import type { Manifest, Ontology, Population, SampleDetail, SampleTable } from "@dnamap/data-model";

// Relative by default so the static build works from any sub-path.
/**
 * Prefix for files under public/. Relative by default so the static export can be
 * served from any sub-path; pages one level down (/about/, /methodology/) step up.
 */
export function dataBase(): string {
  if (process.env.NEXT_PUBLIC_BASE_PATH) return `${process.env.NEXT_PUBLIC_BASE_PATH}/`;
  if (typeof window !== "undefined" && /\/(about|methodology)\/?$/.test(window.location.pathname)) return "../";
  return "./";
}

export interface Basemap {
  scale: string;
  layers: Record<string, GeoJSON.FeatureCollection>;
}

export interface Dataset {
  manifest: Manifest;
  samples: SampleTable;
  ontology: Ontology;
  basemap: Basemap;
  // derived indexes
  popById: Map<string, Population>;
  popIndex: Map<string, number>;
  evidenceById: Map<string, Ontology["evidence"][number]>;
  sourceById: Map<string, Ontology["sources"][number]>;
  members: number[][]; // population index → sample indices
  siteRank: Int32Array; // rank of a sample among samples sharing its coordinate
  anchors: ({ lon: number; lat: number } | null)[]; // population index → member centroid
}

export async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${dataBase()}data/${path}`);
  if (!r.ok) throw new Error(`failed to load ${path}: ${r.status}`);
  return (await r.json()) as T;
}

export async function loadDataset(): Promise<Dataset> {
  const [manifest, samples, ontology, basemap] = await Promise.all([
    getJson<Manifest>("manifest.json"),
    getJson<SampleTable>("samples.json"),
    getJson<Ontology>("ontology.json"),
    getJson<Basemap>("basemap-110m.json"),
  ]);
  const popById = new Map(ontology.populations.map((p) => [p.id, p]));
  const popIndex = new Map(ontology.populations.map((p, i) => [p.id, i]));
  const members: number[][] = ontology.populations.map(() => []);
  for (let i = 0; i < samples.n; i++) {
    if (samples.pop[i] >= 0) members[samples.pop[i]].push(i);
  }
  for (const [k, extra] of Object.entries(samples.popExtra)) for (const p of extra) members[p].push(+k);
  const siteCount = new Map<number, number>();
  const siteRank = new Int32Array(samples.n);
  for (let i = 0; i < samples.n; i++) {
    const s = samples.site[i];
    const r = siteCount.get(s) ?? 0;
    siteRank[i] = r;
    siteCount.set(s, r + 1);
  }
  const anchors = ontology.populations.map((p, pi) => {
    const m = members[pi];
    if (m.length === 0) return p.location_hint ? { lon: p.location_hint.lon, lat: p.location_hint.lat } : null;
    return sphericalCentroid(m.map((i) => [samples.lon[i], samples.lat[i]]));
  });
  return {
    manifest,
    samples,
    ontology,
    basemap,
    popById,
    popIndex,
    evidenceById: new Map(ontology.evidence.map((e) => [e.id, e])),
    sourceById: new Map(ontology.sources.map((s) => [s.id, s])),
    members,
    siteRank,
    anchors,
  };
}

export async function loadFineBasemap(): Promise<Basemap> {
  return getJson<Basemap>("basemap-50m.json");
}

const shardCache = new Map<number, Promise<Record<string, SampleDetail>>>();
export function loadSampleDetail(shard: number, id: string): Promise<SampleDetail | undefined> {
  if (!shardCache.has(shard)) {
    shardCache.set(shard, getJson<Record<string, SampleDetail>>(`samples-detail/${String(shard).padStart(2, "0")}.json`));
  }
  return shardCache.get(shard)!.then((d) => d[id]);
}

function sphericalCentroid(pts: [number, number][]): { lon: number; lat: number } {
  let x = 0,
    y = 0,
    z = 0;
  for (const [lon, lat] of pts) {
    const l = (lon * Math.PI) / 180,
      p = (lat * Math.PI) / 180;
    x += Math.cos(p) * Math.cos(l);
    y += Math.cos(p) * Math.sin(l);
    z += Math.sin(p);
  }
  const lon = (Math.atan2(y, x) * 180) / Math.PI;
  const lat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
  return { lon, lat };
}
