# POPULATIONS

The proposed curated population set for V1, with the published admixture models behind it. **Generated** from `data/curated/*.json` and AADR v66.p1 membership by `pipeline/curation/populations_md.py`; edit the JSON, not this file. The hand-written problems section comes from `research/populations/problems.md`.

How to read: *members* = AADR individuals matched by the population's membership rule (quality-usable, outliers excluded). *Range* = 5th–95th percentile of member date ranges (full span for <20 members); for inferred-only populations, a display window stated in the caveats. *Sparse* = fewer than 5 members or only one site.

**81 populations**: 42 genetic cluster, 25 archaeological, 8 geographic, 4 historical, 2 archaic; 8 are inferred only (no sampled members).

## Archaic admixture

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Neandertals** `neandertals` | archaic | 10 (8) | 128,000 BCE – 38,100 BCE | Western Eurasia to the Altai | high | fu2016, green2010, prufer2014, prufer2017 |
| **Denisovans** `denisovans` | archaic | 2 (2) · sparse | 198,000 BCE – 49,600 BCE | Known from the Altai (Denisova Cave); inferred elsewhere in Asia | high | browning2018, larena2021, prufer2014, reich2010 |
| **Shared ancestors of non-Africans (inferred)** `non-african-ancestors` | genetic cluster | inferred only | 48,600 BCE – 41,600 BCE | Unknown (not located by genetics) | medium | green2010, iasi2024, sumer2024 |

## Earliest modern humans in Eurasia

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Zlatý kůň/Ranis population** `zlatykun-ranis` | genetic cluster | 10 (2) | 47,600 BCE – 40,200 BCE | Central Europe (Germany, Czechia) | high | sumer2024 |
| **Bacho Kiro IUP-associated individuals** `bacho-kiro-iup` | archaeological | 3 (1) · sparse | 44,200 BCE – 40,600 BCE | Balkans (Bulgaria) | high | hajdinjak2021 |
| **Ust'-Ishim individual** `ust-ishim` | genetic cluster | 1 (1) · sparse | 44,000 BCE – 41,000 BCE | Western Siberia | high | fu2014 |
| **Oase 1** `oase` | genetic cluster | 1 (1) · sparse | 40,000 BCE – 35,800 BCE | Southeastern Europe (Romania) | high | fu2015 |
| **Tianyuan individual** `tianyuan` | genetic cluster | 1 (1) · sparse | 38,900 BCE – 36,100 BCE | Northern China | high | yang2017 |

