// "From bone to genome": a procedural 3D lab-bench diorama for the extraction page.
//
// Ten stations stand on round plinths along a gently winding bench. The camera travels between
// them and a depth-of-field pass keeps only the current station sharp (after Plane of Focus).
// Each station is a small animated model built in code (after the procedural dioramas of
// Invisible Cities). Everything here is illustration, not to scale; the facts shown next to it
// come from cited sources (data/curated/extraction.json).
//
// Loaded only on /extraction/ (dynamic import), so three.js never reaches the map page.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export interface Palette {
  dark: boolean;
  bg: string;
  fog: string;
  table: string;
  plinth: string;
  ink: string;
  bone: string;
  sediment: [string, string, string];
  glass: string;
  accent: string;
  bases: { A: string; C: string; G: string; T: string };
  damage: string;
  adapter: string;
  index: string;
  microbe: string;
  human: string;
  uv: string;
  land: string;
  ocean: string;
}

// Base colours follow the site's validated categorical palette.
export const PALETTES: Record<"light" | "dark", Palette> = {
  light: {
    dark: false,
    bg: "#efe7d4",
    fog: "#efe7d4",
    table: "#e2d6bc",
    plinth: "#d6c9ad",
    ink: "#3a3024",
    bone: "#f1e6cc",
    sediment: ["#b8a07a", "#9f8762", "#c9b28c"],
    glass: "#cfe0dc",
    accent: "#2f5f62",
    bases: { A: "#2a78d6", C: "#e34948", G: "#eda100", T: "#1baf7a" },
    damage: "#ffd23f",
    adapter: "#4a3aa7",
    index: "#e87ba4",
    microbe: "#8f9b6e",
    human: "#eb6834",
    uv: "#7b5cff",
    land: "#e8dcc0",
    ocean: "#b9cbc8",
  },
  dark: {
    dark: true,
    bg: "#0a0c0e",
    fog: "#0a0c0e",
    table: "#16191c",
    plinth: "#1f2326",
    ink: "#efe3cc",
    bone: "#dccfb4",
    sediment: ["#4a3f31", "#3b3227", "#574a39"],
    glass: "#7d9ea3",
    accent: "#e6b566",
    bases: { A: "#4f93e8", C: "#f0605e", G: "#f6b52a", T: "#2fd08f" },
    damage: "#ffe066",
    adapter: "#8a7cf0",
    index: "#f39ac0",
    microbe: "#a3b37a",
    human: "#ff8a52",
    uv: "#9d85ff",
    land: "#3a352d",
    ocean: "#101a20",
  },
};

export interface SceneApi {
  goTo(index: number, instant?: boolean): void;
  setExploded(on: boolean): void;
  onPick: ((index: number) => void) | null;
  resize(): void;
  dispose(): void;
}

// ---------- small helpers ----------

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

type Station = {
  group: THREE.Group;
  /** Animate; `active` is true for the station in focus, `explode` eases 0..1. */
  update: (t: number, dt: number, active: boolean, explode: number) => void;
  explodable: boolean;
};

interface Kit {
  p: Palette;
  std: (color: string, o?: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  glassMat: () => THREE.MeshStandardMaterial;
  track: <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T) => T;
}

function makeKit(p: Palette, disposables: { dispose(): void }[]): Kit {
  const track = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };
  return {
    p,
    track: track as Kit["track"],
    std: (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...o })),
    glassMat: () =>
      track(
        new THREE.MeshStandardMaterial({
          color: p.glass,
          roughness: 0.08,
          metalness: 0,
          transparent: true,
          opacity: p.dark ? 0.2 : 0.28,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      ),
  };
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, k: Kit, shadow = true): THREE.Mesh {
  const m = new THREE.Mesh(k.track(geo), mat);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

/** A rough rock-like bone: an icosphere with deterministic bumps. */
function boneGeometry(seed: number, sx: number, sy: number, sz: number): THREE.BufferGeometry {
  // merge shared vertices so the surface shades smoothly instead of as facets
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 4).deleteAttribute("normal").deleteAttribute("uv"));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const r = rng(seed);
  const bumps = Array.from({ length: 7 }, () => new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize());
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let d = 1;
    for (const b of bumps) d += 0.12 * Math.max(0, v.dot(b)) ** 3;
    d += 0.03 * Math.sin(v.x * 9 + v.y * 7) * Math.cos(v.z * 8);
    v.multiplyScalar(d);
    pos.setXYZ(i, v.x * sx, v.y * sy, v.z * sz);
  }
  g.computeVertexNormals();
  return g;
}

/** A molar-like tooth: lathed crown on two tapering roots. */
function tooth(k: Kit): THREE.Group {
  const g = new THREE.Group();
  const prof = [
    [0, 0.62],
    [0.22, 0.6],
    [0.34, 0.5],
    [0.38, 0.3],
    [0.33, 0.12],
    [0.3, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const crown = mesh(new THREE.LatheGeometry(prof, 28), k.std(k.p.bone, { roughness: 0.45 }), k);
  g.add(crown);
  for (const dx of [-0.13, 0.13]) {
    const root = mesh(new THREE.ConeGeometry(0.12, 0.55, 14), k.std(k.p.bone, { roughness: 0.7 }), k);
    root.rotation.z = Math.PI + dx * 0.9;
    root.position.set(dx, -0.25, 0);
    g.add(root);
  }
  return g;
}

/** A lab tube: open glass cylinder with a rounded bottom. */
function tube(k: Kit, h = 1.2, r = 0.22): THREE.Group {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(r, r, h, 28, 1, true), k.glassMat(), k, false);
  body.position.y = h / 2;
  const bottom = mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), k.glassMat(), k, false);
  g.add(body, bottom);
  const rim = mesh(new THREE.TorusGeometry(r, 0.015, 8, 32), k.std(k.p.ink, { roughness: 0.4 }), k, false);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  g.add(rim);
  return g;
}

