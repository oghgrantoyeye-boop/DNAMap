"use client";

// GPU base map. One full-screen fragment shader draws the whole base layer (sea, graticule,
// engraved water rings, land, terrain shading, glaciers, lakes, rivers, coastline, paper
// grain). For each screen pixel it inverts the Equal Earth projection (Newton iteration, as
// in d3-geo) to a longitude and latitude and looks the place up in three pre-made pictures of
// the world (pipeline/geo/atlas.py and relief.py):
//   - atlas-sdf:     distance to the nearest coast, in degrees, positive on land
//   - atlas-overlay: lakes (R), glaciated areas (G), rivers (B)
//   - relief:        shaded relief
// Panning and zooming therefore cost one cheap GPU pass per frame, instead of re-rasterising
// vector paths on the CPU. Themes are uniforms. It is used up to a zoom where the 8-bit
// distance texture starts to show steps; beyond that, and without WebGL, the vector renderer
// in mapRender.ts takes over.

import type { MapTheme } from "./mapRender";

const VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FS = `
precision highp float;
uniform sampler2D uSdf;
uniform sampler2D uOver;
uniform sampler2D uRelief;
uniform vec2 uSize;
uniform float uDpr;
uniform float uScale;
uniform vec2 uTranslate;
uniform float uLon0;
uniform vec3 uPage;
uniform vec3 uOcean;
uniform vec3 uOceanEdge;
uniform vec3 uLand;
uniform vec3 uCoast;
uniform vec3 uGlacier;
uniform vec4 uRing;
uniform vec4 uRiver;
uniform vec4 uGraticule;
uniform float uCoastW;
uniform float uRingCount;
uniform float uRingGap;
uniform float uReliefMode;
uniform float uReliefAlpha;
uniform float uReliefGain;
uniform float uReliefMid;
uniform float uPaperAlpha;
uniform float uPaperDark;
uniform vec2 uVigC;
uniform float uVigR;

const float A1 = 1.340264;
const float A2 = -0.081106;
const float A3 = 0.000893;
const float A4 = 0.003796;
const float M = 0.8660254037844386;
const float PI = 3.141592653589793;
const float DEG = 0.017453292519943295;
const float RANGE = 4.0;   // degrees stored either side of the coast in the distance texture
const float FLAT = 0.83;   // relief value of flat ground

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 overlayBlend(vec3 b, vec3 s) { return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b)); }

vec3 paper(vec3 c, vec2 px) {
  if (uPaperAlpha <= 0.0) return c;
  // fine grain (about 1.5 px cells) plus a slow mottle, kept gentle so it reads as paper, not noise
  float n = 0.6 * hash(floor(px / 1.5)) + 0.4 * hash(floor(px / 5.0) + 17.0);
  float t = 0.84 + 0.16 * n;
  vec3 tv = vec3(t, t - 0.012, t - 0.04);
  vec3 pc = uPaperDark > 0.5 ? overlayBlend(c, tv) : c * tv;
  return mix(c, pc, uPaperAlpha);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  float x = (px.x - uTranslate.x) / uScale;
  float y = (uTranslate.y - px.y) / uScale;
  float l = y;
  float l2 = l * l;
  float l6 = l2 * l2 * l2;
  for (int i = 0; i < 12; i++) {
    float fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y;
    float fpy = A1 + 3.0 * A2 * l2 + l6 * (7.0 * A3 + 9.0 * A4 * l2);
    float d = fy / fpy;
    l -= d;
    l2 = l * l;
    l6 = l2 * l2 * l2;
    if (abs(d) < 1e-9) break;
  }
  float fpy = A1 + 3.0 * A2 * l2 + l6 * (7.0 * A3 + 9.0 * A4 * l2);
  float cl = max(cos(l), 0.05);
  float lam = M * x * fpy / cl;
  float sp = sin(l) / M;
  if (abs(sp) > 1.0 || abs(lam) > PI) {
    gl_FragColor = vec4(paper(uPage, px), 1.0);
    return;
  }
  float phi = asin(sp);
  // continuous (unwrapped) longitude so that texture-coordinate derivatives stay smooth at the seam
  vec2 uv = vec2((lam + uLon0 + PI) / (2.0 * PI), (PI / 2.0 - phi) / PI);

  float sdv = texture2D(uSdf, uv).r;
  // Equal-area projection: the geometric mean of the local scales is exactly uScale, so
  // distance in pixels is distance in radians times uScale.
  float sdPx = (sdv - 0.5) * 2.0 * RANGE * DEG * uScale;
  vec3 over = texture2D(uOver, uv).rgb;

  // sea, darkening gently toward the rim
  float vig = clamp((length(px - uVigC) - 0.15 * uVigR) / (0.85 * uVigR), 0.0, 1.0);
  vec3 seaPlain = mix(uOcean, uOceanEdge, vig);
  vec3 sea = seaPlain;

  // graticule: every 10 degrees
  float lonDeg = degrees(lam + uLon0);
  float latDeg = degrees(phi);
  float dm = abs(mod(lonDeg + 5.0, 10.0) - 5.0);
  float dp = abs(mod(latDeg + 5.0, 10.0) - 5.0);
  float pxM = dm * DEG * uScale * cl / (M * fpy);
  float pxP = dp * DEG * uScale * fpy * M * cos(phi) / cl;
  float g = max((1.0 - smoothstep(0.3, 0.9, pxM)) * step(abs(latDeg), 80.0), 1.0 - smoothstep(0.3, 0.9, pxP));
  sea = mix(sea, uGraticule.rgb, g * uGraticule.a);

  // engraved water rings: thin lines at fixed pixel spacing offshore; fade out when zoomed in far
  // enough that the 8-bit distance texture could no longer place them smoothly
  if (uRingCount > 0.5 && sdPx < 0.0) {
    float d = -sdPx;
    float quantum = (8.0 / 255.0) * DEG * uScale;
    float fade = 1.0 - smoothstep(0.3, 0.7, quantum);
    float idx = clamp(floor(d / uRingGap + 0.5), 1.0, uRingCount);
    float rd = abs(d - idx * uRingGap);
    float r = (1.0 - smoothstep(0.1, 0.7, rd)) * step(d, (uRingCount + 0.5) * uRingGap) * fade;
    sea = mix(sea, uRing.rgb, r * uRing.a);
  }

  // land with terrain shading, glaciers, rivers
  vec3 land = uLand;
  if (uReliefMode > 0.5) {
    float rv = texture2D(uRelief, uv).r;
    vec3 sv = vec3(clamp(uReliefMid + (rv - FLAT) * uReliefGain, 0.0, 1.0));
    vec3 blended = uReliefMode < 1.5 ? land * sv : overlayBlend(land, sv);
    land = mix(land, blended, uReliefAlpha);
  }
  land = mix(land, uGlacier, 0.8 * over.g);
  land = mix(land, uRiver.rgb, uRiver.a * clamp(over.b * 1.5, 0.0, 1.0));

  float landA = smoothstep(-0.5, 0.5, sdPx);
  vec3 col = mix(sea, land, landA);

  // lakes: sea colour with an outline (distance to the 0.5 contour of the coverage texture)
  float lake = smoothstep(0.4, 0.6, over.r) * landA;
  col = mix(col, seaPlain, lake);
  if (over.r > 0.05 && over.r < 0.95 && landA > 0.5) {
    vec2 t = vec2(1.0 / 4096.0, 1.0 / 2048.0);
    float gx = texture2D(uOver, uv + vec2(t.x, 0.0)).r - texture2D(uOver, uv - vec2(t.x, 0.0)).r;
    float gy = texture2D(uOver, uv + vec2(0.0, t.y)).r - texture2D(uOver, uv - vec2(0.0, t.y)).r;
    float gm = max(length(vec2(gx, gy)) * 0.5, 0.004);
    float texPx = uScale * DEG * (360.0 / 4096.0);
    float dLake = abs(over.r - 0.5) / gm * texPx;
    float lakeEdge = 1.0 - smoothstep(uCoastW * 0.3 - 0.4, uCoastW * 0.3 + 0.4, dLake);
    col = mix(col, uCoast, lakeEdge * 0.8);
  }

  // coastline
  float coastA = 1.0 - smoothstep(uCoastW * 0.5 - 0.5, uCoastW * 0.5 + 0.5, abs(sdPx));
  col = mix(col, uCoast, coastA);

  gl_FragColor = vec4(paper(col, px), 1.0);
}
`;

