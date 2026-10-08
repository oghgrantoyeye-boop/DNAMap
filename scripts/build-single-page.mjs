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
  // Next.js inlines process.env.* at build time; here every other env read becomes undefined.
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
});
const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text.replace(/<\/script/gi, "<\\/script");
// A stray Node global would crash the page before it renders (a blank screen), so refuse to build.
const leaked = js.match(/\bprocess\.(env|argv|cwd)\b/);
if (leaked) throw new Error(`bundle still references ${leaked[0]}; add it to define`);
const css = result.outputFiles.find((f) => f.path.endsWith(".css")).text;
const fonts = "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap";
const html = `<title>A Map of Us</title>
<meta name="description" content="An interactive map of human population history from ancient DNA, 50,000 BCE to 1500 CE, with the evidence behind every claim.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${css}
.about-overlay { position: fixed; inset: 0; z-index: 100; overflow-y: auto; background: var(--bg); }
.boot-msg { display: grid; place-items: center; min-height: 60vh; margin: 0; padding: 16px; font-family: var(--serif); font-size: 18px; color: var(--ink-2); text-align: center; }
</style>
<div id="root"><p class="boot-msg">Loading the map…</p></div>
<script>
// Show failures instead of a blank page.
window.addEventListener("error", function (e) {
  var r = document.getElementById("root");
  if (r && !r.querySelector(".app")) r.innerHTML = '<p class="boot-msg">The map could not start: ' + String(e.message).replace(/[<&]/g, "") + "</p>";
});
</script>
<script>${js}</script>
`;
await writeFile(resolve(out, "index.html"), html);
await cp(resolve(web, "public/data"), resolve(out, "data"), { recursive: true });
console.log(`${out}/index.html ${(html.length / 1024).toFixed(0)} KB`);