// ---------- DNA ----------

const BASES = ["A", "C", "G", "T"] as const;
const PAIR: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
const RISE = 0.11;
const TWIST = (Math.PI * 2) / 10.5;
const HELIX_R = 0.3;

/**
 * A short double-helix segment of `n` base pairs centred on the origin along x.
 * Ends can be marked as damaged: cytosines at the first and last two positions get the
 * damage colour (deamination, read later as C-to-T).
 */
function helix(k: Kit, n: number, seed: number, markEnds: boolean): THREE.Group {
  const g = new THREE.Group();
  const r = rng(seed);
  const seq = Array.from({ length: n }, () => BASES[Math.floor(r() * 4)]);
  const x0 = (-(n - 1) * RISE) / 2;
  const strand = (phase: number) =>
    new THREE.CatmullRomCurve3(
      Array.from({ length: n }, (_, i) => {
        const a = i * TWIST + phase;
        return new THREE.Vector3(x0 + i * RISE, HELIX_R * Math.cos(a), HELIX_R * Math.sin(a));
      }),
    );
  for (const phase of [0, Math.PI * 0.8]) {
    g.add(mesh(new THREE.TubeGeometry(strand(phase), Math.max(8, n * 4), 0.035, 6), k.std(k.p.ink, { roughness: 0.35 }), k, false));
  }
  const rung = k.track(new THREE.CylinderGeometry(0.022, 0.022, 1, 6));
  const inst = new THREE.InstancedMesh(rung, k.std("#ffffff", { roughness: 0.5 }), n * 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a1 = i * TWIST,
      a2 = a1 + Math.PI * 0.8;
    const p1 = new THREE.Vector3(x0 + i * RISE, HELIX_R * Math.cos(a1), HELIX_R * Math.sin(a1));
    const p2 = new THREE.Vector3(x0 + i * RISE, HELIX_R * Math.cos(a2), HELIX_R * Math.sin(a2));
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    for (const [j, from, base] of [
      [0, p1, seq[i]],
      [1, p2, PAIR[seq[i]]],
    ] as const) {
      const dir = mid.clone().sub(from);
      q.setFromUnitVectors(up, dir.clone().normalize());
      m.compose(from.clone().add(mid).multiplyScalar(0.5), q, new THREE.Vector3(1, dir.length(), 1));
      inst.setMatrixAt(i * 2 + j, m);
      const damaged = markEnds && (i < 2 || i >= n - 2) && base === "C";
      inst.setColorAt(i * 2 + j, col.set(damaged ? k.p.damage : k.p.bases[base as keyof Palette["bases"]]));
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);
  return g;
}

/** A simplified molecule (for crowds): a short rod coloured by its source. */
function rodGeometry(k: Kit): THREE.BufferGeometry {
  return k.track(new THREE.CapsuleGeometry(0.035, 0.32, 4, 8).rotateZ(Math.PI / 2));
}

// ---------- stations ----------

function stationRemains(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  for (let i = 0; i < 3; i++) {
    const layer = mesh(new THREE.CylinderGeometry(1.95 - i * 0.05, 1.95 - i * 0.05, 0.2, 48), k.std(p.sediment[i], { roughness: 0.95 }), k);
    layer.position.y = 0.1 + i * 0.2;
    layer.rotation.y = i * 0.6;
    g.add(layer);
  }
  const boneMat = k.std(p.bone, { roughness: 0.82, transparent: true, opacity: 1 });
  // a long bone lying in the ground, so the scene reads as a burial
  const longBone = new THREE.Group();
  const shaft = mesh(new THREE.CapsuleGeometry(0.11, 1.7, 6, 16).rotateZ(Math.PI / 2), k.std(p.bone, { roughness: 0.85 }), k);
  longBone.add(shaft);
  for (const x of [-0.95, 0.95])
    for (const z of [-0.09, 0.09]) {
      const knob = mesh(new THREE.SphereGeometry(0.15, 16, 12), k.std(p.bone, { roughness: 0.85 }), k);
      knob.position.set(x, 0, z);
      longBone.add(knob);
    }
  longBone.position.set(-0.2, 0.68, 0.75);
  longBone.rotation.y = 0.35;
  g.add(longBone);
  // the dense petrous piece, where DNA survives best
  const petrous = mesh(boneGeometry(11, 0.62, 0.34, 0.42), boneMat, k);
  petrous.position.set(-0.55, 0.78, -0.45);
  petrous.rotation.set(0.15, 0.7, -0.2);
  const core = mesh(new THREE.SphereGeometry(0.15, 20, 14), k.std(p.accent, { emissive: p.accent, emissiveIntensity: p.dark ? 1.4 : 0.5 }), k, false);
  core.position.copy(petrous.position).add(new THREE.Vector3(0.05, 0.02, 0));
  core.visible = false;
  const t = tooth(k);
  t.position.set(0.95, 0.74, -0.25);
  t.rotation.set(-0.25, 0.4, 0.35);
  t.scale.setScalar(0.9);
  g.add(petrous, core, t);
  // microbes: most DNA in buried bone is not human
  const N = 110;
  const r = rng(7);
  const mic = new THREE.InstancedMesh(k.track(new THREE.SphereGeometry(0.02, 6, 4)), k.std(p.microbe, { emissive: p.microbe, emissiveIntensity: p.dark ? 0.6 : 0.1 }), N);
  const base = Array.from({ length: N }, () => {
    const a = r() * Math.PI * 2,
      d = 0.3 + r() * 1.5;
    return new THREE.Vector3(Math.cos(a) * d, 0.62 + r() * 0.45, Math.sin(a) * d);
  });
  g.add(mic);
  const m4 = new THREE.Matrix4();
  return {
    group: g,
    explodable: true,
    update(time, _dt, _active, e) {
      for (let i = 0; i < N; i++) {
        const b = base[i];
        m4.makeTranslation(b.x * (1 + 0.25 * e), b.y + 0.04 * Math.sin(time * 1.3 + i) + 0.4 * e * ((i % 5) / 5), b.z * (1 + 0.25 * e));
        mic.setMatrixAt(i, m4);
      }
      mic.instanceMatrix.needsUpdate = true;
      boneMat.opacity = 1 - 0.65 * e;
      boneMat.depthWrite = e < 0.5;
      core.visible = e > 0.05;
      core.scale.setScalar(0.6 + 0.4 * e + 0.05 * Math.sin(time * 3));
    },
  };
}

function stationCleanRoom(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  const bench = mesh(new THREE.BoxGeometry(2.2, 0.12, 1.1), k.std(p.table, { roughness: 0.6 }), k);
  bench.position.y = 0.75;
  for (const [x, z] of [
    [-0.95, -0.45],
    [0.95, -0.45],
    [-0.95, 0.45],
    [0.95, 0.45],
  ]) {
    const leg = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), k.std(p.ink, { roughness: 0.5 }), k);
    leg.position.set(x, 0.38, z);
    g.add(leg);
  }
  g.add(bench);
  for (let i = 0; i < 4; i++) {
    const tb = tube(k, 0.4, 0.07);
    tb.position.set(-0.5 + i * 0.3, 0.82, 0.1);
    g.add(tb);
  }
  const room = new THREE.Group();
  const box = mesh(new THREE.BoxGeometry(3.0, 2.0, 2.2), k.glassMat(), k, false);
  box.position.y = 1.0;
  const edges = new THREE.LineSegments(k.track(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.0, 2.0, 2.2))), k.track(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.55 })));
  edges.position.y = 1.0;
  const lamp = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 12), k.std(p.uv, { emissive: p.uv, emissiveIntensity: 1.6 }), k, false);
  lamp.rotation.z = Math.PI / 2;
  lamp.position.set(0, 1.85, -0.6);
  const uvLight = new THREE.PointLight(p.uv, p.dark ? 6 : 3, 4);
  uvLight.position.set(0, 1.6, -0.4);
  room.add(box, edges, lamp, uvLight);
  g.add(room);
  // air leaving the room: positive pressure keeps outside air (and its DNA) out
  const N = 90;
  const r = rng(3);
  const seeds = Array.from({ length: N }, () => ({ dir: new THREE.Vector3(r() - 0.5, (r() - 0.3) * 0.5, r() - 0.5).normalize(), ph: r() }));
  const air = new THREE.InstancedMesh(k.track(new THREE.SphereGeometry(0.025, 6, 4)), k.std(p.accent, { emissive: p.accent, emissiveIntensity: p.dark ? 1 : 0.3, transparent: true, opacity: 0.8 }), N);
  g.add(air);
  const m4 = new THREE.Matrix4();
  return {
    group: g,
    explodable: true,
    update(time, _dt, _active, e) {
      for (let i = 0; i < N; i++) {
        const f = (time * 0.25 + seeds[i].ph) % 1;
        const d = 0.2 + f * 2.2;
        const v = seeds[i].dir;
        m4.makeTranslation(v.x * d * 1.3, 1.0 + v.y * d, v.z * d);
        air.setMatrixAt(i, m4);
      }
      air.instanceMatrix.needsUpdate = true;
      room.position.y = 1.6 * e;
    },
  };
}

