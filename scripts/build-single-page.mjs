// Build the web app as one self-contained HTML page plus its data files, for
// hosts that serve plain files (no Next.js routing, no absolute /_next paths).
// Usage: node scripts/build-single-page.mjs <outDir>
// Output: <outDir>/index.html (JS and CSS inlined) and <outDir>/data/* (copied).
import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const web = resolve("apps/web");
const out = resolve(process.argv[2] || "apps/web/out-single");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const nextLink = {
  name: "next-link-shim",
  setup(b) {
    b.onResolve({ filter: /^next\/link$/ }, () => ({ path: resolve(web, "artifact/link.tsx") }));
  },
};

const result = await build({
  entryPoints: [resolve(web, "artifact/main.tsx")],
  absWorkingDir: web,
  tsconfig: resolve(web, "tsconfig.json"),
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  outdir: "bundle",
  logLevel: "error",
  plugins: [nextLink],
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_BASE_PATH": "undefined" },
});
const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text.replace(/<\/script/gi, "<\\/script");
const css = result.outputFiles.find((f) => f.path.endsWith(".css")).text;
const fonts = "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap";
const html = `<title>A Map of Us</title>
<meta name="description" content="An interactive map of human population history from ancient DNA, 50,000 BCE to 1500 CE, with the evidence behind every claim.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${css}
.about-overlay { position: fixed; inset: 0; z-index: 100; overflow-y: auto; background: var(--bg); }
</style>
<div id="root"></div>
<script>${js}</script>
`;
await writeFile(resolve(out, "index.html"), html);
await cp(resolve(web, "public/data"), resolve(out, "data"), { recursive: true });
console.log(`${out}/index.html ${(html.length / 1024).toFixed(0)} KB`);
