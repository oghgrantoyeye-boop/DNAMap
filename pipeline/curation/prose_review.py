"""Review sheet for prose drafts: every sentence beside the evidence it cites.

Usage (from pipeline/):  uv run python -m curation.prose_review <group> [<group> ...] [--flags-only]

For each population in data/curated/prose/<group>.json, prints each sentence of the
description and sections with the claims of the evidence its `support` entry cites, and
flags mechanical problems a reader should look at first:
  NO-SUPPORT   the sentence has no `support` entry (or its text does not match one)
  OUTSIDE      a support entry cites evidence that its section does not cite
  NUMBER       a number in the sentence appears in none of the cited claims
               (arithmetic on cited figures is allowed, so this is a prompt, not a verdict)
Read-only. The judgement (does the evidence carry the sentence?) stays with the reviewer.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CUR = REPO / "data" / "curated"
NUM = re.compile(r"\d[\d,]*(?:\.\d+)?")
WORDNUM = {
    "half": "50", "a third": "33", "two-thirds": "67", "a quarter": "25", "three-quarters": "75",
    "a fifth": "20", "two-fifths": "40", "four-fifths": "80", "a tenth": "10",
}


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(])", text) if s.strip()]


KA = re.compile(r"(\d+(?:\.\d+)?)\s*(?:ka|kya|kyr|ky|thousand)\b", re.I)


def numbers(s: str) -> set[str]:
    out = set()
    for m in KA.findall(s):  # "25 ka" and "25 thousand" also count as 25000
        out.add(str(int(round(float(m) * 1000))))
    for m in NUM.findall(s):
        v = m.replace(",", "").rstrip(".")
        if v:
            out.add(v.lstrip("0") or "0")
    return out


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().rstrip(".").lower()


def main(argv: list[str]) -> int:
    flags_only = "--flags-only" in argv
    groups = [a for a in argv if not a.startswith("--")]
    evidence = {e["id"]: e for e in json.loads((CUR / "evidence.json").read_text())["evidence"]}
    years = {s["id"]: str(s["year"]) for s in json.loads((CUR / "sources.json").read_text())["sources"]}
    total_flags = 0
    for g in groups:
        d = json.loads((CUR / "prose" / f"{g}.json").read_text())
        for pid, p in d["populations"].items():
            support = p.get("support", [])
            by_text = {norm(s["text"]): s for s in support}
            parts = [("description", p["description"], None)] + [(s["heading"], s["text"], set(s["evidence_ids"])) for s in p["overview"]]
            lines: list[str] = []
            flags = 0
            for where, text, sec_ids in parts:
                for sent in split_sentences(text):
                    entry = by_text.get(norm(sent))
                    if entry is None:  # tolerate small punctuation differences
                        entry = next((v for k, v in by_text.items() if k in norm(sent) or norm(sent) in k), None)
                    marks = []
                    ids = entry["evidence_ids"] if entry else []
                    if not entry:
                        marks.append("NO-SUPPORT")
                    if sec_ids is not None and any(i not in sec_ids for i in ids):
                        marks.append("OUTSIDE " + ",".join(i for i in ids if i not in sec_ids))
                    claims = " ".join(
                        evidence.get(i, {}).get("claim", "") + " " + evidence.get(i, {}).get("location", "") + " " + years.get(evidence.get(i, {}).get("source_id", ""), "")
                        for i in ids
                    )
                    lowered = sent.lower()
                    extra = {v for k, v in WORDNUM.items() if k in lowered}
                    cited = numbers(claims)
                    if re.search(r"\b(ka|kya|kyr|thousand)\b", claims, re.I):  # "17.5–14.6 ka": every small figure may be in thousands
                        cited |= {str(int(round(float(c) * 1000))) for c in list(cited) if float(c) < 1000}
                    cited_f = [float(c) for c in cited]
                    missing = sorted(
                        n for n in numbers(sent)
                        if n not in {"1", "2", "3"} and not any(abs(float(n) - c) <= max(0.6, 0.025 * c) for c in cited_f)
                    )
                    if missing and not extra:
                        marks.append("NUMBER " + ",".join(missing))
                    flags += len(marks)
                    if flags_only and not marks:
                        continue
                    lines.append(f"\n[{where}] {sent}")
                    if marks:
                        lines.append("  !! " + " | ".join(marks))
                    for i in ids:
                        e = evidence.get(i)
                        lines.append(f"  - {i} ({e['confidence']}, {e.get('verification')}, {e.get('stance', 'supports')}): {e['claim']}" if e else f"  - {i}: UNKNOWN")
            total_flags += flags
            if lines or not flags_only:
                print(f"\n### {g} / {pid}  ({flags} flags)")
                print("\n".join(lines))
    print(f"\n{total_flags} flags in total")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
