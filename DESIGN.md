# DESIGN.md — Visual & UX Brief

How the site should look, feel, and behave. `CLAUDE.md` rules (especially observed ≠ inferred, visible uncertainty, no fake routes) override anything here. The owner of this project holds product direction and visual taste: treat this brief as the starting direction, record any departures in `research/notes/LOG.md` with a reason, and expect feedback to change it.

Working title from early discussion: **"A Map of Us"** (not final). Avoid any title or tagline implying a census of "who was on Earth"; prefer framings like "an interactive map of human population history".

## The feel

An **interactive scientific history book**, not a database dashboard. Think editorial data journalism and a beautiful atlas more than a GIS tool or analytics app. Calm, readable, confident, honest about what it doesn't know. The existing AADR visualizer is a research database explorer; this site is the narrative layer on top.

Avoid: generic dark "control room" dashboards, neon glows, particle effects, dense toolbars, chart-junk, and anything that looks more precise than the evidence.

## Ambition and restraint

Aim for a piece people would share because it is beautiful *and* because they learn something true from it. The bar is a crafted explorable explanation, not a competent template.

References to look at for craft and ambition (study them, don't copy them):
- Piotr Migdał, "I gave Opus 5.5 one prompt and six hours to visualize Invisible Cities" — https://quesma.com/blog/invisible-cities-one-shot/ and the Opus 5.5 result it links
- Migdał's *Genetic Distance Map* (https://p.migdal.pl/genetic-distance-map/) and *The Tree of 'tree'* (https://p.migdal.pl/tree-of-tree/) — close in subject matter
- The "lens lab" explorable linked from that post — ambitious interaction, but note the author's critique that it is "too rich"

The same post names the failure modes to avoid. Treat this as a checklist on every screen:
- **Every element earns its place.** No feature, label, panel, or decoration that doesn't help the user understand population history. When in doubt, remove it.
- **No Captain Obvious copy.** Don't print explanatory captions that state what the user can already see. Accessibility text goes in accessible attributes, not on screen.
- **No overlaps.** Labels, markers, and panels never collide at any zoom or width; check screenshots specifically for this.
- **No default-AI look.** Don't fall back on stock styling (generic beige/cream page with large "01/02/03" section numerals, glassy cards, gradient blobs) unless it is a deliberate choice you can justify for this subject.
- **Minimalism over richness.** Prefer fewer, better-made elements. Density belongs in the Exploration and Evidence layers, on demand.

## Three UX layers

Every screen should serve one of these, and the user should be able to move between them smoothly:

1. **Overview** — "What was happening to humans?" Populations, major relationships, the shape of an era. The default view.
2. **Exploration** — "Show me the ancient individuals." Samples on the map, filters, drill-down to individual records.
3. **Evidence** — "Why do you believe this?" Claims, sources, confidence, disagreements. Reachable from anything shown.

The visualization is never the authority; the evidence is. Every population, relationship, and story step links through to evidence and, where relevant, the actual samples.

## Two modes

- **Explore** — the user controls time, map, and selection freely.
- **Story** — guided chapters (e.g. "The First Farmers", "The Steppe Expansion") that drive the same map and timeline step by step. The user can leave a story at any step and keep exploring from that state.

Both modes use the same components and data; a story is just a sequence of map/timeline/selection states with text.

## Layout

Desktop: map full-bleed as the main surface; timeline docked along the bottom; detail/evidence panel on the right that slides in on selection; light, minimal top bar (title, mode switch, search, "About the data").

Phone: map on top, timeline compact beneath it, details in a bottom sheet. Story mode works one step per screen. Everything must be usable at 375px wide with touch.

## Map

- **Quiet basemap.** Muted land/water, physical geography (relief, rivers) over political detail. **No modern country borders by default** — they are anachronistic for almost the entire period; offer them as an optional reference layer. Labels minimal.
- Basemap and geography from openly licensed published data (chosen in Phase 1). Later: time-varying coastlines/ice sheets for the Pleistocene (Phase 10).
- Projection: one that doesn't badly distort the regions most of the data sits in; justify the choice.
- V1 coverage is heaviest in Eurasia and Africa, with a smaller but coherent treatment of the Americas and Oceania. Where coverage is thin, say so on the map rather than leaving it blank-looking-empty.

## Visual vocabulary (the most important part)

Three kinds of thing must never look alike:

| Thing | Nature | Default encoding |
|---|---|---|
| Ancient individual / sample | Observed | Small crisp dot at recorded location; opacity reflects how well the current time falls within its date range; coordinate-precision flag shown on hover |
| Population | Curated, inferred extent | Soft field or halo over the area its samples cover, labelled; never a hard-edged polygon unless a source defines one; fades in/out over its time range |
| Relationship | Inferred | Line/flow between populations, style by type and confidence (below) |

Relationship types each get a distinct, legend-explained style — never one generic arrow:

- **admixture** — two (or more) streams merging into the target; width ∝ published ancestry proportion *only when a published estimate exists* (show its range on hover), otherwise a fixed neutral width
- **expansion** — spreading/fanning from source region
- **split** — one line diverging into two
- **continuity** — subtle same-place link across time (often better shown on the timeline than the map)
- **ancestry / migration** — directional, used only where the evidence specifically supports direction

**Admixture events** are their own visual object, not just converging lines:
- On the map, a marker in the region and time window where the mixing is estimated, with the source streams converging on it.
- On the timeline, the event's estimated date *range* (distinct from sample dates).
- In the population panel, an **ancestry-composition bar** (stacked proportions with uncertainty shown), with a switcher when competing models exist, labelled with the method and proxies used ("modelled as…"). Never present one model's numbers as the definitive composition.
- Sex-biased admixture, where published, noted in the event panel, not encoded decoratively.

Confidence overlays all of these: **solid = strong evidence, dashed = inferred, faint = proposed/weak**, plus a confidence badge in panels. Lines connect regions, they do not trace routes: no curved paths implying a specific journey, no particles travelling along lines, unless a source actually documents the route.

Colour: a restrained, colour-blind-safe palette. Use colour for population *category* or *ancestry component*, decided once and used consistently on map, timeline, graph, and panels. Never rely on colour alone for meaning.

## Timeline

The second primary surface, not a slider afterthought.

- **Non-linear scale.** 50,000 years of sparse data and 5,000 years of dense data can't share a linear axis. Use a scale that gives recent millennia more room (e.g. log-like or segmented), with clear labels so the distortion is obvious, plus zoom into any period.
- **Sample-density strip** along the timeline (a histogram of samples over time, for the visible map area). This is the main place sampling bias becomes visible.
- Population lifespans as thin bands above the axis; selecting a population highlights its band.
- BCE/CE labels (with "years ago" available), continuous scrubbing, play/pause with sensible speed per scale segment, period presets ("Last Glacial Maximum", "Neolithic transition", etc.) defined in data.
- Story chapters show as markers on the timeline.

## Panels

**Population panel:** name; category (genetic cluster / archaeological population / …) explained in plain words; date range; region; short original description; genetic profile and archaeological context kept separate; related populations ("ancestry contributed to…", "received ancestry from…") in careful language; evidence summary (number of individuals, number of publications, earliest/latest sample); confidence; buttons: View samples · Show evidence · Trace back · Trace forward.

**Sample card:** ID, site, location (with precision), date range and dating method, source group label (verbatim), assigned population if any, and links: View individual · View population · View source.

**Evidence panel:** each claim in our words, its confidence, sources with citation and DOI, and disagreements shown side by side rather than resolved silently. Answers "Why is this shown?" for any population or relationship.

## Relationship graph

A secondary view (panel or split screen) showing populations as nodes arranged by time, with typed relationships — the admixture-graph-style diagram from the handoff. Selection is shared with the map. This is where trace backward/forward is clearest.

## Motion

Purposeful and slow enough to follow: populations fade in/out over their ranges; relationships draw in during their time window; story steps transition camera and time together. No motion that implies movement the evidence doesn't support. Respect `prefers-reduced-motion`.

## Typography and tone

A readable serif (or similar book-like face) for narrative and descriptions; a clean sans for UI, labels, and numbers. Generous spacing in panels. Copy is plain, precise, and non-sensational; dates and confidence are always nearby.

## Honesty in the UI

- An "About the data" page and a persistent, low-key note that this is a reconstruction from available evidence, not a census.
- "Evidence sparse" indicators where sample density is low.
- Inferred elements always distinguishable from observed ones without needing the legend.
- No precise-looking numbers without their ranges.

## Process

- Before building the full UI in Phase 3, make **2–3 quick visual directions** (static mockups or rough prototype screens) in `docs/design/`, pick one with a written rationale, and continue. The owner may redirect.
- **Check your own visuals.** Run the app and take screenshots (e.g. Playwright) at desktop and phone widths, look at them, and fix what looks wrong before calling a phase done. Save key screenshots to `docs/screenshots/` for the owner to review.
- Load the `frontend-design` skill or equivalent guidance if available when making visual decisions.
- **Don't stop at "good enough".** Visual phases have a generous time budget; use it. Work in polish rounds: screenshot → critique against this brief and the anti-slop checklist → fix → repeat. Stop only when a round finds nothing substantive, and write what the last round checked in the phase summary. Parallel subagents are fine for exploring visual directions or reviewing screens, but one session owns the final design so it stays coherent.
- Polish never overrides `CLAUDE.md`: a visual effect that makes an inference look like an observation gets cut however good it looks.
