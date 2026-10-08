// Frame-time check for map interaction. Drives a drag and a wheel zoom on the built
// site (apps/web/out) and reports frame intervals per map style, with the CPU slowed
// down to stand in for a mid-range phone. Usage: node scripts/perf.mjs [cpuSlowdown=4]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";

const root = resolve(process.env.SITE_ROOT || "apps/web/out");
const slow = +(process.argv[2] || 4);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = join(root, p);
  try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); } catch { f = join(root, p.replace(/\/$/, "") + ".html"); }
  try { res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(await readFile(f)); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(4175, r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const stats = (a) => { const s = [...a].sort((x, y) => x - y); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { frames: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1) }; };
for (const theme of ["atlas", "lantern", "engraved"]) {
  for (const [label, q] of [["world", "t=-3000"], ["zoomed", "t=-3000&v=15,47,4"]]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: slow });
    await page.addInitScript(() => { window.__f = []; let last = performance.now(); const tick = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    await page.goto(`http://localhost:4175/?${q}&theme=${theme}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.evaluate(() => (window.__f.length = 0));
    const c = await page.locator(".map-interactive").boundingBox();
    const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down();
    for (let i = 0; i < 40; i++) { await page.mouse.move(cx + i * 6, cy + i * 2); await page.waitForTimeout(16); }
    await page.mouse.up();
    const drag = stats(await page.evaluate(() => window.__f.slice()));
    await page.evaluate(() => (window.__f.length = 0));
    for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, i < 12 ? -120 : 120); await page.waitForTimeout(30); }
    await page.waitForTimeout(400);
    const zoom = stats(await page.evaluate(() => window.__f.slice()));
    console.log(`${theme.padEnd(9)} ${label.padEnd(7)} drag mean ${drag.mean}ms p95 ${drag.p95} max ${drag.max} (${drag.frames} frames) | zoom mean ${zoom.mean} p95 ${zoom.p95} max ${zoom.max}`);
    await page.close();
  }
}
await browser.close(); server.close();
