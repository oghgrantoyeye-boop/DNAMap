"""Check and apply rewritten population prose (research/notes/writing-style.md).

Usage (from pipeline/):  uv run python -m curation.apply_prose [--dry-run] [--only <group>]

Reads data/curated/prose/*.json. Each draft file:
  {
    "group": "archaic",
    "populations": {
      "<population id>": {
        "description": "<20-45 words>",
        "overview": [ {"heading": "...", "text": "...", "evidence_ids": ["ev-..."]} ],
        "caveats": ["..."]            (optional; omitted = leave the current caveats)
      }
    },
    "wanted": ["<facts that would help but are not in the evidence>"],
    "concerns": ["<anything in the curated data that looks wrong>"]
  }
Prose may cite any existing evidence statement; one the population does not already list is
added to its evidence_ids (and reported). No new evidence is created here: new claims go
through the overview brief (research/notes/overview-brief.md).

Errors stop the merge; warnings are printed. Applied drafts are moved to
research/notes/prose-drafts/ with the replaced text alongside, as provenance.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

from validation.validate import FORBIDDEN

REPO = Path(__file__).resolve().parents[2]
CUR = REPO / "data" / "curated"
DRAFTS = CUR / "prose"
ARCHIVE = REPO / "research" / "notes" / "prose-drafts"

HEADINGS = ["Who they were", "When and where", "Ancestry", "What came before and after", "What we cannot tell"]
DESC_WORDS = (15, 50)
SECTION_WORDS = (35, 125)
HYPHEN_RANGE = re.compile(r"\d-\d")  # number ranges take an en dash
FILLER = re.compile(r"\b(it is important to note|interestingly|plays? a key role|rich history|notably|fascinating)\b", re.I)
META = re.compile(r"\b(display window|this panel|the panel|stands in as)\b", re.I)


def words(t: str) -> int:
    return len(t.split())


def sentences(t: str) -> list[str]:
    return [s.strip().lower() for s in re.split(r"(?<=[.!?])\s+", t) if len(s.split()) > 5]


def check_text(where: str, text: str, errors: list[str], warnings: list[str]) -> None:
    for rx, why in FORBIDDEN:
        if rx.search(text):
            errors.append(f"{where}: {why}: {rx.search(text).group(0)!r}")
    if HYPHEN_RANGE.search(text):
        errors.append(f"{where}: number range with a hyphen; use an en dash (–): {HYPHEN_RANGE.search(text).group(0)!r}")
    if "�" in text:
        errors.append(f"{where}: replacement character in text")
    if m := FILLER.search(text):
        warnings.append(f"{where}: filler phrase {m.group(0)!r}")
    if m := META.search(text):
        warnings.append(f"{where}: note-to-self wording {m.group(0)!r}; put display notes in caveats")


def main() -> int:
    dry = "--dry-run" in sys.argv
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    files = [f for f in sorted(DRAFTS.glob("*.json")) if only is None or f.stem == only]
    if only and not dry:
        print("--only is for checking a single draft; apply all drafts together")
        return 2
    if not files:
        print("no prose drafts to apply")
        return 0
    pop_doc = json.loads((CUR / "populations.json").read_text())
    pops = {p["id"]: p for p in pop_doc["populations"]}
    evidence = {e["id"] for e in json.loads((CUR / "evidence.json").read_text())["evidence"]}
    errors: list[str] = []
    warnings: list[str] = []
    before: dict[str, dict[str, dict]] = {}
    added_links: list[str] = []
    n = 0
    for f in files:
        d = json.loads(f.read_text())
        before[f.name] = {}
        for pid, upd in d.get("populations", {}).items():
            where = f"{f.name}: {pid}"
            p = pops.get(pid)
            if not p:
                errors.append(f"{where}: unknown population")
                continue
            before[f.name][pid] = {k: p.get(k) for k in ("description", "overview", "caveats")}
            desc = upd.get("description", "").strip()
            if not desc:
                errors.append(f"{where}: description missing")
            elif not DESC_WORDS[0] <= words(desc) <= DESC_WORDS[1]:
                warnings.append(f"{where}: description is {words(desc)} words (aim {DESC_WORDS[0]}–{DESC_WORDS[1]})")
            check_text(f"{where} description", desc, errors, warnings)
            secs = upd.get("overview", [])
            if not secs:
                errors.append(f"{where}: no overview sections")
            order = [HEADINGS.index(s["heading"]) if s["heading"] in HEADINGS else -1 for s in secs]
            if -1 in order:
                errors.append(f"{where}: unknown heading in {[s['heading'] for s in secs]}")
            elif order != sorted(set(order)):
                errors.append(f"{where}: headings repeated or out of order: {[s['heading'] for s in secs]}")
            seen = {s: "description" for s in sentences(desc)}
            for s in secs:
                w = f"{where} [{s['heading']}]"
                if not s.get("evidence_ids"):
                    errors.append(f"{w}: cites no evidence")
                for i in s.get("evidence_ids", []):
                    if i not in evidence:
                        errors.append(f"{w}: unknown evidence {i}")
                    elif i not in p["evidence_ids"] and f"{pid} += {i}" not in added_links:
                        added_links.append(f"{pid} += {i}")
                if not SECTION_WORDS[0] <= words(s["text"]) <= SECTION_WORDS[1]:
                    warnings.append(f"{w}: {words(s['text'])} words (aim {SECTION_WORDS[0]}–{SECTION_WORDS[1]})")
                if len(s["text"]) > 1400:
                    errors.append(f"{w}: over 1400 characters (schema limit)")
                check_text(w, s["text"], errors, warnings)
                for sent in sentences(s["text"]):
                    if sent in seen:
                        errors.append(f"{w}: sentence repeats {seen[sent]}: {sent[:80]!r}")
                    seen[sent] = s["heading"]
            for c in upd.get("caveats", []) or []:
                check_text(f"{where} caveat", c, errors, warnings)
            n += 1
            if not dry:
                p["description"] = desc
                p["overview"] = secs
                if "caveats" in upd:
                    p["caveats"] = upd["caveats"]
                for s in secs:
                    for i in s["evidence_ids"]:
                        if i in evidence and i not in p["evidence_ids"]:
                            p["evidence_ids"].append(i)
    for w in warnings:
        print("warning:", w)
    for a in added_links:
        print("link:", a)
    if errors:
        print("\n".join(f"ERROR: {e}" for e in errors))
        print(f"{len(errors)} errors; nothing written")
        return 1
    print(f"{n} populations checked{'' if dry else ' and updated'}; {len(warnings)} warnings; {len(added_links)} evidence links added")
    if dry:
        return 0
    (CUR / "populations.json").write_text(json.dumps(pop_doc, indent=2, ensure_ascii=False) + "\n")
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    for f in files:
        d = json.loads(f.read_text())
        d["replaced"] = before[f.name]
        (ARCHIVE / f.name).write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
        f.unlink()
    return 0


if __name__ == "__main__":
    sys.exit(main())