function stationSampling(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  const stand = mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.35, 32), k.std(p.ink, { roughness: 0.5, metalness: 0.2 }), k);
  stand.position.y = 0.18;
  const bone = mesh(boneGeometry(5, 0.7, 0.45, 0.5), k.std(p.bone, { roughness: 0.8 }), k);
  bone.position.set(0, 0.68, 0);
  bone.rotation.set(0.1, 0.5, 0.1);
  g.add(stand, bone);
  const drill = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 24), k.std(p.accent, { roughness: 0.4, metalness: 0.3 }), k);
  body.position.y = 0.75;
  const helixPts = Array.from({ length: 60 }, (_, i) => new THREE.Vector3(0.035 * Math.cos(i * 0.6), -i * 0.009, 0.035 * Math.sin(i * 0.6)));
  const bit = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 120, 0.018, 6), k.std("#b9b9b9", { roughness: 0.25, metalness: 0.9 }), k);
  bit.position.y = 0.3;
  drill.add(body, bit);
  drill.position.set(0.05, 0.75, 0.0);
  g.add(drill);
  const dish = mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.08, 32, 1, true), k.glassMat(), k, false);
  dish.position.set(1.15, 0.05, 0.35);
  const pile = mesh(new THREE.ConeGeometry(0.22, 0.09, 24), k.std(p.bone, { roughness: 1 }), k);
  pile.position.set(1.15, 0.06, 0.35);
  g.add(dish, pile);
  const N = 70;
  const r = rng(9);
  const ph = Array.from({ length: N }, () => r());
  const grains = new THREE.InstancedMesh(k.track(new THREE.SphereGeometry(0.018, 5, 4)), k.std(p.bone, { roughness: 1 }), N);
  g.add(grains);
  const m4 = new THREE.Matrix4();
  const from = new THREE.Vector3(0.05, 0.95, 0),
    to = new THREE.Vector3(1.15, 0.12, 0.35);
  return {
    group: g,
    explodable: false,
    update(time) {
      bit.rotation.y = time * 18;
      drill.position.y = 0.72 + 0.06 * Math.sin(time * 1.5);
      for (let i = 0; i < N; i++) {
        const f = (time * 0.5 + ph[i]) % 1;
        const x = from.x + (to.x - from.x) * f + (ph[i] - 0.5) * 0.15;
        const z = from.z + (to.z - from.z) * f + (((i * 7) % 10) / 10 - 0.5) * 0.12;
        const y = from.y + (to.y - from.y) * f + 0.5 * Math.sin(Math.PI * f) * 0.6;
        m4.makeTranslation(x, y, z);
        grains.setMatrixAt(i, m4);
      }
      grains.instanceMatrix.needsUpdate = true;
      pile.scale.y = 0.8 + 0.2 * Math.sin(time * 0.5);
    },
  };
}

