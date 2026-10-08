"""Build data/curated/sources.json from research/papers notes plus pinned datasets.

Usage (from pipeline/): uv run python -m curation.build_sources
"""

from __future__ import annotations

import json
from pathlib import Path

from aadr.manifest import DATASET_DOI, LICENCE, RELEASE, RELEASE_DATE
from curation.paper_notes import load_notes

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "data" / "curated" / "sources.json"

DATASETS = [
    {
        "id": "aadr",
        "type": "dataset",
        "title": "The Allen Ancient DNA Resource (AADR): A curated compendium of ancient human genomes",
        "citation": f"Mallick S, Reich D. The Allen Ancient DNA Resource (AADR), Harvard Dataverse, {DATASET_DOI}, release {RELEASE} ({RELEASE_DATE}); and Mallick S, Micco A, Mah M, et al. (2024) Sci Data 11:182.",
        "doi": DATASET_DOI.removeprefix("doi:"),
        "url": "https://doi.org/" + DATASET_DOI.removeprefix("doi:"),
        "year": 2026,
        "verification": "not_applicable",
        "status": "usable",
        "licence": LICENCE,
        "version": RELEASE,
        "note_path": "research/sources/aadr.md",
    },
    {
        "id": "naturalearth",
        "type": "dataset",
        "title": "Natural Earth",
        "citation": "Natural Earth. Free vector and raster map data. naturalearthdata.com",
        "url": "https://www.naturalearthdata.com/",
        "year": 2026,
        "verification": "not_applicable",
        "status": "usable",
        "licence": "Public domain",
        "note_path": "research/sources/geography.md",
    },
]


def build() -> dict:
    sources = list(DATASETS)
    for n in load_notes():
        sources.append(
            {
                "id": n.source_id,
                "type": "paper",
                "title": n.title,
                "citation": n.citation,
                "doi": n.doi,
                "url": f"https://doi.org/{n.doi}",
                "pmcid": n.pmcid,
                "year": n.year,
                "verification": n.verification,
                "status": n.status,
                "note_path": n.note_path,
            }
        )
    return {"version": 1, "generated_by": "pipeline/curation/build_sources.py", "sources": sources}


def main() -> None:
    OUT.write_text(json.dumps(build(), indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
