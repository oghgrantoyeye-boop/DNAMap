"use client";

// GPU reprojection of Natural Earth shaded relief (equirectangular texture) into
// the map's rotated Equal Earth projection. Each fragment inverts the projection
// (Newton iteration, as in d3-geo's geoEqualEarthRaw.invert) and samples the
// texture. Output is a grey "shading" image centred on 0.5 so it can be blended
// over any land colour (overlay / soft-light).

const VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FS = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;      // canvas size in CSS px
uniform float uDpr;
uniform float uScale;    // projection scale (px per unit)
uniform vec2 uTranslate; // projection translate (px)
uniform float uLon0;     // central meridian (radians)
uniform float uGain;
uniform float uFlat;
uniform float uMid;      // output value for flat ground (0.5 for overlay, 1.0 for multiply)
const float A1 = 1.340264;
const float A2 = -0.081106;
const float A3 = 0.000893;
const float A4 = 0.003796;
const float M = 0.8660254037844386;
const float PI = 3.141592653589793;
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
  float cl = cos(l);
  float lam = M * x * (A1 + 3.0 * A2 * l2 + l6 * (7.0 * A3 + 9.0 * A4 * l2)) / cl;
  float sp = sin(l) / M;
  if (abs(sp) > 1.0 || abs(lam) > PI) { gl_FragColor = vec4(uMid, uMid, uMid, 0.0); return; }
  float phi = asin(sp);
  float lon = lam + uLon0;
  vec2 uv = vec2(fract((lon + PI) / (2.0 * PI)), (PI / 2.0 - phi) / PI);
  float v = texture2D(uTex, uv).r;
  float s = clamp(uMid + (v - uFlat) * uGain, 0.0, 1.0);
  gl_FragColor = vec4(s, s, s, 1.0);
}
`;

export class ReliefLayer {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private prog: WebGLProgram | null = null;
  private tex: WebGLTexture | null = null;
  ready = false;
  onReady: (() => void) | null = null;

  constructor(url: string) {
    this.canvas = document.createElement("canvas");
    this.gl = this.canvas.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!this.gl) return;
    const gl = this.gl;
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
    this.prog = p;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // 4096×2048 is power-of-two, so REPEAT is legal in WebGL1
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.ready = true;
      this.onReady?.();
    };
    img.src = url;
  }

  /** Render the relief for a projection; returns the canvas, or null if unavailable. */
  render(width: number, height: number, dpr: number, scale: number, translate: [number, number], lon0Deg: number, gain = 7, mid = 0.5, flat = 0.83): HTMLCanvasElement | null {
    const gl = this.gl;
    if (!gl || !this.ready || !this.prog) return null;
    const w = Math.floor(width * dpr),
      h = Math.floor(height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.prog);
    const u = (n: string) => gl.getUniformLocation(this.prog!, n);
    gl.uniform2f(u("uSize"), width, height);
    gl.uniform1f(u("uDpr"), dpr);
    gl.uniform1f(u("uScale"), scale);
    gl.uniform2f(u("uTranslate"), translate[0], translate[1]);
    gl.uniform1f(u("uLon0"), (lon0Deg * Math.PI) / 180);
    gl.uniform1f(u("uGain"), gain);
    gl.uniform1f(u("uFlat"), flat);
    gl.uniform1f(u("uMid"), mid);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(u("uTex"), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.canvas;
  }
}