function stationExtraction(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  // tube 1: bone powder dissolving
  const t1 = tube(k, 1.4, 0.3);
  t1.position.set(-0.7, 0.05, 0);
  const liquid = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 24), k.std(p.dark ? "#6b5a32" : "#e6c98a", { transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false }), k, false);
  liquid.position.set(-0.7, 0.5, 0);
  g.add(t1, liquid);
  const N = 40;
  const r = rng(21);
  const gp = Array.from({ length: N }, () => new THREE.Vector3(-0.7 + (r() - 0.5) * 0.4, 0.15 + r() * 0.75, (r() - 0.5) * 0.4));
  const ph = Array.from({ length: N }, () => r());
  const grains = new THREE.InstancedMesh(k.track(new THREE.DodecahedronGeometry(0.035)), k.std(p.bone, { roughness: 1 }), N);
  g.add(grains);
  // spin column: silica membrane holds the DNA, everything else passes through
  const t2 = tube(k, 1.6, 0.32);
  t2.position.set(0.75, 0.05, 0);
  const silica = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 32), k.std(p.dark ? "#d9d4c4" : "#ffffff", { roughness: 0.9 }), k);
  silica.position.set(0.75, 0.75, 0);
  g.add(t2, silica);
  const M = 16;
  const dna = new THREE.InstancedMesh(rodGeometry(k), k.std(p.human, { emissive: p.human, emissiveIntensity: p.dark ? 1.2 : 0.35 }), M);
  const junk = new THREE.InstancedMesh(k.track(new THREE.SphereGeometry(0.03, 6, 4)), k.std(p.microbe), M);
  g.add(dna, junk);
  const dph = Array.from({ length: M }, () => r());
  const doff = Array.from({ length: M }, () => new THREE.Vector2((r() - 0.5) * 0.4, (r() - 0.5) * 0.4));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  return {
    group: g,
    explodable: false,
    update(time) {
      for (let i = 0; i < N; i++) {
        const s = 1 - ((time * 0.15 + ph[i]) % 1); // shrinking as the bone mineral dissolves
        m4.compose(gp[i], q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), time + i), new THREE.Vector3(s, s, s));
        grains.setMatrixAt(i, m4);
      }
      grains.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < M; i++) {
        const f = (time * 0.22 + dph[i]) % 1;
        const y = Math.max(0.8 + (i % 4) * 0.03, 1.55 - f * 1.1); // DNA settles on the membrane
        m4.compose(new THREE.Vector3(0.75 + doff[i].x * 0.6, y, doff[i].y * 0.6), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.3), new THREE.Vector3(1, 1, 1));
        dna.setMatrixAt(i, m4);
        const jy = 1.55 - ((time * 0.35 + dph[i]) % 1) * 1.45; // the rest passes through
        m4.makeTranslation(0.75 + doff[i].y * 0.55, jy, doff[i].x * 0.55);
        junk.setMatrixAt(i, m4);
      }
      dna.instanceMatrix.needsUpdate = true;
      junk.instanceMatrix.needsUpdate = true;
    },
  };
}

