# Prior art: ancient-DNA visualization

| project | what it is | stack / licence | learn from | avoid |
|---|---|---|---|---|
| **AADR Visualizer** (Yi, Delroba, Zizzamia, Spera, Yang 2025, *Bioinformatics Advances*, doi:10.1093/bioadv/vbaf199) | Public web map of all AADR individuals, filterable by geography, time, sequencing info and group label | ArcGIS Online (proprietary platform) | Shows demand for an accessible AADR map; filtering by AADR group nomenclature | A database-explorer framing, where every point is equal and nothing marks inference or sampling bias. It is not a narrative. |
| **DORA** (Harris & Greenbaum 2024, *NAR* web-server issue, doi:10.1093/nar/gkae373) | Interactive map plus analyses: allele frequencies, FST/PCA through time, polygenic scores, CHELSA/TraCE21k climate layers | Web tool (licence not checked) | Combining climate context with samples; exporting subsets | Analysis-heavy UI aimed at researchers. Polygenic-score trends on ancient samples are easy to over-interpret, so we will not include them. |
| **mapDATAge** (2022, *Bioinformatics*, doi:10.1093/bioinformatics/btac425) | Shiny-R package for mapping alleles, haplogroups and ancestry through space and time | R/Shiny, **GPL** (per paper) | Time-sliced mapping modules | GPL code cannot be copied into a permissively licensed site. We take ideas only. |
| **COMMIOS app** (Univ. York) | Shiny app for UK and Ireland individuals (Neolithic–Medieval) on AADR v54.1.p1, with time-series ancestry plots | R/Shiny | Per-individual ancestry-through-time plot | Regional scope only |
| **Piotr Migdał, *Genetic Distance Map* and *The Tree of 'tree'*** (DESIGN.md references) | Crafted explorable explanations | — | Typography, restraint, a single strong encoding | Richness for its own sake (the author's own critique of "lens lab") |

Lead (b) from the planning conversation (an open-source AADR explorer on Polars/DuckDB-WASM/deck.gl) was **not found**; see `aadr.md`.

## What none of them do (our niche)
- Curated *populations* and typed *relationships* as first-class objects, each linked to verified evidence.
- Observed vs inferred kept visually distinct.
- Sampling density and bias as a visible layer.
- Narrative chapters.
