// Take screenshots of the built static site (apps/web/out) at desktop and phone widths.
// Usage: node scripts/screenshots.mjs [outDir] [queryString...]
// Serves apps/web/out on a local port, drives Chromium via playwright-core.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";

const root = resolve("apps/web/out");
const outDir = resolve(process.argv[2] || "docs/screenshots");
const shots = process.argv.slice(3);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = join(root, p);
  try {
    if ((await stat(f)).isDirectory()) f = join(f, "index.html");
  } catch {
    f = join(root, p.replace(/\/$/, "") + ".html");
  }
  try {
    const body = await readFile(f);
    res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(4173, r));
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const viewports = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 } };
const list = shots.length ? shots : ["home=t=-2999"];
for (const spec of list) {
  const [name, query = ""] = spec.split("=", 2).length === 2 ? [spec.split("=")[0], spec.slice(spec.indexOf("=") + 1)] : [spec, ""];
  for (const [vp, opts] of Object.entries(viewports)) {
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: opts.deviceScaleFactor || 1, isMobile: !!opts.isMobile, hasTouch: !!opts.isMobile });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(`http://localhost:4173/?${query}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(+(process.env.WAIT || 1500));
    const file = join(outDir, `${name}-${vp}.png`);
    await page.screenshot({ path: file });
    console.log(file, errors.length ? `ERRORS: ${errors.join(" | ")}` : "ok");
    await page.close();
  }
}
await browser.close();
server.close();
