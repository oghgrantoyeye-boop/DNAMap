# Allen Ancient DNA Resource (AADR)

## Identity
- **Name:** The Allen Ancient DNA Resource (AADR): A curated compendium of ancient human genomes.
- **Maintainers:** Swapan Mallick, David Reich (Reich Lab, Harvard Medical School).
- **Host:** Harvard Dataverse, persistent ID `doi:10.7910/DVN/FFIDCW` (https://doi.org/10.7910/DVN/FFIDCW). The Reich Lab website links to this Dataverse page.
- **Release used:** **v66.p1**, Dataverse version 14.0, released **2026-06-08** (checked 2026-10-08 via the Dataverse API).
- **Release history (from the release README):** v37.2 Feb 2019 · v42.4 Mar 2020 · v44.3 Jan 2021 · v50.0 Oct 2021 · v50.0.p1 Aug 2022 · v52.2 Aug 2022 · v54.1 Nov 2022 · v54.1.p1 Mar 2023 · v62.0 Sep 2024 · v66.0 Apr 12 2026 · **v66.p1 Jun 8 2026**.
- **Why v66.p1 and not v66.0:** v66.0 and v62.0 were decommissioned. The `.p1` versions are identical except that data from 161 present-day individuals (Jacobs et al. 2019, Papuan genomes) were removed: they had been released by mistake and are only legitimately available through the EGA Data Access Committee (EGAS00001003054). The maintainers ask that decommissioned versions not be used. **We use only v66.p1 and must never redistribute data from the decommissioned versions.**

## Checking the leads from the planning conversation
- Lead (a), "AADR v66.0, released around April 2026, with roughly 17,600 ancient individuals": **partly right, partly outdated.** v66.0 was released 2026-04-12 but is decommissioned, replaced by v66.p1. In the README's table, the figure of 17,629 unique individuals (13,571 ancient) belongs to the *previous* release (v54.1.p1). v66.p1 has 23,089 unique individuals on the 1240k panel (19,118 ancient, 3,971 present-day). Our own count of distinct ancient `Individual ID`s in the 1240K `.anno` is 17,630; the README counts 19,118 ancient "individuals" because it counts rows, which include multiple data versions of the same person.
- Lead (b), "an existing open-source AADR explorer (Python/Polars → Parquet → DuckDB-WASM → Next.js/deck.gl/MapLibre)": **not found** (web searches on 2026-10-08). Related tools that do exist are listed in `prior-art.md`. We do not depend on this lead.

## Licence and terms
- **Dataverse licence: CC0 1.0** (public-domain dedication; field `license.name = "CC0 1.0"` in the Dataverse API).
- **Citation requested by the maintainers** (a scholarly norm, not a CC0 condition): (1) the Dataverse dataset and version; (2) Mallick S, Micco A, Mah M, Ringbauer H, Lazaridis I, Olalde I, Patterson N, Reich D (2024) *The Allen Ancient DNA Resource (AADR) a curated compendium of ancient human genomes.* Sci Data 11:182. doi:10.1038/s41597-024-03031-7. They also ask that the original publications for each individual be cited. These are listed in the `.anno` file (publication key + DOI), and we will surface them per sample.
- **Implication for a public website:** redistributing derived metadata (coordinates, dates, labels) is allowed. We will attribute AADR and link each sample to its original publication. We do not redistribute genotypes.
- **Ethical note:** many samples come from Indigenous ancestors (Americas, Oceania, Africa), and their original papers describe community consultation. Data from AADR is CC0, but the UI must be respectful: no images of remains, and no claims that link ancient individuals to present-day communities beyond what the papers support.

## Files (v66.p1)
Five SNP-panel datasets: 1240K, 2M, 2M_compatibility, compatibility_HO, HO. Each has:
- `.anno`: tab-separated, UTF-8, one row per *genetic ID* (a data version of an individual), 49 columns. **This is the only file we need.** About 13 MB for 1240K.
- `.ind`: genetic ID, sex, group label.
- `.snp`: SNP positions (hg19).
- `.geno`: genotypes in the new "transpose_packed" (tgeno) format. 1.8–12 GB. Not downloaded.
- Plus a README (.docx), a README_MT, an mtDNA FASTA, and `v66.p1__files.md5sum`.

We ingest `v66.p1_1240K.aadr.PUB.anno`. All ancient individuals are present in it; the HO `.anno` adds only present-day HO-array individuals, which are out of scope for V1.

`pipeline/aadr/manifest.py` pins the Dataverse file IDs and md5s. `pipeline/aadr/download.py` fetches and verifies them.

## Columns relevant to us
| short name (ours) | AADR header (abridged) | use |
|---|---|---|
| genetic_id | Genetic ID (suffix = data type: .AG, .TW, .SG, .DG, .HO, …) | row key |
| persistent_id | Persistent Genetic ID (new; stable across releases) | stable key for overrides |
| individual_id | Individual ID (formerly Master ID) | **individual key**; several rows can share one |
| skeletal_code, skeletal_element | | sample card |
| first_publication, publication, doi | publication keys (e.g. `HaakReichNature2015`), DOI of this data version | provenance |
| data_repository | ENA/other accession | sample card |
| date_method | free text: "Direct: IntCal20", "Context: Archaeological", … | dating method class + warnings |
| date_mean_bp, date_sd_bp | OxCal mean/sigma (direct) or midpoint / uniform SD (contextual) | numeric date |
| full_date | free text, e.g. `6221-5986 calBCE (7205±50 BP, OxA-7738)` or `2600-2000 BCE` | **95.4% range**, kept verbatim |
| group_id | Group ID, e.g. `Russia_Samara_EBA_Yamnaya`, `Belgium_N-o` | source label (verbatim) |
| locality, political_entity | site name; modern country | sample card; *not* used for population identity |
| latitude, longitude | decimal degrees, variable precision | location (site-level) |
| data_suffixes, data_type, snps_* , coverage | data quality | representative-row choice, quality filter |
| molecular_sex | M/F/U (+ aneuploidies) | sample card |
| family_relations | relatives in dataset | later (kinship) |
| y_hg_*, mt_hg | haplogroups | sample card |
| assessment, assessment_warnings | Pass / PROVISIONAL_PASS / Questionable / CRITICAL / MERGE_* | quality flag |

## Quirks found (see `aadr-v66.p1-inspection.md` for numbers)
1. **Multiple rows per individual:** 1,095 ancient individuals have 2–11 rows (capture vs shotgun, re-publication). 66 of them have *different Group IDs* across rows (e.g. `ASZK-1.SG` = `Romania_Hun-oEastAsia` vs `ASZK-1_alt.SG` = `Romania_Hun`); 3 have different dates; 2 have different latitudes. We keep one representative row per individual (the one with most SNPs hit on 1240k, as AADR advises) and record the alternatives.
2. **Dates:** `date_mean_bp` and `date_sd_bp` are always numeric. `full_date` appears in about 60 textual variants (R_Combine, unions, `calBCE-calCE` spans, en-dashes, `>` open bounds). Our parser handles 100% of the 19,119 non-present-day rows. The method text has 913 distinct values, and 1,652 rows carry WARNING/CAUTION notes (e.g. missing lab code, marine/freshwater reservoir not applied). 60 rows have SD = 0. In 73 rows the midpoint of the full-date range and the mean differ by more than 500 years; these need checking.
3. **Present-day rows** have date method `Modern` and BP 0. One 20th-century individual has BP −4 (`1954 CE`).
4. **Coordinates:** there is no precision field. Decimal places vary from 0 to 9, so we use them as a rough proxy. Coordinates are site-level: up to 466 individuals share one coordinate pair. 90 ancient rows lack coordinates.
5. **Group labels** follow a loose `Country_Site_Period_Culture[-suffix]` convention. Suffixes include `-o` (outlier) with a direction (`-oEastAsia`, `-oSteppe`, `-oWHG`, `-ohighEEF`), numeric cluster suffixes (`-1`, `BA1-1`), `-Dup`, `_rel`, and one `DontUseHighlyProblematic`. The 3,644 distinct labels include 1,842 with a single individual. **Labels embed modern countries and sometimes later identities** (e.g. `Belize_11700BP_Archaic_Maya` names a much later cultural group for an 11,700-year-old individual), which is why we never use a label as a population name directly.
6. **No `Ignore_` labels** remain in v66.p1, although older AADR documentation describes them.
7. **Header bug:** two adjacent columns are both headed "Sum total of ROH segments >20cM".
8. **Indus Periphery individuals** (Narasimhan 2019) do not carry a distinct label in v66.p1. They sit inside numbered clusters such as `Turkmenistan_BA1-1` and `Iran_ShahriSokhta_BA2-2`, so assigning them needs the paper's individual-ID list.
9. **Assessment:** 372 ancient rows are CRITICAL (+83 provisional critical) and 962 Questionable. We exclude CRITICAL rows from population membership by default and show them greyed out with their warning.
10. **The README's counts** describe rows, not unique individuals (see the lead check above).
