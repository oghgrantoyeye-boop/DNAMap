"""Check DOI / PMCID / year consistency in research/papers/*.md against Europe PMC.

Usage: python3 scripts/check_paper_notes.py
Prints one line per note: OK, or what does not match. Exit code 1 on any mismatch.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"


def lookup(doi: str) -> dict | None:
    q = urllib.parse.quote(f'DOI:"{doi}"')
    with urllib.request.urlopen(f"{API}?query={q}&format=json&resultType=lite", timeout=60) as r:
        res = json.loads(r.read())["resultList"]["result"]
    return res[0] if res else None


def main() -> int:
    bad = 0
    for note in sorted(Path("research/papers").glob("*-*.md")):
        text = note.read_text()
        m = re.search(r"\*\*DOI:\*\*\s*(10\.\S+)", text)
        if not m:
            print(f"NO-DOI  {note.name}")
            bad += 1
            continue
        doi = m.group(1).rstrip("·").strip()
        pmc = re.search(r"\bPMC\d+\b", text.split("**Verification", 1)[0])
        meta = lookup(doi)
        if not meta:
            print(f"MISSING {note.name}: {doi} not found")
            bad += 1
            continue
        problems = []
        if pmc and meta.get("pmcid") != pmc.group(0):
            problems.append(f"pmcid note={pmc.group(0)} epmc={meta.get('pmcid')}")
        year = re.search(r"\((\d{4})\)", text)
        if year and meta.get("pubYear") and abs(int(year.group(1)) - int(meta["pubYear"])) > 1:
            problems.append(f"year note={year.group(1)} epmc={meta['pubYear']}")
        first_author = meta.get("authorString", "").split(",")[0].split()[0] if meta.get("authorString") else ""
        cit = re.search(r"\*\*Citation:\*\*\s*([^\s,]+)", text)
        if cit and first_author and first_author.lower() not in cit.group(1).lower():
            problems.append(f"first author note={cit.group(1)} epmc={first_author}")
        if problems:
            bad += 1
            print(f"MISMATCH {note.name}: " + "; ".join(problems) + f" [{meta.get('title','')[:70]}]")
        else:
            print(f"OK      {note.name}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
