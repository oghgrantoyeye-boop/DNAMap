# Period presets and the timeline scale

## Why presets need care
Archaeological period names (Neolithic, Bronze Age, …) are **regional and time-transgressive**: the Neolithic begins around 9500 BCE in the Levant and around 4000 BCE in Britain. A preset is therefore a *view* (time window + map extent + caption), not a global era, and its caption names the region.

## Presets for V0.1 (each with its basis)
| id | label | window (astronomical) | map view | basis |
|---|---|---|---|---|
| `archaic-admixture` | Neandertal and Denisovan ancestry | −49999 … −38999 (50,000–39,000 BCE) | W Eurasia + Siberia; opens the panel of the inferred shared ancestors of non-Africans, where the published models sit side by side | Green 2010; Prüfer 2017; Iasi 2024; Sümer 2024; Fu 2015; Hajdinjak 2021; Reich 2010 |
| `earliest-eurasians` | Earliest sampled modern humans in Eurasia | −47999 … −38999 (48,000–39,000 BCE) | W Eurasia + Siberia | Sümer 2024; Hajdinjak 2021; Fu 2014 (sample dates) |
| `lgm` | Last Glacial Maximum | −23050 … −17050 (25,000–19,000 BP ≈ 23,051–17,051 BCE) | Europe | Posth 2023 gives the LGM as 25,000–19,000 years ago |
| `late-glacial-europe` | Late Glacial hunter-gatherers in Europe | −12049 … −6999 | Europe | Fu 2016; Posth 2023 (turnover from ~14 ka) |
| `first-farmers-near-east` | First farmers of the Near East | −9999 … −5999 | Near East | Lazaridis 2016 (sample range) |
| `farming-into-europe` | Farming spreads into Europe | −6499 … −3999 | Europe + Anatolia | Mathieson 2018 (mid-7th millennium BCE arrival in SE Europe); Lipson 2017; Brace 2019 (Britain ~4000 BCE) |
| `steppe-formation` | Eneolithic steppe and the Yamnaya | −4999 … −2599 | Pontic-Caspian | Lazaridis 2025; Nikitin 2025 |
| `steppe-expansion` | Steppe-related ancestry spreads west and east | −3299 … −1499 | Europe + Central Asia | Haak 2015; Olalde 2018/2019; Allentoft 2024; Narasimhan 2019 |
| `americas-early` | Early peopling of the Americas | −13999 … −6999 | Americas | Moreno-Mayar 2018a; Rasmussen 2014; Posth 2018 |
| `remote-oceania` | First settlement of Remote Oceania | −1099 … 300 | SW Pacific | Skoglund 2016; Lipson 2018; Posth 2018 |
| `africa-food-production` | Herding and farming spread in sub-Saharan Africa | −3499 … 1000 | eastern & southern Africa | Prendergast 2019; Skoglund 2017; Wang 2020 |

Windows are rounded view settings; the populations shown inside them keep their own sourced ranges.

## Timeline scale (proposal, see ARCHITECTURE.md)
A **segmented linear** scale with explicit breaks, rather than a smooth log scale, so the distortion is visible and readable:

| segment | span | share of width | years per 1% width |
|---|---|---|---|
| Deep | 50,000–15,000 BCE | 20% | 1,750 |
| Late Glacial / early Holocene | 15,000–6,000 BCE | 22% | ~410 |
| Farming to classical antiquity | 6,000 BCE–1 CE | 38% | ~160 |
| First millennium and a half CE | 1–1500 CE | 20% | 75 |

Segment boundaries are drawn as visible breaks with tick density changing per segment. Zooming (brush or pinch) switches to a linear scale for the zoomed window. The play speed is constant in *screen* distance, which makes each segment's years-per-second explicit in the UI.

Rationale: aDNA sample density per millennium differs by roughly 100× between the Upper Palaeolithic and the last 5,000 years (inspection report, age bands). A log scale would compress 50–15 ka less but would give the last millennium a misleading share; segments are easier to explain on the About page.