function stationDamage(k: Kit): Station {
  const g = new THREE.Group();
  const lengths = [9, 13, 7, 11, 8, 12];
  const pieces: { grp: THREE.Group; home: THREE.Vector3; drift: THREE.Vector3; spin: number }[] = [];
  let x = 0;
  const total = lengths.reduce((a, b) => a + b, 0) * RISE;
  const r = rng(31);
  lengths.forEach((n, i) => {
    const h = helix(k, n, 100 + i, true);
    const w = n * RISE;
    const home = new THREE.Vector3(-total / 2 + x + w / 2, 1.05, 0);
    x += w;
    h.position.copy(home);
    pieces.push({ grp: h, home, drift: new THREE.Vector3((r() - 0.5) * 0.6, (r() - 0.5) * 0.9, (r() - 0.5) * 1.6), spin: (r() - 0.5) * 1.5 });
    g.add(h);
  });
  return {
    group: g,
    explodable: true,
    update(time, _dt, _active, e) {
      for (const [i, pc] of pieces.entries()) {
        const gap = (i - (pieces.length - 1) / 2) * 0.35 * e;
        pc.grp.position.set(pc.home.x + gap + pc.drift.x * e, pc.home.y + pc.drift.y * e + 0.03 * Math.sin(time + i), pc.home.z + pc.drift.z * e);
        pc.grp.rotation.x = time * 0.35 + pc.spin * e * 2;
        pc.grp.rotation.z = pc.spin * 0.4 * e;
      }
    },
  };
}

function stationLibrary(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  const items: { core: THREE.Group; a1: THREE.Mesh; a2: THREE.Mesh; tag: THREE.Mesh; y: number; len: number }[] = [];
  const adapterGeo = k.track(new THREE.BoxGeometry(0.34, 0.3, 0.3));
  const tagGeo = k.track(new THREE.BoxGeometry(0.1, 0.32, 0.32));
  [7, 10, 8].forEach((n, i) => {
    const core = helix(k, n, 300 + i, true);
    const y = 0.55 + i * 0.6;
    core.position.y = y;
    const a1 = new THREE.Mesh(adapterGeo, k.std(p.adapter, { roughness: 0.45 }));
    const a2 = new THREE.Mesh(adapterGeo, k.std(p.adapter, { roughness: 0.45 }));
    const tag = new THREE.Mesh(tagGeo, k.std(p.index, { roughness: 0.45, emissive: p.index, emissiveIntensity: p.dark ? 0.6 : 0.1 }));
    for (const m of [a1, a2, tag]) m.castShadow = true;
    g.add(core, a1, a2, tag);
    items.push({ core, a1, a2, tag, y, len: n * RISE });
  });
  return {
    group: g,
    explodable: true,
    update(time, _dt, _active, e) {
      items.forEach((it, i) => {
        // adapters slide on and lock to both ends; the exploded view pulls the parts apart
        const cyc = (time * 0.3 + i * 0.27) % 1;
        const attach = e > 0.01 ? 1 - e : clamp01(cyc * 2.2);
        const off = it.len / 2 + 0.17 + (1 - attach) * 0.9;
        it.a1.position.set(-off, it.y, 0);
        it.a2.position.set(off, it.y, 0);
        it.tag.position.set(off + 0.22 + (1 - attach) * 0.15, it.y, 0);
        it.core.rotation.x = time * 0.4 + i;
      });
    },
  };
}

function stationEnrichment(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  const dish = mesh(new THREE.CylinderGeometry(1.6, 1.5, 0.18, 48, 1, true), k.glassMat(), k, false);
  dish.position.y = 0.12;
  const floor = mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.02, 48), k.glassMat(), k, false);
  floor.position.y = 0.04;
  g.add(dish, floor);
  const beads = Array.from({ length: 3 }, (_, i) => {
    const b = mesh(new THREE.SphereGeometry(0.2, 24, 16), k.std(p.dark ? "#5a5f66" : "#3b3f45", { metalness: 0.7, roughness: 0.3 }), k);
    const ang = (i / 3) * Math.PI * 2;
    b.userData.home = new THREE.Vector3(Math.cos(ang) * 0.55, 0.45, Math.sin(ang) * 0.55);
    // probe "hairs"
    for (let j = 0; j < 14; j++) {
      const hair = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4)), k.std(p.accent));
      const v = new THREE.Vector3(Math.sin(j * 2.4), Math.cos(j * 1.7), Math.sin(j * 3.1)).normalize();
      hair.position.copy(v.clone().multiplyScalar(0.27));
      hair.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
      b.add(hair);
    }
    g.add(b);
    return b;
  });
  const magnet = mesh(new THREE.TorusGeometry(0.35, 0.12, 12, 24, Math.PI), k.std("#c0392b", { roughness: 0.4, metalness: 0.4 }), k);
  magnet.position.set(1.95, 0.55, 0);
  magnet.rotation.z = -Math.PI / 2;
  g.add(magnet);
  const N = 60;
  const r = rng(41);
  const rods = Array.from({ length: N }, (_, i) => ({ human: i % 4 === 0, pos: new THREE.Vector3((r() - 0.5) * 2.4, 0.25 + r() * 0.5, (r() - 0.5) * 2.4), rot: r() * 6, bead: i % 3 }));
  const humanMesh = new THREE.InstancedMesh(rodGeometry(k), k.std(p.human, { emissive: p.human, emissiveIntensity: p.dark ? 1.1 : 0.3 }), N);
  const otherMesh = new THREE.InstancedMesh(rodGeometry(k), k.std(p.microbe, { transparent: true, opacity: 1 }), N);
  g.add(humanMesh, otherMesh);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    group: g,
    explodable: false,
    update(time) {
      const cyc = (time * 0.12) % 1; // capture, then pull with the magnet, then wash
      const capture = clamp01(cyc / 0.35);
      const pull = clamp01((cyc - 0.4) / 0.25);
      const wash = clamp01((cyc - 0.55) / 0.3);
      beads.forEach((b, i) => {
        const h = b.userData.home as THREE.Vector3;
        b.position.set(h.x + (1.45 - h.x) * easeInOut(pull), h.y, h.z * (1 - 0.6 * easeInOut(pull)));
        b.rotation.y = time * 0.3 + i;
      });
      let hi = 0,
        oi = 0;
      for (const rd of rods) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rd.rot + time * 0.2);
        if (rd.human) {
          const bead = beads[rd.bead].position;
          const tgt = bead.clone().add(new THREE.Vector3(Math.cos(rd.rot) * 0.32, Math.sin(rd.rot * 1.7) * 0.2, Math.sin(rd.rot) * 0.32));
          const pos = rd.pos.clone().lerp(tgt, easeInOut(capture));
          m4.compose(pos, q, new THREE.Vector3(1, 1, 1));
          humanMesh.setMatrixAt(hi++, m4);
        } else {
          const pos = rd.pos.clone().add(new THREE.Vector3(-wash * 2.2, -wash * 0.1, 0));
          if (wash > 0.95) otherMesh.setMatrixAt(oi++, hidden);
          else {
            m4.compose(pos, q, new THREE.Vector3(1, 1, 1));
            otherMesh.setMatrixAt(oi++, m4);
          }
        }
      }
      humanMesh.count = hi;
      otherMesh.count = oi;
      humanMesh.instanceMatrix.needsUpdate = true;
      otherMesh.instanceMatrix.needsUpdate = true;
      (otherMesh.material as THREE.MeshStandardMaterial).opacity = 1 - wash;
    },
  };
}

