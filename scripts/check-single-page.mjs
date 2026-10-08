// Smoke-test the single-page build the way a locked-down host runs it: inside a
// sandboxed iframe (opaque origin) under a strict Content-Security-Policy.
// Usage: node scripts/check-single-page.mjs <dir>   (the output of build-single-page.mjs)
// Exits non-zero if the page throws or the map does not render.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { chromium } from "playwright-core";
const dir = process.argv[2] || "apps/web/out-single";
const pageFile = join(dir, "index.html"), dataRoot = dir, sandbox = "allow-scripts", cors = "1";
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data: blob:; worker-src blob:";
const types = { ".json": "application/json", ".jpg": "image/jpeg", ".html": "text/html" };
const inner = createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  const f = p === "/" || p === "/index.html" ? pageFile : join(dataRoot, p);
  try {
    let b = await readFile(f);
    // the host wraps the page in a document skeleton; do the same
    if (f === pageFile) b = Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'), b]);
    const h = { "content-type": types[extname(f)] || "text/html", "content-security-policy": CSP };
    if (cors === "1") h["access-control-allow-origin"] = "*";
    res.writeHead(200, h); res.end(b);
  } catch { res.writeHead(404); res.end(); }
});
const outer = createServer((req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(`<!doctype html><body style="margin:0"><iframe sandbox="${sandbox}" src="http://127.0.0.1:4191/" style="border:0;width:100vw;height:100vh"></iframe>`); });
await new Promise((r) => inner.listen(4191, r)); await new Promise((r) => outer.listen(4192, r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const problems = [];
// web fonts may be unreachable from a test machine; that is not a page failure
page.on("console", (m) => m.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(m.text() + (m.location()?.url ?? "")) && problems.push(m.text().slice(0, 300)));
page.on("pageerror", (e) => problems.push(String(e).slice(0, 300)));
await page.goto("http://localhost:4192/");
await page.waitForTimeout(6000);
const fr = page.frames()[1];
const rendered = await fr.evaluate(() => !!document.querySelector(".app .map-canvas") && !!document.querySelector(".timeline")).catch(() => false);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close(); inner.close(); outer.close();
for (const p of problems) console.log("problem:", p);
console.log(rendered && problems.length === 0 ? "ok: map rendered in a sandboxed frame" : `FAILED: rendered=${rendered}, problems=${problems.length}`);
process.exit(rendered && problems.length === 0 ? 0 : 1);
