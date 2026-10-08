"""Parse research/papers/*.md notes into Source records.

The notes are the human-checked record of what each paper says. Their header
lines follow a fixed format (see research/papers/README.md):

    # <Title line>
    - **Citation:** <full citation>
    - **DOI:** <doi> · [PMCxxxx ·] **Verification:** <full_text|abstract_only ...>

`source_id` is the note filename without the topic prefix, e.g.
`steppe-haak2015.md` -> `haak2015`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PAPERS = REPO / "research" / "papers"


@dataclass(frozen=True)
class PaperNote:
    source_id: str
    topic: str
    title: str
    citation: str
    doi: str
    pmcid: str | None
    verification: str  # full_text | abstract_only
    year: int
    note_path: str
    status: str  # "usable" | "erratum" | "unmined"


def parse_note(path: Path) -> PaperNote:
    text = path.read_text()
    topic, sid = path.stem.split("-", 1)
    title = text.splitlines()[0].lstrip("# ").strip()
    cit = re.search(r"\*\*Citation:\*\*\s*(.+)", text)
    doi = re.search(r"\*\*DOI:\*\*\s*(10\.[^\s·]+)", text)
    pmc = re.search(r"\b(PMC\d+)\b", text.split("**Verification", 1)[0])
    ver = re.search(r"\*\*Verification:\*\*\s*([a-z_]+)", text)
    year = re.search(r"\((\d{4})\)", cit.group(1) if cit else "")
    if not (cit and doi and ver and year):
        raise ValueError(f"{path.name}: missing citation/doi/verification/year")
    status = "usable"
    if "WITH ERRATUM" in title:
        status = "erratum"  # usable only for claims unaffected by the erratum (see note)
    if "not yet mined" in text or "Not used for V1" in text:
        status = "unmined"
    return PaperNote(
        source_id=re.sub(r"[^a-z0-9]", "", sid.lower()),
        topic=topic,
        title=title,
        citation=cit.group(1).strip(),
        doi=doi.group(1),
        pmcid=pmc.group(1) if pmc else None,
        verification=ver.group(1),
        year=int(year.group(1)),
        note_path=str(path.relative_to(REPO)),
        status=status,
    )


def load_notes() -> list[PaperNote]:
    notes = [parse_note(p) for p in sorted(PAPERS.glob("*-*.md"))]
    seen: dict[str, str] = {}
    for n in notes:
        if n.source_id in seen:
            raise ValueError(f"duplicate source_id {n.source_id}: {seen[n.source_id]} and {n.note_path}")
        seen[n.source_id] = n.note_path
    return notes


if __name__ == "__main__":
    for n in load_notes():
        print(f"| `{n.source_id}` | {n.citation} | [{n.doi}](https://doi.org/{n.doi}) | {n.verification} | {n.status} |")