type Rgba = [number, number, number, number];

/** "#rrggbb" or "rgba(r,g,b,a)" to 0–1 components. */
export function parseColor(c: string): Rgba {
  if (c.startsWith("#")) {
    const h = c.slice(1);
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const [r, g, b, a] = m[1].split(",").map((s) => parseFloat(s));
  return [r / 255, g / 255, b / 255, a === undefined ? 1 : a];
}

/** Largest zoom (view.k) at which the GPU base map is used. The 8-bit distance texture quantises the coast to about 1 px at this zoom; above it the vector renderer takes over. */
export const GPU_MAX_K = 10;

export class GpuBase {
  ready = false;
  failed = false;
  onReady: (() => void) | null = null;
  private gl: WebGLRenderingContext | null;
  private prog: WebGLProgram | null = null;
  private tex: WebGLTexture[] = [];
  private loc = new Map<string, WebGLUniformLocation | null>();

  constructor(
    private canvas: HTMLCanvasElement,
    urls: { sdf: string; overlay: string; relief: string },
  ) {
    this.gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    const gl = this.gl;
    if (!gl) {
      this.fail();
      return;
    }
    const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || hp.precision === 0) {
      this.fail(); // the inverse projection needs full float precision
      return;
    }
    try {
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
        return s;
      };
      const p = gl.createProgram()!;
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
      this.prog = p;
    } catch (e) {
      console.warn("GPU base map disabled:", e);
      this.fail();
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog!, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.fail();
    });

    let pending = 3;
    const load = (url: string, format: number, unit: number) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        if (this.failed) return;
        try {
          const t = gl.createTexture()!;
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D); // 4096 x 2048 is a power of two
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.tex[unit] = t;
          if (--pending === 0) {
            this.ready = true;
            this.onReady?.();
          }
        } catch {
          this.fail();
        }
      };
      img.onerror = () => this.fail();
      img.src = url;
    };
    load(urls.sdf, gl.LUMINANCE, 0);
    load(urls.overlay, gl.RGB, 1);
    load(urls.relief, gl.LUMINANCE, 2);
  }

  private fail(): void {
    this.failed = true;
    this.ready = false;
  }

  private u(name: string): WebGLUniformLocation | null {
    if (!this.loc.has(name)) this.loc.set(name, this.gl!.getUniformLocation(this.prog!, name));
    return this.loc.get(name)!;
  }

  /** Draw the base map for a projection. Returns false if the GPU path is unavailable. */
  draw(width: number, height: number, dpr: number, scale: number, translate: [number, number], lon0Deg: number, theme: MapTheme, resolution = 1): boolean {
    const gl = this.gl;
    if (!gl || !this.ready || this.failed || !this.prog) return false;
    // Drawing at a fraction of the screen resolution is cheaper; the browser scales the canvas to its CSS size.
    const eff = dpr * resolution;
    const w = Math.floor(width * eff),
      h = Math.floor(height * eff);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.prog);
    const f1 = (n: string, v: number) => gl.uniform1f(this.u(n), v);
    const c3 = (n: string, c: string) => {
      const [r, g, b] = parseColor(c);
      gl.uniform3f(this.u(n), r, g, b);
    };
    const c4 = (n: string, c: string) => {
      const [r, g, b, a] = parseColor(c);
      gl.uniform4f(this.u(n), r, g, b, a);
    };
    gl.uniform2f(this.u("uSize"), width, height);
    f1("uDpr", eff);
    f1("uScale", scale);
    gl.uniform2f(this.u("uTranslate"), translate[0], translate[1]);
    f1("uLon0", (lon0Deg * Math.PI) / 180);
    c3("uPage", theme.page);
    c3("uOcean", theme.ocean);
    c3("uOceanEdge", theme.oceanEdge);
    c3("uLand", theme.land);
    c3("uCoast", theme.coast);
    c3("uGlacier", theme.glacier);
    c4("uRiver", theme.river);
    c4("uGraticule", theme.graticule);
    c4("uRing", theme.waterLines ? theme.waterLines.color : "rgba(0,0,0,0)");
    f1("uCoastW", theme.coastWidth);
    f1("uRingCount", theme.waterLines ? theme.waterLines.count : 0);
    f1("uRingGap", theme.waterLines ? theme.waterLines.gap : 1);
    f1("uReliefMode", theme.relief ? (theme.relief.blend === "multiply" ? 1 : 2) : 0);
    f1("uReliefAlpha", theme.relief ? theme.relief.alpha : 0);
    f1("uReliefGain", theme.relief ? theme.relief.gain : 1);
    f1("uReliefMid", theme.relief ? theme.relief.mid : 0.5);
    f1("uPaperAlpha", theme.paper ? theme.paper.alpha : 0);
    f1("uPaperDark", theme.dark ? 1 : 0);
    // the sea darkens from the middle of the globe out to its rim
    gl.uniform2f(this.u("uVigC"), translate[0], translate[1]);
    f1("uVigR", scale * 2.7);
    for (let i = 0; i < 3; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
    }
    gl.uniform1i(this.u("uSdf"), 0);
    gl.uniform1i(this.u("uOver"), 1);
    gl.uniform1i(this.u("uRelief"), 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  }
}
