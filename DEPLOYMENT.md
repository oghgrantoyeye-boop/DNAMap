# Deployment

How "A Map of Us" goes from this repository to a public website. Status: **proposed** (2026-10-08). Nothing below is set up yet.

## What is being deployed

A static site: `apps/web/out` from `next build` (static export). No server, no database. About 25 MB in 112 files, the largest 2.3 MB (`data/basemap-50m.json`).

Measured transfer per visitor, compressed:

| | size |
|---|---|
| First visit (page, scripts, fonts, samples, populations, base map, relief) | ~1.2 MB |
| Zooming in (detailed coastlines) | +0.7 MB |
| Each sample record opened (one shard, cached after) | +~50 KB |
| Typical engaged visit | ~1.5–2 MB |
| Return visit | small (browser cache) |

So 10,000 visits ≈ 15–20 GB of transfer. A launch spike (one popular post) can bring tens of thousands of visits in a day.

## Pipeline

```
push / pull request
  └─ GitHub Actions
       1. checkout
       2. Python 3.13 + uv; restore cache of data/raw/ (key: AADR release + md5)
       3. cd pipeline && uv run python -m build
            downloads AADR v66.p1 from Harvard Dataverse if not cached, verifies md5,
            normalises, validates (any error stops the deploy), exports apps/web/public/data
       4. pnpm install --frozen-lockfile; typecheck; vitest; pytest
       5. next build  →  apps/web/out
       6. smoke test: open the built site in headless Chromium; fail if the map does not render
       7. deploy apps/web/out
            pull request → preview URL (posted on the PR)
            main         → production
```

The build runs in GitHub Actions rather than on the host's build system because it needs Python, uv and a cached 13 MB download, and because the validation step must be able to block a release. The host only receives finished files.

## Branches and releases

- Create `main` as the release branch and make it the repository default (today the default is the working branch `claude/eloquent-keller-x4o3z8`). Work happens on branches and reaches `main` through pull requests, each with a preview deploy.
- Tag releases (`v0.1.0`, …). The site already shows the AADR release and git commit it was built from (Methodology page).
- Rollback: redeploy the previous successful build from the host's dashboard, or revert on `main`.
- New AADR release: change the pinned release and checksum in `pipeline/aadr/manifest.py` in a pull request, review `research/notes/data-report.md` and the membership report in the diff, then merge.

## Host

Both options below serve a static export without changes. Prices and limits as reported in October 2026; check the providers' pricing pages before choosing.

| | Cloudflare (Workers static assets or Pages) | Netlify |
|---|---|---|
| Static hosting cost | free; requests for static files are free and unlimited | credit-based: Free 300 credits/month, Personal $9 (1,000), Pro $20 (3,000) |
| Transfer | not metered for static files | 20 credits per GB; a production deploy costs 15 credits |
| Rough capacity | not a constraint at this size | Free ≈ 5–9k visits/month; Personal ≈ 20–30k; Pro ≈ 70–100k |
| When the allowance runs out | n/a | Free: site is paused until next month |
| Preview deploys per PR | yes | yes |
| Later chat backend | Workers (free tier ~100k requests/day) with the API key as a secret | Netlify Functions, billed from the same credits |
| Limits that matter here | 20,000 files and 25 MiB per file on free (we use 112 and 2.3 MB) | none at this size |

**Recommendation: Vercel Pro, which the owner already has.** It allows commercial use and ads (the free Hobby plan does not), includes about 1 TB of transfer a month (~500k visits at ~2 MB each), and gives every pull request a preview URL. Cloudflare remains the cheaper fallback ($0, unlimited static requests) if the plan is ever dropped, and nothing in this document ties us to one host.

Vercel specifics:
- **Build in GitHub Actions, deploy the finished files.** `data/raw/` and `apps/web/public/data/samples-detail/` are not in git, so Vercel cannot build the site from the repository alone. The workflow builds `apps/web/out` and uploads it with the Vercel CLI (`vercel deploy --prebuilt`, or a deploy of the output folder). Secrets needed in GitHub: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- **Turn on Spend Management** with a hard cap so a traffic spike or abuse cannot produce a surprise bill (Pro bills overage beyond the included transfer).
- Pro is priced per deploying seat; only people who deploy need one.
- Later chat backend: a Vercel serverless function holding the API key as an environment variable, with rate limiting.

## Domain, headers, analytics

- Domain: register one (about $10–20/year) and point it at the host; HTTPS is automatic on both hosts.
- Cache headers: `/_next/static/*` immutable for a year (file names carry hashes). `/data/*` short cache with revalidation until data file names carry content hashes (the manifest already records them).
- Security headers: a Content-Security-Policy limited to the site itself (fonts are self-hosted), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Analytics: a cookieless option (Cloudflare Web Analytics, or Netlify's on paid plans) needs no consent banner. Ads would need a privacy policy and, for EU/UK visitors, a consent banner.

## Before the public launch (ROADMAP Phase 8)

1. Owner review of the claims register (the owner holds final review of historical claims).
2. Performance on a mid-range phone, especially zoomed in with the Engraved style (untested on real devices).
3. Accessibility pass: keyboard use of map, timeline and panels; contrast in all three styles.
4. Page title, description and share image for links; a 404 page; a privacy note.
5. Confirm the GitHub issue form works for a reader without repository access (it should: the repository is public).

## Cost summary

| | per month |
|---|---|
| Vercel Pro (already held) | $20 |
| Cloudflare static hosting (fallback) | $0 |
| Netlify | $0 (capped) / $9 / $20 |
| Domain | ~$1–2 |
| Chat assistant (later) | API usage per question, plus the backend's free tier |


## Ads (added 2026-10-08; off until configured)

Everything the site needs is built; ads switch on when two environment variables are set. With them unset, no ad code runs, no third-party script loads, no `ads.txt` is published and the privacy page says nothing about advertising.

Where they appear: a labelled unit on the About and Methodology pages (text pages, where ad networks accept sites and where ads cannot get in the way of the map), never on the map, panels or evidence lists. Consent for the EEA, UK and Switzerland is Google's own message, set up in the AdSense account (free, certified). Ads load after the page has finished loading and the browser is idle.

Steps (the owner does these; nothing can be applied for on their behalf):
1. Own a domain and point it at the Vercel project (ad networks do not accept free `*.vercel.app` addresses).
2. Apply at AdSense with that domain. While waiting, set `NEXT_PUBLIC_ADSENSE_CLIENT` (`ca-pub-…`) in Vercel → Project → Settings → Environment Variables and redeploy: the site then publishes Google's ownership tag and `/ads.txt`.
3. When approved, create a responsive display ad unit and set `NEXT_PUBLIC_ADSENSE_SLOT` to its numeric id; redeploy. Ads appear.
4. In AdSense → Privacy & messaging, create the consent message for EEA/UK/Switzerland and publish it.
5. Read `/privacy/` once ads are on; it is a plain-language template, not legal advice, and should be checked for the owner's jurisdiction.

To turn ads off again, delete the two variables and redeploy.
