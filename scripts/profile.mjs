// CPU profile of a map drag on the built site. Usage: node scripts/profile.mjs [theme=atlas] [query]
// Prints the functions with the most self time (ms) during a 30-step drag.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";
const root = resolve(process.env.SITE_ROOT || "apps/web/out");
const theme = process.argv[2] || "atlas";
const query = process.argv[3] || "t=-3000";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = join(root, p);
  try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); } catch { f = join(root, p.replace(/\/$/, "") + ".html"); }
  try { const body = await readFile(f); res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(body); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(4176, r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const cdp = await page.context().newCDPSession(page);
await page.goto(`http://localhost:4176/?${query}&theme=${theme}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const c = await page.locator(".map-interactive").boundingBox();
const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 500 });
await cdp.send("Profiler.start");
await page.mouse.move(cx, cy); await page.mouse.down();
for (let i = 0; i < 30; i++) { await page.mouse.move(cx + i * 6, cy + i * 2); await page.waitForTimeout(16); }
await page.mouse.up();
await page.waitForTimeout(500);
const { profile } = await cdp.send("Profiler.stop");
const self = new Map();
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const dt = profile.timeDeltas; let total = 0;
profile.samples.forEach((id, i) => { const n = byId.get(id); const name = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").pop()}:${n.callFrame.lineNumber}`; self.set(name, (self.get(name) || 0) + dt[i] / 1000); total += dt[i] / 1000; });
console.log(`theme=${theme} total sampled ${total.toFixed(0)} ms`);
for (const [k, v] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`${v.toFixed(0).padStart(6)} ms  ${k}`);
await browser.close(); server.close();
