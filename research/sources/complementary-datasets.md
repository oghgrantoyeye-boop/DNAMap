# Complementary datasets (beyond AADR)

V0.1 uses **only AADR** for individuals, plus our own curated research data. The table below lists datasets that could fill AADR's gaps later, with what we could verify about each.

| dataset | what it adds | format | licence / terms (verified?) | use in V1? |
|---|---|---|---|---|
| **Poseidon Community Archive** (Schmid et al. 2024, eLife reviewed preprint) | Per-publication packages of genotypes plus `.janno` context tables, versioned, with an open web API. Can include data not yet in AADR. | PLINK/EIGENSTRAT + `.janno` TSV + BibTeX | **Not verified.** The website did not render for our fetcher, and the GitHub API is outside this session's access. Licence may differ per package. Recorded in BLOCKED.md. | Later: cross-check AADR coordinates/dates; add missing samples |
| **AmtDB** (Ehler et al. 2019, NAR, doi:10.1093/nar/gky843) | Ancient mitochondrial genomes with metadata, v1.010 (2026-08-11), 3,759 samples | FASTA + CSV | Site footer says **CC-BY-4.0**; cite the paper | Later: mtDNA-only samples (mark as "mtDNA only") |
| **p3k14c** (Bird et al. 2022, Sci Data, doi:10.1038/s41597-022-01118-7) | About 180,000 archaeological radiocarbon dates worldwide. Shows *archaeological* activity where aDNA is absent, the best counterweight to aDNA sampling bias. | CSV via tDAR / GitHub / Zenodo (R package) | Article is CC-BY 4.0; the **data licence is not verified**. Some subsets are restricted (US/Canada locations obfuscated to county centroids). | Phase 5 candidate: "archaeological activity" density layer |
| **XRONOS** (Roe et al. 2025, J. Comput. Appl. Archaeol.) | Open chronometric database (radiocarbon and other dates) with per-record references | Web/API | Article CC-BY 4.0; per the site, contributors keep control of their data's licence, so **per-record terms apply**. The site timed out for us. | Phase 5 candidate |
| **ISOGG Y tree / YFull** | Haplogroup nomenclature | Web | ISOGG and YFull have their own terms (not verified) | Not needed: AADR already supplies haplogroup calls |
| **Natural Earth** | Basemap | Shapefile/GeoJSON | Public domain (verified) | **Yes** (see geography.md) |

## Principles for adding any dataset
1. Record the version, licence and citation in `SOURCES.md` *before* use (CLAUDE.md).
2. Datasets must be joinable to AADR without guesswork. Where IDs differ, matching rules go in an overrides file with reasons.
3. Each dataset keeps its own provenance on every row it contributes.
