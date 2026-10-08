"""Merge drafted population overviews into the curated files.

Usage (from pipeline/):  uv run python -m curation.merge_overviews [--dry-run]

Reads data/curated/overviews/*.json. Each draft file:
  {
    "group": "steppe",
    "evidence": [ {id, source_id, claim, location, verification, confidence, stance, note?} ],
    "populations": { "<population id>": { "overview": [ {heading, text, evidence_ids} ] } }
  }
New evidence is appended to evidence.json (ids must be new). Each population gets its
`overview`, and any new evidence the overview cites is added to its `evidence_ids`.
Merged draft files are moved to research/notes/overview-drafts/ as provenance, so the
curated files stay the single source of truth. Run validation afterwards (it is part of
`python -m build`).
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CUR = REPO / "data" / "curated"
DRAFTS = CUR / "overviews"
ARCHIVE = REPO / "research" / "notes" / "overview-drafts"


def dump(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def main() -> int:
    dry = "--dry-run" in sys.argv
    files = sorted(DRAFTS.glob("*.json"))
    if not files:
        print("no drafts to merge")
        return 0
    ev_doc = json.loads((CUR / "evidence.json").read_text())
    pop_doc = json.loads((CUR / "populations.json").read_text())
    evidence = {e["id"]: e for e in ev_doc["evidence"]}
    pops = {p["id"]: p for p in pop_doc["populations"]}
    sources = {s["id"] for s in json.loads((CUR / "sources.json").read_text())["sources"]}
    errors: list[str] = []
    added_ev = added_pop = 0
    for f in files:
        d = json.loads(f.read_text())
        for e in d.get("evidence", []):
            if e["id"] in evidence:
                errors.append(f"{f.name}: evidence id {e['id']} already exists")
                continue
            if e["source_id"] not in sources:
                errors.append(f"{f.name}: {e['id']} unknown source {e['source_id']}")
                continue
            if not e["id"].startswith(f"ev-{e['source_id']}-"):
                errors.append(f"{f.name}: {e['id']} must start with ev-{e['source_id']}-")
                continue
            evidence[e["id"]] = e
            ev_doc["evidence"].append(e)
            added_ev += 1
        for pid, upd in d.get("populations", {}).items():
            if pid not in pops:
                errors.append(f"{f.name}: unknown population {pid}")
                continue
            p = pops[pid]
            for sec in upd["overview"]:
                for i in sec["evidence_ids"]:
                    if i not in evidence:
                        errors.append(f"{f.name}: {pid} cites unknown evidence {i}")
                    elif i not in p["evidence_ids"]:
                        p["evidence_ids"].append(i)
            p["overview"] = upd["overview"]
            added_pop += 1
    if errors:
        print("\n".join(errors))
        print(f"{len(errors)} problems; nothing written")
        return 1
    print(f"{added_pop} populations get an overview; {added_ev} new evidence statements")
    if dry:
        return 0
    dump(CUR / "evidence.json", ev_doc)
    dump(CUR / "populations.json", pop_doc)
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    for f in files:
        shutil.move(str(f), ARCHIVE / f.name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
