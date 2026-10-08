"""Pinned description of the AADR release this project uses.

Source: Harvard Dataverse, doi:10.7910/DVN/FFIDCW ("The Allen Ancient DNA
Resource (AADR): A curated compendium of ancient human genomes").
Release v66.p1 (Dataverse version 14.0, released 2026-06-08). Licence: CC0 1.0.

File ids and md5 checksums were read from the Dataverse API
(`/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/FFIDCW`) on
2026-10-08 and cross-checked against the release's own `v66.p1__files.md5sum`.

We only need metadata (.anno) for the website; the genotype files (.geno,
1.9-12 GB each) are listed for completeness but are not downloaded by default.
"""

DATASET_DOI = "doi:10.7910/DVN/FFIDCW"
DATAVERSE_API = "https://dataverse.harvard.edu/api"
RELEASE = "v66.p1"
DATAVERSE_VERSION = "14.0"
RELEASE_DATE = "2026-06-08"
LICENCE = "CC0-1.0"

# name -> (dataverse file id, md5, size in bytes, download by default)
FILES: dict[str, tuple[int, str, int, bool]] = {
    "aadr_v66.p1__README.docx": (13994530, "f92df8d4b1fb863bcc7601208153ed34", 271752, True),
    "v66.p1__files.md5sum": (13995422, "ef9e9d78750808e28d33b4074098c5e8", 1769, True),
    # 1240K panel annotation: the primary metadata table we ingest.
    "v66.p1_1240K.aadr.PUB.anno": (13994515, "a2db1ac16f0f3558ed66fb251e1d5c7d", 13443726, True),
    # Human Origins panel annotation: superset of present-day individuals; kept for reference.
    "v66.p1_HO.aadr.PUB.anno": (13994528, "548b011b4adbcd46f0ff66b957c59c3f", 15465906, True),
    "v66.p1_2M.aadr.PUB.anno": (13994518, "02a75f75de319829e89dd10a0d0f62c5", 13450350, False),
    "v66.p1_1240K.aadr.patch.PUB.ind": (13994513, "19a434ac954bcd10dbb8dba1d1188a09", 1017460, False),
    "v66.p1_1240K.aadr.patch.PUB.snp": (13994514, "50f66178fc81b8aa087cc4b135317e59", 77679819, False),
    "v66.p1_1240K.aadr.patch.PUB.geno": (13994829, "5ea1d2675a271c81e55b8f8b08b3ff3b", 7117276654, False),
}

PRIMARY_ANNO = "v66.p1_1240K.aadr.PUB.anno"