## Late Pleistocene and early Holocene hunter-gatherers

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Early European founder population (Kostenki/Sunghir-related)** `early-european-founders` | genetic cluster | 6 (2) | 37,400 BCE – 30,100 BCE | Eastern European Plain | medium | fu2016 |
| **Goyet Q116-1-related individuals (Aurignacian-associated)** `goyetq116-aurignacian` | genetic cluster | 2 (1) · sparse | 35,200 BCE – 32,500 BCE | Northwestern Europe (Belgium) | high | fu2016, posth2023 |
| **Věstonice cluster (Gravettian-associated, central and southern Europe)** `vestonice-cluster` | genetic cluster | 11 (5) | 29,300 BCE – 25,400 BCE | Central Europe and southern Italy | high | fu2016, posth2023 |
| **Fournol cluster (Gravettian-associated, western Europe)** `fournol-cluster` | genetic cluster | 4 (4) · sparse | 29,900 BCE – 24,000 BCE | Western and southwestern Europe | high | posth2023 |
| **Ancient North Siberians (Yana)** `ancient-north-siberians` | genetic cluster | 2 (1) · sparse | 30,200 BCE – 29,600 BCE | Northeastern Siberia | high | sikora2019 |
| **Ancient North Eurasians (Mal'ta, Afontova Gora)** `ancient-north-eurasians` | genetic cluster | 3 (2) · sparse | 22,600 BCE – 14,600 BCE | South-central Siberia (Lake Baikal region) | high | lazaridis2014, raghavan2014 |
| **Solutrean-associated individuals** `solutrean-associated` | archaeological | 1 (1) · sparse | 21,100 BCE – 20,700 BCE | Southwestern Europe | medium | posth2023 |
| **Magdalenian-associated individuals (GoyetQ2 / El Mirón cluster)** `magdalenian-goyetq2` | genetic cluster | 6 (4) | 16,900 BCE – 12,300 BCE | Western and central Europe | high | fu2016, posth2023 |
| **Villabruna cluster (Epigravettian-associated)** `villabruna-epigravettian` | genetic cluster | 19 (7) | 12,400 BCE – 6,469 BCE | Italian peninsula and Sicily | high | fu2016, posth2023 |
| **Western hunter-gatherers (WHG / Oberkassel cluster)** `whg` | genetic cluster | 67 (44) | 11,800 BCE – 4,997 BCE | Western and central Europe | high | allentoft2024, lazaridis2014, mathieson2018, olalde2019, posth2023 |
| **Eastern hunter-gatherers (EHG / Sidelkino cluster)** `ehg` | genetic cluster | 20 (3) | 8,281 BCE – 5,000 BCE | Eastern Europe (Karelia, middle Volga) | high | allentoft2024, haak2015, mathieson2018, posth2023 |
| **Caucasus hunter-gatherers (CHG)** `chg` | genetic cluster | 3 (2) · sparse | 11,500 BCE – 7,599 BCE | South Caucasus (western Georgia) | high | jones2015 |
| **Iberomaurusian-associated individuals (Taforalt)** `iberomaurusian-taforalt` | archaeological | 7 (1) · sparse | 13,200 BCE – 11,900 BCE | Northwest Africa (Morocco) | medium | vandeloosdrecht2018 |

## Near Eastern hunter-gatherers and first farmers

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Natufian-associated hunter-gatherers** `natufians` | archaeological | 4 (1) · sparse | 12,000 BCE – 9,500 BCE | Southern Levant | high | lazaridis2016 |
| **Anatolian Epipalaeolithic hunter-gatherer (Pınarbaşı)** `anatolia-epipaleolithic` | genetic cluster | 1 (1) · sparse | 13,600 BCE – 13,300 BCE | Central Anatolia | high | feldman2019 |
| **Basal Eurasian lineage (modelled)** `basal-eurasian` | genetic cluster | inferred only | 48,000 BCE – 10,000 BCE | Unknown | medium | lazaridis2014, lazaridis2016 |
| **Early farmers of the Zagros** `zagros-early-farmers` | genetic cluster | 16 (4) | 8,295 BCE – 7,076 BCE | Zagros mountains (western Iran) | high | broushaki2016, lazaridis2016 |
| **Early farmers of the southern Levant (PPNB)** `levant-ppn-farmers` | genetic cluster | 16 (4) | 8,400 BCE – 4,500 BCE | Southern Levant | high | lazaridis2016 |
| **Early farmers of Anatolia** `anatolia-neolithic-farmers` | genetic cluster | 189 (12) | 8,300 BCE – 5,600 BCE | Anatolia | high | feldman2019, lazaridis2016 |
| **Late Chalcolithic individuals of Peqi'in Cave** `levant-chalcolithic-peqiin` | archaeological | 20 (1) · sparse | 4,450 BCE – 3,950 BCE | Southern Levant (northern Israel) | high | harney2018, lazaridis2016 |

## Farming spreads into Europe

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Early farmers associated with Starčevo–Körös–Criș** `se-europe-early-farmers` | archaeological | 45 (27) | 6,224 BCE – 5,211 BCE | Southeastern Europe | high | mathieson2018 |
| **LBK-associated farmers** `lbk-farmers` | archaeological | 234 (34) | 5,500 BCE – 4,784 BCE | Central Europe | high | haak2015, lipson2017 |
| **Early Neolithic farmers of Iberia** `iberia-early-neolithic` | archaeological | 19 (8) | 5,474 BCE – 4,367 BCE | Iberian Peninsula | high | lipson2017 |
| **Neolithic farmers of Britain** `britain-neolithic` | archaeological | 114 (46) | 4,000 BCE – 2,500 BCE | Britain | high | brace2019 |

## Eneolithic steppe and steppe-related expansions

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Trypillia-associated farmers** `trypillia-farmers` | archaeological | 31 (3) | 3,950 BCE – 2,935 BCE | Forest-steppe north of the Black Sea | medium | nikitin2025 |
| **Globular Amphora-associated individuals** `globular-amphora` | archaeological | 39 (10) | 3,400 BCE – 2,450 BCE | Central and eastern Europe | medium | allentoft2024 |
| **Volga cline Eneolithic (Khvalynsk, Ekaterinovka)** `volga-cline-eneolithic` | genetic cluster | 73 (6) | 5,500 BCE – 4,300 BCE | Middle Volga | high | lazaridis2025 |
| **Caucasus–Lower Volga cline Eneolithic (Berezhnovka)** `clv-eneolithic` | genetic cluster | 4 (1) · sparse | 4,929 BCE – 4,173 BCE | Lower Volga steppe | medium | lazaridis2025 |
| **Serednii Stih-associated individuals (Dnipro cline)** `serednii-stih` | archaeological | 29 (10) | 4,996 BCE – 3,531 BCE | Pontic steppe (Dnipro to Don) | high | lazaridis2025, nikitin2025 |
| **Maikop-associated individuals (North Caucasus)** `maikop` | archaeological | 14 (6) | 3,932 BCE – 2,934 BCE | North Caucasus | high | wang2019 |
| **Yamnaya-associated individuals** `yamnaya` | archaeological | 200 (96) | 3,346 BCE – 2,468 BCE | Pontic–Caspian steppe and beyond | high | damgaard2018, haak2015, jones2015, lazaridis2022, lazaridis2025, wang2021 |
| **Corded Ware-associated individuals** `corded-ware` | archaeological | 102 (40) | 2,913 BCE – 2,050 BCE | Northern and central Europe | high | haak2015 |
| **Beaker-associated individuals, central and northwest Europe** `beaker-central-europe` | archaeological | 183 (54) | 2,800 BCE – 1,800 BCE | Central and northwest Europe | high | olalde2018 |
| **Beaker-associated individuals, Britain** `beaker-britain` | archaeological | 33 (20) | 2,800 BCE – 1,617 BCE | Britain | high | olalde2018 |
| **Chalcolithic people of Iberia (including Beaker-associated individuals)** `iberia-chalcolithic` | geographic | 148 (33) | 3,350 BCE – 1,744 BCE | Iberian Peninsula | high | olalde2018 |
| **Chalcolithic Iberians with steppe-related ancestry** `iberia-chalcolithic-steppe-related` | genetic cluster | 13 (7) | 2,600 BCE – 1,700 BCE | Iberian Peninsula | high | olalde2018 |
| **Bronze Age people of Iberia** `iberia-bronze-age` | geographic | 158 (41) | 2,200 BCE – 1,000 BCE | Iberian Peninsula | high | olalde2019 |
| **Late Bronze Age and Iron Age people of southern Britain** `britain-lba-ia` | geographic | 250 (64) | 1,055 BCE – 200 CE | England and Wales | high | patterson2022 |
| **Middle–Late Bronze Age steppe (Sintashta, Andronovo, Srubnaya-associated)** `steppe-mlba` | archaeological | 93 (21) | 2,131 BCE – 1,200 BCE | Central Eurasian steppe | medium | narasimhan2019 |
| **Botai-associated individuals** `botai` | archaeological | 3 (1) · sparse | 3,517 BCE – 3,025 BCE | Northern Kazakhstan | high | damgaard2018 |

## South Asia

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Indus Periphery Cline and the Rakhigarhi individual** `indus-periphery` | genetic cluster | 1 (1) · sparse | 2,800 BCE – 1,900 BCE | Northwest South Asia and its periphery | medium | narasimhan2019, shinde2019 |
| **Ancestral Ancient South Asians (AASI, modelled)** `aasi` | genetic cluster | inferred only | 48,000 BCE – 2,001 BCE | South Asia | medium | narasimhan2019 |
| **Ancestral South Indians (ASI, modelled)** `asi` | genetic cluster | inferred only | 1,900 BCE – 500 CE | South Asia | medium | narasimhan2019 |
| **Ancestral North Indians (ANI, modelled)** `ani` | genetic cluster | inferred only | 1,900 BCE – 500 CE | South Asia | medium | narasimhan2019 |

## East and Southeast Asia

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Jōmon-associated hunter-gatherers** `jomon` | archaeological | 18 (9) | 7,041 BCE – 803 BCE | Japanese archipelago | medium | cooke2021, gakuhari2020, wang2021 |
| **Kofun-period individuals (Japan)** `kofun-period-japan` | historical | 3 (1) · sparse | 541 CE – 655 CE | Japanese archipelago | medium | cooke2021 |
| **Amur River basin hunter-gatherers** `amur-hunter-gatherers` | genetic cluster | 25 (3) | 9,243 BCE – 4,329 BCE | Amur River basin | high | ning2020, wang2021 |
| **Yellow River basin Neolithic farmers** `yellow-river-farmers` | genetic cluster | 47 (11) | 3,550 BCE – 1,882 BCE | Yellow River basin | medium | ning2020, wang2021 |
| **West Liao River basin Neolithic and Bronze Age people** `west-liao-river` | geographic | 11 (7) | 6,400 BCE – 350 BCE | West Liao River basin (Inner Mongolia) | medium | ning2020 |
| **Iron Age people of Taiwan** `taiwan-iron-age` | geographic | 46 (1) · sparse | 1 CE – 800 CE | Taiwan | medium | wang2021, yang2020 |
| **Hòabìnhian-associated hunter-gatherers** `hoabinhian` | archaeological | 2 (2) · sparse | 6,012 BCE – 2,209 BCE | Mainland Southeast Asia | medium | mccoll2018 |
| **Neolithic farmers of mainland Southeast Asia (Man Bac)** `sea-neolithic-farmers` | genetic cluster | 8 (1) · sparse | 2,200 BCE – 1,600 BCE | Northern Vietnam | high | lipson2018sea |
| **Xiongnu-period individuals (Mongolia)** `xiongnu-period` | historical | 57 (28) | 400 BCE – 850 CE | Mongolia and neighbouring steppe | high | jeong2020 |
| **Mongol-period individuals (Mongolia)** `mongol-period` | historical | 72 (40) | 400 BCE – 1500 CE | Mongolia | high | jeong2020 |

## Peopling of the Americas

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Founding population of Native Americans (inferred)** `first-americans-founders` | genetic cluster | inferred only | 34,100 BCE – 12,700 BCE | Northeast Asia / Beringia (not located by genetics) | medium | morenomayar2018a, raghavan2014, raghavan2015 |
| **Ancient Beringians (Upward Sun River)** `ancient-beringians` | genetic cluster | 2 (1) · sparse | 9,700 BCE – 9,250 BCE | Interior Alaska | medium | morenomayar2018a |
| **Anzick-1 (Clovis-associated)** `clovis-anzick` | genetic cluster | 1 (1) · sparse | 10,800 BCE – 10,700 BCE | Northern Rocky Mountains | high | rasmussen2014 |
| **Early Holocene people of Central and South America** `early-central-south-americans` | geographic | 28 (11) | 10,100 BCE – 6,252 BCE | Central and South America | medium | posth2018 |
| **People of the Central and South-Central Andes** `central-andes` | geographic | 94 (37) | 2,300 BCE – 1613 CE | Central Andes | high | nakatsuka2020, posth2018 |
| **Archaic Age people of the Caribbean** `caribbean-archaic` | archaeological | 54 (9) | 1,400 BCE – 1300 CE | Greater Antilles | high | fernandes2021 |
| **Ceramic Age people of the Caribbean** `caribbean-ceramic` | archaeological | 205 (44) | 500 CE – 1500 CE | Caribbean islands and Venezuelan coast | high | fernandes2021 |

## Oceania

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Ancestors of Papuans and Aboriginal Australians (inferred)** `australo-papuan-ancestors` | genetic cluster | inferred only | 48,000 BCE – 8,001 BCE | Island Southeast Asia and Sahul (not located by genetics) | medium | malaspinas2016, reich2010 |
| **First Remote Oceanians (Lapita-associated)** `lapita-first-remote-oceanians` | archaeological | 10 (2) | 1,250 BCE – 500 BCE | Vanuatu and Tonga | high | lipson2018oceania, skoglund2016 |
| **Post-Lapita people of Vanuatu** `vanuatu-post-lapita` | geographic | 13 (9) | 410 BCE – 1950 CE | Vanuatu | high | lipson2018oceania, posth2018oceania, skoglund2016 |
| **Bismarck Archipelago-related ancestry (source, inferred)** `bismarck-related-source` | genetic cluster | inferred only | 1,001 BCE – 500 CE | Bismarck Archipelago | medium | lipson2018oceania |

## Africa

| population | category | members (sites) | range | region | confidence | key sources |
|---|---|---|---|---|---|---|
| **Mota (Ethiopia)** `mota` | genetic cluster | 1 (1) · sparse | 2,576 BCE – 2,465 BCE | Ethiopian highlands | medium | gallegollorente2015 |
| **Eastern African foragers** `east-african-foragers` | genetic cluster | 7 (5) | 5,217 BCE – 216 CE | Eastern Africa (Kenya, Tanzania) | medium | lipson2022, prendergast2019 |
| **Foragers of Malawi** `malawi-foragers` | genetic cluster | 9 (3) | 15,000 BCE – 390 BCE | Malawi | high | lipson2022, skoglund2017 |
| **Southern African foragers** `southern-african-foragers` | genetic cluster | 13 (4) | 8,607 BCE – 1387 CE | Southern Africa | medium | schlebusch2017, skoglund2017 |
| **Shum Laka individuals (Cameroon)** `shum-laka` | genetic cluster | 4 (1) · sparse | 6,058 BCE – 1,055 BCE | Grassfields of western Cameroon | high | lipson2020 |
| **Pastoral Neolithic herders of eastern Africa** `pastoral-neolithic` | archaeological | 31 (15) | 2,116 BCE – 580 CE | Eastern Africa (Kenya, Tanzania) | high | prendergast2019, skoglund2017, wang2020 |
| **Iron Age farmers with western-African-related ancestry** `western-african-related-farmers` | genetic cluster | 11 (10) | 586 CE – 1793 CE | Eastern and southern Africa | medium | forteslima2024, schlebusch2017, skoglund2017 |
| **Medieval people of the Swahili coast** `swahili-medieval` | historical | 50 (4) | 1200 CE – 1700 CE | East African coast (Kenya, Tanzania) | high | brielle2023 |

## Admixture-event catalogue

Each event lists every published model we checked, side by side. Proportions are as published (interval type in brackets). 'not given' = the component is named in the checked text without a number.

### Shared ancestors of non-Africans (inferred) — `ae-neandertal-non-africans` (archaic)

- **Neandertal-derived share, estimated with the Altai, Vindija and Mezmaiskaya genomes** (Prüfer K, Racimo F, Patterson N, et al. 2014; other). Components: Neandertal (Altai/Vindija/Mezmaiskaya references) → Neandertals: 1.8% (1.5–2.1%, range).
- **Revised with the high-coverage Vindija genome (outside Oceania)** (Prüfer K, de Filippo C, Grote S, et al. 2017; other). Components: Neandertal (Vindija 33.19 reference) → Neandertals: 2.2% (1.8–2.6%, range).
- **Site-frequency-spectrum demographic model** (Malaspinas AS, Westaway MC, Muller C, et al. 2016; SFS_model). Components: Neandertal → Neandertals: 2.3% (1.1–3.5%, ci95). Date of mixing: 82,100 BCE – 53,100 BCE (SFS demographic model (point estimate ~60 ka)).
- **Date from linkage disequilibrium in present-day Europeans** (Sankararaman S, Patterson N, Li H, Pääbo S, Reich D. 2012; other). Components: —. Date of mixing: 84,100 BCE – 35,100 BCE (LD decay (most likely 47–65 ka)).
- **Date from Neandertal segments in >300 ancient and present-day genomes** (Iasi LNM, Chintalapati M, Skov L, et al. 2024; segment_based). Components: —. Date of mixing: 48,600 BCE – 41,600 BCE (Neandertal segment lengths through time).
- **Date anchored by the ~45,000-year-old Ranis genome** (Sümer AP, Rougier H, Villalba-Mouco V, et al. 2025; segment_based). Components: —. Date of mixing: 47,100 BCE – 43,100 BCE (Neandertal segment lengths in Ranis13 and Zlatý kůň, with radiocarbon age).

### Oase 1 — `ae-neandertal-oase` (archaic)

- **Total Neandertal-derived share, including a recent Neandertal ancestor** (Fu Q, Hajdinjak M, Moldovan OT, et al. 2015; other). Components: Neandertal → Neandertals: 7.5% (6–9%, range). Date of mixing: 4–6 generations before the sampled individual (Segment length: a Neandertal ancestor 4–6 generations before Oase 1 lived).

### Bacho Kiro IUP-associated individuals — `ae-neandertal-bacho-kiro` (archaic)

- **recent Neandertal ancestors a few generations back (in addition to the shared non-African admixture)** (Hajdinjak M, Mafessoni F, Skov L, et al. 2021; segment_based). Components: Neandertal → Neandertals: not given. Date of mixing:  (a few generations before these individuals lived).

### Ancestors of Papuans and Aboriginal Australians (inferred) — `ae-denisovan-australo-papuan` (archaic)

- **First estimate in present-day Melanesians** (Reich D, Green RE, Kircher M, et al. 2010; other). Components: Denisovan (Altai Denisova 3 reference; the contributing group was distantly related) → Denisovans: 5% (4–6%, range).

### Magdalenian-associated individuals (GoyetQ2 / El Mirón cluster) — `ae-magdalenian`

- **modelled as Fournol-related + Villabruna-related (qpAdm; proxies Fournol 85 and Arene Candide 16)** (Posth C, Yu H, Ghalichi A, et al. 2023; qpAdm). Components: Fournol 85 → Fournol cluster (Gravettian-associated, western Europe): 76% (71–81%, range); Arene Candide 16 → Villabruna cluster (Epigravettian-associated): 24% (19–29%, range).

### Early farmers of Anatolia — `ae-anatolia-farmers`

- **continuity with the Pınarbaşı hunter-gatherer plus Iranian/Caucasus- and Levant-related inputs** (Feldman M, Fernández-Domínguez E, Reynolds L, et al. 2019; qpAdm). Components: Anatolian hunter-gatherer (Pınarbaşı) → Anatolian Epipalaeolithic hunter-gatherer (Pınarbaşı): 85% (80–90%, range); Iranian/Caucasus-related: not given; Levant-related (later): not given.

### Late Chalcolithic individuals of Peqi'in Cave — `ae-peqiin`

- **modelled as Levant Neolithic + Iran Chalcolithic + Anatolia Neolithic (qpAdm)** (Harney É, May H, Shalem D, et al. 2018; qpAdm). Components: Levant Neolithic → Early farmers of the southern Levant (PPNB): ~57%; Iran Chalcolithic: ~17%; Anatolia Neolithic → Early farmers of Anatolia: ~26%.

### LBK-associated farmers — `ae-lbk`

- **early-farmer-related ancestry + a small hunter-gatherer share** (Lipson M, Szécsényi-Nagy A, Mallick S, et al. 2017; admixture_graph). Components: early farmer-related (Anatolian-related) → Early farmers of Anatolia: 95.5% (95–96%, range); hunter-gatherer (closest to KO1 + Loschbour) → Western hunter-gatherers (WHG / Oberkassel cluster): 4.5% (4–5%, range). Date of mixing: 5,610 BCE – 5,480 BCE (ALDER-style LD dating: 5545 ± 65 BCE (average)).
- **deep-lineage model of Early European Farmers (Stuttgart, LBK-associated)** (Lazaridis I, Patterson N, Mittnik A, et al. 2014; admixture_graph). Components: Basal Eurasian (modelled lineage) → Basal Eurasian lineage (modelled): ~44%.

### Neolithic farmers of Britain — `ae-britain-neolithic`

- **Anatolian Neolithic farmer-related + WHG-related (average)** (Brace S, Diekmann Y, Booth TJ, et al. 2019; qpAdm). Components: Anatolian Neolithic farmers (ANF) → Early farmers of Anatolia: ~74%; WHG → Western hunter-gatherers (WHG / Oberkassel cluster): ~26%.

### Chalcolithic people of Iberia (including Beaker-associated individuals) — `ae-iberia-chalcolithic`

- **early-farmer-related + hunter-gatherer (Iberian Chalcolithic)** (Lipson M, Szécsényi-Nagy A, Mallick S, et al. 2017; admixture_graph). Components: early farmer-related → Early farmers of Anatolia: ~73%; hunter-gatherer → Western hunter-gatherers (WHG / Oberkassel cluster): ~27%.

### Yamnaya-associated individuals — `ae-yamnaya`

- **eastern European hunter-gatherers + a population of Near Eastern ancestry** (Haak W, Lazaridis I, Patterson N, et al. 2015; qpAdm). Components: EHG → Eastern hunter-gatherers (EHG / Sidelkino cluster): not given; Near Eastern-related population: not given.
- **includes a significant Caucasus hunter-gatherer-related contribution** (Jones ER, Gonzalez-Fortes G, Connell S, et al. 2015; other). Components: CHG → Caucasus hunter-gatherers (CHG): not given.
- **eastern European hunter-gatherers + ancestry related to Iranian farmers** (Lazaridis I, Nadel D, Rollefson G, et al. 2016; qpAdm). Components: EHG → Eastern hunter-gatherers (EHG / Sidelkino cluster): not given; Iranian farmer-related (Iran Chalcolithic / Neolithic): not given.
- **includes ancestry from Middle Don hunter-gatherers** (Allentoft ME, Sikora M, Refoyo-Martínez A, et al. 2024; other). Components: Middle Don hunter-gatherers: not given.
- **Caucasus–Lower Volga-related (about four-fifths) + Ukraine Neolithic hunter-gatherer-related, via Serednii Stih-related groups** (Lazaridis I, Patterson N, Anthony D, et al. 2025; qpAdm). Components: CLV cline → Caucasus–Lower Volga cline Eneolithic (Berezhnovka): ~80%; Ukraine Neolithic hunter-gatherers (UNHG): ~20%. Date of mixing: 4,000 BCE (the authors place Yamnaya ancestors' formation around 4000 BCE).

### Corded Ware-associated individuals — `ae-corded-ware`

- **Yamnaya-related + Middle Neolithic European farmer-related (Germany)** (Haak W, Lazaridis I, Patterson N, et al. 2015; other). Components: Yamnaya → Yamnaya-associated individuals: ~75%; Middle Neolithic central European farmers: ~25%.
- **Yamnaya-related groups admixed with Globular Amphora-associated people before expanding** (Allentoft ME, Sikora M, Refoyo-Martínez A, et al. 2024; other). Components: Yamnaya-related → Yamnaya-associated individuals: not given; Globular Amphora-associated → Globular Amphora-associated individuals: not given.

### Beaker-associated individuals, Britain — `ae-beaker-britain`

- **Britain's gene pool about 90% replaced within a few centuries of the Beaker complex's arrival** (Olalde I, Brace S, Allentoft ME, et al. 2018; qpAdm). Components: continental Beaker-associated (steppe-related) ancestry → Beaker-associated individuals, central and northwest Europe: ~90%; British Neolithic → Neolithic farmers of Britain: ~10%.

### Bronze Age people of Iberia — `ae-iberia-bronze-age`

- **local Chalcolithic-related + steppe-related ancestry, strongly male-biased** (Olalde I, Mallick S, Patterson N, et al. 2019; qpAdm). Components: Iberian Chalcolithic → Chalcolithic people of Iberia (including Beaker-associated individuals): ~60%; people with steppe-related ancestry: ~40%. Date of mixing: 2,000 BCE (replacement documented by about 2000 BCE (sample dates)). Sex bias: Nearly all Y chromosomes in the Bronze Age derive from the incoming steppe-related source, against about 40% of overall ancestry.

### Late Bronze Age and Iron Age people of southern Britain — `ae-britain-lba-ia`

- **earlier British ancestry + continental migrants most similar to ancient individuals from France** (Patterson N, Isakov M, Booth T, et al. 2022; qpAdm). Components: Early/Middle Bronze Age Britain: ~50%; continental migrants (France-related): ~50%. Date of mixing: 1,000 BCE – 875 BCE (EEF-related ancestry rise documented 1000–875 BCE).

### Post-Lapita people of Vanuatu — `ae-vanuatu`

- **Papuan-related (Bismarck Archipelago-related) arrival by ~2,300 years ago; later dilution** (Lipson M, Skoglund P, Spriggs M, et al. 2018; qpAdm). Components: Papuan-related (Bismarck Archipelago) → Bismarck Archipelago-related ancestry (source, inferred): 85% (80–90%, range); First Remote Oceanians (Lapita) → First Remote Oceanians (Lapita-associated): 15% (10–20%, range). Date of mixing: 351 BCE (Papuan-related ancestry present by ~2,300 BP (sample dates)).
- **incremental, repeated movements with sex-biased admixture from ~2,500 years ago** (Posth C, Nägele K, Colleran H, et al. 2018; other). Components: Near Oceanian (Bismarck Archipelago) → Bismarck Archipelago-related ancestry (source, inferred): not given; Lapita-Austronesian → First Remote Oceanians (Lapita-associated): not given. Date of mixing: 551 BCE (Papuan-related expansion beginning ~2,500 BP). Sex bias: Sex-biased admixture reported (Posth et al. 2018).

### Pastoral Neolithic herders of eastern Africa — `ae-pastoral-neolithic`

- **Luxmanda (~3,100 BP): Levant PPN-related + Ethiopia_4500BP (Mota)-related** (Skoglund P, Thompson JC, Prendergast ME, et al. 2017; qpAdm). Components: Levant pre-pottery Neolithic → Early farmers of the southern Levant (PPNB): 38% (37–39%, estimate se); Ethiopia_4500BP → Mota (Ethiopia): ~62%.
- **northeastern African-related + eastern African forager ancestry (multi-step)** (Prendergast ME, Lipson M, Sawchuk EA, et al. 2019; qpAdm). Components: northeastern African-related: not given; eastern African foragers → Eastern African foragers: not given.

### Foragers of Malawi — `ae-malawi-foragers`

- **about two-thirds San-related ancestry** (Skoglund P, Thompson JC, Prendergast ME, et al. 2017; qpAdm). Components: San-related → Southern African foragers: ~67%.

### Medieval people of the Swahili coast — `ae-swahili`

- **African ancestry (mainly female-line) + Asian ancestry (mainly Persian-related, male-line)** (Brielle ES, Fleisher J, Wynne-Jones S, et al. 2023; qpAdm). Components: African ancestry (more than half in many individuals): not given; Asian ancestry, 80–90% from Persian-related men: not given. Date of mixing: 1000 CE (mixing began by about 1000 CE). Sex bias: African ancestry inherited mainly through female ancestors; Asian (Persian-related) ancestry mainly through male ancestors.

### Founding population of Native Americans (inferred) — `ae-ane-first-americans`

- **share of Native American ancestry from a population related to MA-1** (Raghavan M, Skoglund P, Graf KE, et al. 2014; other). Components: MA-1 (Mal'ta) → Ancient North Eurasians (Mal'ta, Afontova Gora): 26% (14–38%, range).
- **date of ANE-related gene flow in a demographic model (abstract)** (Moreno-Mayar JV, Potter BA, Vinner L, et al. 2018; SFS_model; abstract only). Components: —. Date of mixing: 23,100 BCE – 18,100 BCE (demographic model: 25–20 ka).

### Ceramic Age people of the Caribbean — `ae-caribbean-ceramic`

- **incoming ceramic-using population related to northeastern South American Arawak speakers, with almost no Archaic Age ancestry** (Fernandes DM, Sirak KA, Ringbauer H, et al. 2021; qpAdm). Components: northeastern South American (Arawak-related) source: 99% (98–100%, approximate); Archaic Age Caribbean → Archaic Age people of the Caribbean: 1% (0–2%, approximate).

## Relationships (non-admixture)

| type | from → to | confidence | wording |
|---|---|---|---|
| split | Shared ancestors of non-Africans (inferred) → Zlatý kůň/Ranis population | high | The Zlatý kůň/Ranis population is the earliest sampled branch of the population that left Africa and received Neandertal gene flow. |
| ancestry | Shared ancestors of non-Africans (inferred) → Ust'-Ishim individual | medium | Ust'-Ishim derives from the shared non-African population, before or around the separation of western and eastern Eurasians. |
| shared_ancestry | Tianyuan individual ↔ Goyet Q116-1-related individuals (Aurignacian-associated) | high | Tianyuan shares extra genetic affinity with Goyet Q116-1, so early European and Asian populations did not separate in one clean split. |
| ancestry | Early European founder population (Kostenki/Sunghir-related) → Věstonice cluster (Gravettian-associated, central and southern Europe) | medium | Ancestry of the early European founder population (Kostenki/Sunghir-related) contributed to Gravettian-associated groups of central and southern Europe. |
| shared_ancestry | Ancient North Siberians (Yana) ↔ Early European founder population (Kostenki/Sunghir-related) | medium | Ancient North Siberians were distantly related to early western Eurasian hunter-gatherers. |
| ancestry | Goyet Q116-1-related individuals (Aurignacian-associated) → Fournol cluster (Gravettian-associated, western Europe) | medium | Gravettian-associated people of western Europe (Fournol cluster) carried ancestry closely related to that of earlier Aurignacian-associated individuals from Goyet. |
| continuity | Fournol cluster (Gravettian-associated, western Europe) → Solutrean-associated individuals | medium | Fournol-related ancestry persisted through the Last Glacial Maximum in southwestern Europe. |
| continuity | Solutrean-associated individuals → Magdalenian-associated individuals (GoyetQ2 / El Mirón cluster) | medium | Fournol-related ancestry continued from Solutrean- to Magdalenian-associated people. |
| expansion | Villabruna cluster (Epigravettian-associated) → Western hunter-gatherers (WHG / Oberkassel cluster) | high | From at least 14,000 years ago, Villabruna-related ancestry spread from the south across western and central Europe, largely replacing Magdalenian-associated ancestry. |
| ancestry | Ancient North Eurasians (Mal'ta, Afontova Gora) → Eastern hunter-gatherers (EHG / Sidelkino cluster) | medium | Eastern hunter-gatherers carried ancestry related to Ancient North Eurasians such as the Mal'ta individual. |
| ancestry | Villabruna cluster (Epigravettian-associated) → Eastern hunter-gatherers (EHG / Sidelkino cluster) | medium | Eastern hunter-gatherers also carried ancestry related to the Villabruna cluster. |
| ancestry | Eastern hunter-gatherers (EHG / Sidelkino cluster) → Western hunter-gatherers (WHG / Oberkassel cluster) | high | From about 8,000 years ago, eastern hunter-gatherer-related ancestry appears at about 10% in central European hunter-gatherers. |
| split | Caucasus hunter-gatherers (CHG) ↔ Western hunter-gatherers (WHG / Oberkassel cluster) | medium | In one demographic model, the lineages leading to Caucasus and western European hunter-gatherers separated about 45,000 years ago. |
| split | Early farmers of the Zagros ↔ Early farmers of Anatolia | medium | The ancestors of the first farmers of the Zagros and of Anatolia are modelled as having separated tens of thousands of years before farming began. |
| shared_ancestry | Iberomaurusian-associated individuals (Taforalt) ↔ Natufian-associated hunter-gatherers | medium | Iberomaurusian-associated people of Taforalt show genetic affinity with Natufian-associated people of the Levant. |
| ancestry | Basal Eurasian lineage (modelled) → Natufian-associated hunter-gatherers | medium | About half of the ancestry of early Near Easterners is modelled as coming from a 'Basal Eurasian' lineage. |
| ancestry | Basal Eurasian lineage (modelled) → Early farmers of the Zagros | medium | About half of the ancestry of early Near Easterners is modelled as coming from a 'Basal Eurasian' lineage. |
| continuity | Natufian-associated hunter-gatherers → Early farmers of the southern Levant (PPNB) | high | The first farmers of the southern Levant descended largely from local Natufian-related hunter-gatherers. |
| migration | Early farmers of Anatolia → Early farmers associated with Starčevo–Körös–Criș | high | Farming reached southeastern Europe in the mid-7th millennium BCE with people of Anatolian-related ancestry. |
| ancestry | Early farmers associated with Starčevo–Körös–Criș → LBK-associated farmers | high | The first farmers of central Europe descended from groups that passed through southeastern Europe with limited hunter-gatherer admixture. |
| ancestry | Early farmers of Anatolia → Early Neolithic farmers of Iberia | high | Early farmers of Iberia carried mostly Anatolian-farmer-related ancestry. |
| ancestry | Early Neolithic farmers of Iberia → Neolithic farmers of Britain | medium | British Neolithic farmers show affinity with Iberian Neolithic farmers, suggesting descent mainly from farmers who spread along the Mediterranean. |
| continuity | Early Neolithic farmers of Iberia → Chalcolithic people of Iberia (including Beaker-associated individuals) | medium | Most Copper Age Iberians, including most Beaker-associated individuals, resemble earlier Iberian populations. |
| ancestry | Caucasus hunter-gatherers (CHG) → Caucasus–Lower Volga cline Eneolithic (Berezhnovka) | high | The Caucasus–Lower Volga cline is rich in Caucasus hunter-gatherer-related ancestry. |
| ancestry | Caucasus–Lower Volga cline Eneolithic (Berezhnovka) → Volga cline Eneolithic (Khvalynsk, Ekaterinovka) | high | Caucasus–Lower Volga-related ancestry contributed to Eneolithic people of the middle Volga, in proportions that vary along a cline. |
| ancestry | Eastern hunter-gatherers (EHG / Sidelkino cluster) → Volga cline Eneolithic (Khvalynsk, Ekaterinovka) | high | Eastern hunter-gatherer-related ancestry is the other end of the Volga cline. |
| ancestry | Caucasus–Lower Volga cline Eneolithic (Berezhnovka) → Serednii Stih-associated individuals (Dnipro cline) | high | Serednii Stih-associated people formed as Caucasus–Lower Volga-related people mixed with Ukraine Neolithic hunter-gatherers. |
| ancestry | Serednii Stih-associated individuals (Dnipro cline) → Yamnaya-associated individuals | medium | Yamnaya ancestors are modelled as forming from Serednii Stih-related groups around 4000 BCE. |
| ancestry | Yamnaya-associated individuals → Beaker-associated individuals, central and northwest Europe | medium | Most Beaker-associated individuals outside Iberia carry steppe-related ancestry, related to that of Yamnaya-associated groups. |
| ancestry | Middle–Late Bronze Age steppe (Sintashta, Andronovo, Srubnaya-associated) → Ancestral North Indians (ANI, modelled) | medium | Steppe-related ancestry, with the profile of Middle–Late Bronze Age steppe groups, reached South Asia via Central Asia after about 2000 BCE and contributed to Ancestral North Indians. |
| ancestry | Indus Periphery Cline and the Rakhigarhi individual → Ancestral North Indians (ANI, modelled) | medium | Indus Periphery-related ancestry contributed to Ancestral North Indians. |
| ancestry | Indus Periphery Cline and the Rakhigarhi individual → Ancestral South Indians (ASI, modelled) | medium | Indus Periphery-related ancestry contributed to Ancestral South Indians. |
| ancestry | Ancestral Ancient South Asians (AASI, modelled) → Ancestral South Indians (ASI, modelled) | medium | Ancestry related to South Asian hunter-gatherers (AASI) contributed to Ancestral South Indians. |
| ancestry | Ancestral Ancient South Asians (AASI, modelled) → Indus Periphery Cline and the Rakhigarhi individual | medium | The Indus Periphery profile includes ancestry related to South and Southeast Asian hunter-gatherers. |
| ancestry | Early farmers of the Zagros → Indus Periphery Cline and the Rakhigarhi individual | low | Proposed: ancestry related to early Iranian farmers spread east into South Asia. Contested: later work finds the Iranian-related ancestry in the Indus Periphery split before the Zagros farmers' lineage. |
| ancestry | Yellow River basin Neolithic farmers → West Liao River basin Neolithic and Bronze Age people | medium | Late Neolithic people of the West Liao River show increased affinity to Yellow River farmers, coinciding with intensified farming. |
| ancestry | Amur River basin hunter-gatherers → West Liao River basin Neolithic and Bronze Age people | medium | Bronze Age people of the West Liao River show increased affinity to Amur River populations, coinciding with pastoralism. |
| shared_ancestry | Jōmon-associated hunter-gatherers ↔ Amur River basin hunter-gatherers | medium | Jōmon-associated people and Amur Basin hunter-gatherers share a deeply splitting East Asian lineage. |
| shared_ancestry | Jōmon-associated hunter-gatherers ↔ Iron Age people of Taiwan | medium | Jōmon-associated people and people of Iron Age Taiwan share a deeply splitting lineage. |
| ancestry | Jōmon-associated hunter-gatherers → Kofun-period individuals (Japan) | medium | Kofun-period people carried Jōmon-related ancestry alongside later Northeast Asian- and East Asian-related ancestry. |
| ancestry | Hòabìnhian-associated hunter-gatherers → Neolithic farmers of mainland Southeast Asia (Man Bac) | medium | Neolithic farmers of northern Vietnam carried ancestry related to local hunter-gatherers as well as to southern Chinese farmers. |
| split | Founding population of Native Americans (inferred) → Ancient Beringians (Upward Sun River) | medium | Ancient Beringians branched from the founding population of Native Americans about 22,000–18,000 years ago (in one demographic model). |
| ancestry | Founding population of Native Americans (inferred) → Anzick-1 (Clovis-associated) | high | Anzick-1 is more closely related to all Indigenous Americans than to any other group. |
| ancestry | Founding population of Native Americans (inferred) → Early Holocene people of Central and South America | high | Central and South Americans radiated rapidly from one of the two early Native American branches. |
| shared_ancestry | Anzick-1 (Clovis-associated) ↔ Early Holocene people of Central and South America | medium | Some of the oldest Central and South Americans share an affinity with Anzick-1 that later South Americans lack. |
| shared_ancestry | Early Holocene people of Central and South America ↔ Archaic Age people of the Caribbean | medium | Archaic Age Caribbean people descend from a deeply divergent population closest to Central and northern South Americans. |

## Disagreements represented

- **When did the main Neandertal admixture happen?** (narrowed). Estimates range from 37,000–86,000 years ago (linkage disequilibrium in present-day genomes) to 45,000–49,000 years ago (anchored by a ~45,000-year-old genome). Recent estimates that use early ancient genomes cluster around 50,000–45,000 years ago.
- **How much Neandertal ancestry do non-Africans carry?** (narrowed). Estimates differ with the reference Neandertal genome and method: 1.5–2.1% with the Altai genome, 1.8–2.6% with the closer Vindija genome, about 2.3% in a demographic model.
- **How did Yamnaya-associated ancestry form?** (open). All models combine southern (Caucasus/Near Eastern-related) and northern (eastern European hunter-gatherer-related) ancestry, but they differ in the sources and routes: EHG plus a Near Eastern-related population; a large CHG-related or Iranian farmer-related contribution; a contribution from Middle Don hunter-gatherers; or about four-fifths Caucasus–Lower Volga-related ancestry plus Ukraine Neolithic hunter-gatherer-related ancestry via Serednii Stih-related groups.
- **Did early Iranian farmers spread east into South Asia?** (open). One study describes ancestry related to early Iranian farmers spreading east into South Asia. Later work with an Indus Valley Civilization genome finds that the Iranian-related ancestry in the Indus Periphery split before the lineage of Zagros farmers, which argues against a spread of western Iranian farmers.
- **Which cluster do the Goyet Gravettian individuals belong to?** (open). Fu et al. 2016 grouped Gravettian-associated individuals from Goyet with the Věstonice cluster; Posth et al. 2023 find them genetically intermediate between the Věstonice and Fournol clusters. They are left unassigned here.
- **When did people first enter the Americas?** (open). Genetic models differ: a single founding wave no earlier than 23,000 years ago, or a founding population that split from East Asians about 36,000 years ago with a long period of structure in Beringia. Footprints at White Sands dated about 23,000–21,000 years ago place people in North America during the Last Glacial Maximum; their dating has been debated.
- **Where does the Australasian-related signal in some Native Americans come from?** (open). One study attributes it to an additional founding population ('Population Y'); another attributes distant Australo-Melanesian sharing to later gene flow. The source population is unsampled.
- **How did Levant-related ancestry reach eastern African herders?** (open). The Levant-related ancestry of early eastern African herders could reflect migration from the Levant or a shared ancestral population that lived earlier in Africa or the Near East; the study that reports it offers both explanations.
- **How did Papuan-related ancestry arrive in Vanuatu?** (narrowed). Studies agree that Papuan-related ancestry arrived soon after first settlement and came to dominate. They differ in timing (by ~2,300 vs from ~2,500 years ago) and in emphasis: one large movement, or repeated, incremental, sex-biased admixture.

## Problems with this population list

Kept by hand; read before trusting any row above.

### Naming inconsistencies
- **One ancestry, several names.** WHG ≡ Oberkassel cluster (Posth 2023), which overlaps with the later part of the Villabruna cluster (Fu 2016). EHG ≡ Sidelkino cluster. ANE is named after Mal'ta but also includes Afontova Gora. We use the most widely used label and list the others as aliases with who uses them.
- **Labels mix kinds of names.** AADR Group IDs combine modern country, site, archaeological period and culture (`Russia_Samara_EBA_Yamnaya`). Cultural tokens are sometimes absent: Iberian Beaker-associated individuals are labelled `Spain_C`, so Beaker association cannot be recovered from labels.
- **Labels can carry anachronisms.** `Belize_11700BP_Archaic_Maya` names a much later identity. We never surface such labels as population names; they stay as raw data on the sample card.
- **Numbered and outlier suffixes** (`-1`, `BA1-1`, `-oSteppe`, `-oEastAsia`, `-Dup`) are curation markers, not populations. The default membership rule excludes outliers and duplicates. One population (`iberia-chalcolithic-steppe-related`) deliberately uses an outlier label because the outliers are the point.

### Overlapping or nested definitions
- **Clines are not clusters.** The Volga, Dnipro and CLV clines (Lazaridis 2025) are gradients. Our populations take sites near one end (Berezhnovka for CLV, Khvalynsk/Ekaterinovka for Volga), so members are genetically heterogeneous.
- **Region-and-period groupings.** `geographic_population` entries (Iberian Bronze Age, southern British LBA–IA, Central Andes, West Liao River, Iron Age Taiwan, Early Holocene Central and South America, post-Lapita Vanuatu) are not genetic clusters. They are shown with a distinct category badge, and their ancestry composition is given only where a model exists.
- **Inferred-only populations** (shared non-African ancestors, Basal Eurasian, AASI, ASI, ANI, the founding population of Native Americans, ancestors of Australo-Papuans, the Bismarck-related source) have no sampled members. Their time ranges are display windows, not lifespans, and they are never drawn as map fields.
- **Single individuals as populations** (Ust'-Ishim, Oase 1, Tianyuan, Anzick-1, Mota, the Rakhigarhi IVC genome) stand in for unsampled groups. They are always badged *sparse* and described as individuals.

### Culture-vs-genetics conflation risks
- 26 populations are `archaeological_population` (defined by burial context: Yamnaya, Corded Ware, Bell Beaker, LBK, Jōmon, …). Their names use "-associated" to avoid implying that a pot style is a people. Where genetics and culture diverge, the list says so: Gravettian → two clusters; Beaker → different ancestry in Iberia vs central Europe vs Britain; Pastoral Neolithic traditions → no genetic difference.
- **Language labels** appear only as associations ("associated with the spread of Bantu languages"). Our population is defined genetically, never by language.
- **Historical-polity groupings** (Xiongnu-period, Mongol-period, medieval Swahili coast) are date-and-place groupings. They do not imply a single ethnic identity.

### Regions and periods with too few samples
- Before 15,000 BCE: about 150 individuals worldwide in AADR v66.p1. Most populations in this range have 1–11 members.
- **South Asia:** one IVC-context genome. The 11 Indus Periphery outliers are not separately labelled in AADR v66.p1 (membership incomplete).
- **Sub-Saharan Africa:** fewer than 300 ancient individuals in total, very unevenly spread (Kenya/Tanzania, Malawi, South Africa, Cameroon).
- **Australia and New Guinea:** only a handful of late (<1,500 years) individuals. No curated population yet.
- **The Americas before 8,000 years ago:** about 30 individuals.
- **Southeast Asia before 4,000 years ago:** 2 Hòabìnhian-associated individuals.
- **Europe after 8,000 years ago is heavily oversampled** relative to everywhere else. The map's density layer must make this visible.

### Contested or model-dependent claims carried in the list
See `data/curated/disagreements.json`: Neandertal admixture date and proportion, Yamnaya formation (5 published models), Iranian-related ancestry in South Asia, Goyet Gravettian assignment, timing of entry into the Americas, "Population Y", Levant-related ancestry in eastern Africa, and the tempo of Papuan-related arrival in Vanuatu.

### Not included (deliberately or not yet)
- **Polynesian settlement sequence** (Ioannidis 2021): evidence is from present-day genomes; deferred to Phase 9 (modern populations).
- **Present-day populations** of any kind: Phase 9.
- **Medieval and historical Europe** (Avars, Vikings, Anglo-Saxons, …): abundant in AADR but outside the scope of the checked literature so far. These individuals appear on the map unassigned.
- **CLV-cline sites beyond Berezhnovka; the Indus Periphery individuals:** need individual-ID lists from the papers' supplements.
- **Usatove-associated individuals** (Nikitin 2025) and **Steppe Maikop** (Wang 2019): checked claims exist, but their membership needs care. Proposed for V0.2.
