# Geographic data

## Chosen for V0.1: Natural Earth
- **What:** vector land, ocean, coastline, lakes, rivers (+ lake centrelines), glaciated areas, and (optional reference layer only) admin-0 countries. Scales 1:110m (world view) and 1:50m (regional zoom).
- **Source:** https://www.naturalearthdata.com/ ; files from the official CDN `https://naciscdn.org/naturalearth/` (reachable from our sandbox).
- **Version:** the release pinned in `scripts/fetch_basemap.py` (recorded with checksums when fetched).
- **Licence:** public domain. Terms page (checked 2026-10-08): no permission needed, no attribution required (they suggest an optional "Made with Natural Earth"). Some third-party contributions (e.g. JRC rivers for Europe) are licensed to Natural Earth for creating world base maps. Using them as a world base map is exactly our use.
- **Attribution we give anyway:** "Made with Natural Earth" on the About-the-data page.
- **Caveat:** these are *present-day* coastlines and rivers. During the Pleistocene, sea level was up to about 120 m lower (e.g. exposed Beringia, Sunda, Sahul, Doggerland) and ice sheets covered northern Eurasia and North America. V0.1 therefore labels the basemap as "present-day geography" in the About page, and the timeline marks the LGM. Time-varying coastlines are Phase 10.
- **Modern borders** (admin-0) are an opt-in reference layer, off by default (DESIGN.md). Natural Earth draws de facto boundaries and documents its own disputed-area policy.

## Candidates for later phases (not yet used; licences to confirm before use)
| dataset | what it adds | licence status |
|---|---|---|
| NOAA ETOPO 2022 (15″/60″ global relief) | bathymetry to derive palaeo-coastlines at a given sea-level stand | NOAA data are generally public domain; **confirm for ETOPO 2022 before use** |
| GEBCO grid | bathymetry | GEBCO terms allow free use with attribution (**confirm current terms**) |
| ICE-6G_C / ICE-7G (Peltier) | ice-sheet extent and relative sea level through time | **licence not yet checked** |
| Global sea-level curves (e.g. Lambeck et al. 2014 PNAS) | eustatic sea level vs time | published paper; derived curve values could be cited as data |
| Natural Earth raster shaded relief | relief texture | public domain (same terms) |

None of these is needed for V0.1.
