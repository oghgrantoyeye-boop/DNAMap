// Writes apps/web/public/ads.txt from NEXT_PUBLIC_ADSENSE_CLIENT (for example "ca-pub-1234567890123456").
// Ad networks check this file to confirm the site may sell ads under that publisher id.
// With no id set, any previous ads.txt is removed, so a site without ads publishes none.
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const out = resolve(process.cwd(), "public/ads.txt");
const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();
const m = client.match(/^ca-(pub-\d{8,20})$/);
if (m) {
  // f08c47fec0942fa0 is Google's certification authority id for AdSense.
  writeFileSync(out, `google.com, ${m[1]}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`ads.txt written for ${m[1]}`);
} else {
  if (client) console.warn(`NEXT_PUBLIC_ADSENSE_CLIENT=${client} is not of the form ca-pub-<digits>; no ads.txt written`);
  if (existsSync(out)) rmSync(out);
}