function stationSequencing(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  const slab = mesh(new THREE.BoxGeometry(3.0, 0.08, 1.5), k.glassMat(), k, false);
  slab.position.y = 0.55;
  const base = mesh(new THREE.BoxGeometry(3.2, 0.5, 1.7), k.std(p.dark ? "#2a2e33" : "#c9c3b5", { roughness: 0.5 }), k);
  base.position.y = 0.25;
  g.add(base, slab);
  for (let i = 0; i < 4; i++) {
    const lane = mesh(new THREE.BoxGeometry(2.8, 0.01, 0.22), k.std(p.dark ? "#101418" : "#9aa3a1", { roughness: 0.3 }), k, false);
    lane.position.set(0, 0.6, -0.5 + i * 0.33);
    g.add(lane);
  }
  const N = 520;
  const r = rng(51);
  const spots = Array.from({ length: N }, () => new THREE.Vector3((r() - 0.5) * 2.7, 0.612, -0.5 + Math.floor(r() * 4) * 0.33 + (r() - 0.5) * 0.18));
  const seq = Array.from({ length: N }, () => Array.from({ length: 40 }, () => BASES[Math.floor(r() * 4)]));
  const disc = k.track(new THREE.CircleGeometry(0.028, 8).rotateX(-Math.PI / 2));
  const clusters = new THREE.InstancedMesh(disc, k.track(new THREE.MeshBasicMaterial({ color: "#ffffff" })), N);
  const m4 = new THREE.Matrix4();
  spots.forEach((s, i) => clusters.setMatrixAt(i, m4.makeTranslation(s.x, s.y, s.z)));
  clusters.instanceMatrix.needsUpdate = true;
  g.add(clusters);
  const col = new THREE.Color();
  const dim = new THREE.Color(p.dark ? "#222" : "#d9d4c8");
  return {
    group: g,
    explodable: false,
    update(time) {
      // one sequencing cycle: every cluster shows the colour of its next base
      const cycle = Math.floor(time / 0.7);
      const fade = 1 - ((time / 0.7) % 1) * 0.7;
      for (let i = 0; i < N; i++) {
        col.set(p.bases[seq[i][cycle % 40]]).lerp(dim, 1 - fade);
        clusters.setColorAt(i, col);
      }
      if (clusters.instanceColor) clusters.instanceColor.needsUpdate = true;
    },
  };
}

function stationAnalysis(k: Kit): Station {
  const g = new THREE.Group();
  const p = k.p;
  const ref = mesh(new THREE.BoxGeometry(3.4, 0.08, 0.3), k.std(p.ink, { roughness: 0.5 }), k);
  ref.position.y = 0.35;
  g.add(ref);
  const N = 34;
  const r = rng(61);
  const reads = Array.from({ length: N }, (_, i) => {
    const len = 0.35 + r() * 0.55;
    const x = -1.5 + r() * (3.0 - len) + len / 2;
    return { len, x, row: 0, damaged: r() < 0.35, delay: i * 0.12 };
  });
  // stack reads in rows without overlap (a pileup)
  const rowsEnd: number[] = [];
  for (const rd of [...reads].sort((a, b) => a.x - a.len / 2 - (b.x - b.len / 2))) {
    let row = rowsEnd.findIndex((e) => e < rd.x - rd.len / 2 - 0.04);
    if (row < 0) {
      row = rowsEnd.length;
      rowsEnd.push(0);
    }
    rowsEnd[row] = rd.x + rd.len / 2;
    rd.row = row;
  }
  const readGeo = k.track(new THREE.BoxGeometry(1, 0.06, 0.2));
  const readMat = k.std(p.accent, { roughness: 0.5, emissive: p.accent, emissiveIntensity: p.dark ? 0.5 : 0.05 });
  const markGeo = k.track(new THREE.BoxGeometry(0.035, 0.08, 0.22));
  const markMat = k.std(p.damage, { emissive: p.damage, emissiveIntensity: p.dark ? 1 : 0.3 });
  const objs = reads.map((rd) => {
    const m = new THREE.Mesh(readGeo, readMat);
    m.scale.x = rd.len;
    m.castShadow = true;
    const grp = new THREE.Group();
    grp.add(m);
    if (rd.damaged) {
      // C-to-T differences sit at the first positions of the molecule
      const mk = new THREE.Mesh(markGeo, markMat);
      mk.position.x = -rd.len / 2 + 0.03;
      grp.add(mk);
    }
    g.add(grp);
    return grp;
  });
  return {
    group: g,
    explodable: false,
    update(time) {
      const t = time % 9;
      reads.forEach((rd, i) => {
        const f = clamp01((t - rd.delay) / 0.5);
        const y = 0.46 + Math.min(rd.row, 7) * 0.075;
        objs[i].position.set(rd.x, y + (1 - easeInOut(f)) * 1.4, 0);
        objs[i].visible = f > 0;
      });
    },
  };
}

function stationGenotypes(k: Kit, atlas: THREE.Texture | null): Station {
  const g = new THREE.Group();
  const p = k.p;
  const ref = mesh(new THREE.BoxGeometry(3.0, 0.08, 0.3), k.std(p.ink, { roughness: 0.5 }), k);
  ref.position.set(-0.4, 0.35, 0.7);
  g.add(ref);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const t = mesh(new THREE.BoxGeometry(0.05, 0.25, 0.05), k.std(p.accent), k);
    t.position.set(-1.75 + i * 0.25, 0.52, 0.7);
    g.add(t);
    return t;
  });
  // a small globe drawn from the site's own coastline texture
  const globeMat = k.track(
    new THREE.ShaderMaterial({
      uniforms: { uAtlas: { value: atlas }, uLand: { value: new THREE.Color(p.land) }, uOcean: { value: new THREE.Color(p.ocean) }, uInk: { value: new THREE.Color(p.ink) } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D uAtlas; uniform vec3 uLand; uniform vec3 uOcean; uniform vec3 uInk; varying vec2 vUv; varying vec3 vN;
        void main(){ float s = texture2D(uAtlas, vUv).r; float land = smoothstep(0.49, 0.51, s); float coast = 1.0 - smoothstep(0.0, 0.012, abs(s - 0.5));
          vec3 c = mix(uOcean, uLand, land); c = mix(c, uInk, coast * 0.8); float l = 0.55 + 0.45 * max(dot(vN, normalize(vec3(0.4,0.6,0.7))), 0.0);
          gl_FragColor = vec4(c * l, 1.0); }`,
    }),
  );
  const globe = new THREE.Mesh(k.track(new THREE.SphereGeometry(0.75, 64, 32)), globeMat);
  globe.position.set(0.9, 1.05, -0.5);
  g.add(globe);
  const dot = mesh(new THREE.SphereGeometry(0.07, 16, 12), k.std(p.human, { emissive: p.human, emissiveIntensity: p.dark ? 1.5 : 0.5 }), k);
  g.add(dot);
  // where the dot lands: a point in western Eurasia on the globe's surface
  const lat = (48 * Math.PI) / 180,
    lon = (20 * Math.PI) / 180;
  const local = new THREE.Vector3(-Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).multiplyScalar(0.78);
  return {
    group: g,
    explodable: false,
    update(time) {
      globe.rotation.y = -1.2 + 0.15 * Math.sin(time * 0.2);
      const cyc = (time * 0.18) % 1;
      ticks.forEach((t, i) => t.scale.set(1, i === 6 ? 1 + 0.6 * Math.sin(Math.PI * clamp01(cyc / 0.3)) : 1, 1));
      const start = ticks[6].position.clone().add(new THREE.Vector3(0, 0.2, 0));
      const end = globe.localToWorld(local.clone());
      g.worldToLocal(end);
      const f = easeInOut(clamp01((cyc - 0.25) / 0.45));
      const pos = start.clone().lerp(end, f);
      pos.y += Math.sin(Math.PI * f) * 0.9;
      dot.position.copy(pos);
      dot.scale.setScalar(cyc > 0.7 ? 1 + 0.3 * Math.sin((cyc - 0.7) * 30) * (1 - cyc) : 1);
    },
  };
}

// ---------- scene ----------

export function createScene(container: HTMLElement, palette: Palette, opts: { atlasUrl: string; reducedMotion: boolean }): SceneApi {
  const disposables: { dispose(): void }[] = [];
  const k = makeKit(palette, disposables);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = palette.dark ? 1.05 : 1.0;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = "bench-canvas";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.bg);
  scene.fog = new THREE.Fog(palette.fog, 18, 46);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const hemi = new THREE.HemisphereLight(palette.dark ? "#4a5a66" : "#fffaf0", palette.dark ? "#0b0c0d" : "#c9b994", palette.dark ? 0.55 : 1.1);
  const sun = new THREE.DirectionalLight(palette.dark ? "#ffe2b8" : "#fff4e0", palette.dark ? 1.3 : 2.0);
  sun.position.set(-6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.bias = -0.0005;
  scene.add(hemi, sun, sun.target);

  // the bench
  const table = new THREE.Mesh(k.track(new THREE.PlaneGeometry(120, 60)), k.std(palette.table, { roughness: 0.9 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  const atlas = new THREE.TextureLoader().load(opts.atlasUrl);
  atlas.colorSpace = THREE.NoColorSpace;
  k.track(atlas);
  const builders = [stationRemains, stationCleanRoom, stationSampling, stationExtraction, stationDamage, stationLibrary, stationEnrichment, stationSequencing, stationAnalysis, (kk: Kit) => stationGenotypes(kk, atlas)];
  const stations: Station[] = [];
  const anchors: THREE.Vector3[] = [];
  const plinths: THREE.Mesh[] = [];
  builders.forEach((build, i) => {
    const pos = new THREE.Vector3(i * 7.5, 0, Math.sin(i * 0.8) * 3.2);
    const pl = new THREE.Mesh(k.track(new THREE.CylinderGeometry(2.35, 2.5, 0.35, 64)), k.std(palette.plinth, { roughness: 0.7 }));
    pl.position.copy(pos).add(new THREE.Vector3(0, 0.175, 0));
    pl.receiveShadow = true;
    pl.castShadow = true;
    pl.userData.index = i;
    const ring = new THREE.Mesh(k.track(new THREE.TorusGeometry(2.42, 0.02, 6, 96)), k.std(palette.ink, { roughness: 0.4 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(pos).add(new THREE.Vector3(0, 0.352, 0));
    const st = build(k);
    st.group.position.copy(pos).add(new THREE.Vector3(0, 0.35, 0));
    scene.add(pl, ring, st.group);
    stations.push(st);
    anchors.push(pos.clone().add(new THREE.Vector3(0, 1.1, 0)));
    plinths.push(pl);
  });

  // camera, travel and focus
  const offset = new THREE.Vector3(5.6, 4.6, 9.4);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 17;
  controls.maxPolarAngle = Math.PI * 0.47;
  let current = 0;
  camera.position.copy(anchors[0]).add(offset);
  controls.target.copy(anchors[0]);
  let travel: { from: THREE.Vector3; fromT: THREE.Vector3; to: THREE.Vector3; toT: THREE.Vector3; t0: number; dur: number } | null = null;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 12, aperture: 0.0032, maxblur: 0.012 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());

  let exploded = 0;
  let explodeTarget = 0;
  const clock = new THREE.Clock();

  function resize() {
    const w = Math.max(1, container.clientWidth),
      h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    // keep the station framed on narrow screens
    camera.fov = w / h < 0.8 ? 50 : 34;
    // Frame the station beside the text card: to its right on wide screens, above the bottom
    // sheet on phones. A view offset shifts the picture without moving the camera.
    if (w > 760) camera.setViewOffset(w, h, -Math.min(250, w * 0.17), 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt: { x: number; y: number } | null = null;
  const api: SceneApi = {
    onPick: null,
    goTo(index, instant = false) {
      const i = Math.max(0, Math.min(stations.length - 1, index));
      const dirFromTarget = camera.position.clone().sub(controls.target);
      const keep = dirFromTarget.length() > 0.1 ? dirFromTarget.normalize().multiplyScalar(Math.min(14, Math.max(6, dirFromTarget.length()))) : offset.clone();
      const to = anchors[i].clone().add(i === current ? keep : offset);
      if (instant || opts.reducedMotion) {
        camera.position.copy(to);
        controls.target.copy(anchors[i]);
        travel = null;
      } else {
        travel = { from: camera.position.clone(), fromT: controls.target.clone(), to, toT: anchors[i].clone(), t0: clock.getElapsedTime(), dur: 1.6 };
      }
      current = i;
      explodeTarget = 0;
    },
    setExploded(on) {
      explodeTarget = on && stations[current].explodable ? 1 : 0;
    },
    resize,
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      composer.dispose();
      for (const d of disposables) d.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };

  function onDown(e: PointerEvent) {
    downAt = { x: e.clientX, y: e.clientY };
  }
  function onUp(e: PointerEvent) {
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 4) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(plinths, false)[0];
    if (hit && api.onPick) api.onPick(hit.object.userData.index as number);
  }
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
    const time = clock.getElapsedTime();
    const speed = opts.reducedMotion ? 0.25 : 1;
    if (travel) {
      const f = easeInOut(clamp01((time - travel.t0) / travel.dur));
      // arc up a little between stations so the bench reads as a path
      camera.position.lerpVectors(travel.from, travel.to, f).add(new THREE.Vector3(0, Math.sin(Math.PI * f) * 1.5, 0));
      controls.target.lerpVectors(travel.fromT, travel.toT, f);
      controls.enabled = false;
      if (f >= 1) travel = null;
    } else {
      controls.enabled = true;
    }
    controls.update();
    exploded += (explodeTarget - exploded) * Math.min(1, dt * 4);
    stations.forEach((s, i) => {
      // animate the station in view and its neighbours; the rest stay still
      if (Math.abs(i - current) <= 1 || travel) s.update(time * speed, dt, i === current, i === current ? exploded : 0);
    });
    (bokeh.uniforms as Record<string, { value: number }>).focus.value = camera.position.distanceTo(controls.target);
    composer.render();
  });

  return api;
}
