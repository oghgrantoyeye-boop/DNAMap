"""Print everything a writer may draw on for one or more populations.

Usage (from pipeline/):  uv run python -m curation.prose_dossier <population id> [...]

For each population: its curated record and current prose, what the map shows for it
(sampled range, individuals, sites), every evidence statement it cites (our wording, with
source, confidence, stance and where in the paper), and the relationships and admixture
models that touch it, which the panel already displays below the prose.
Read-only. Used for the prose rewrite (research/notes/writing-style.md).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CUR = REPO / "data" / "curated"
WEB = REPO / "apps" / "web" / "public" / "data" / "ontology.json"


def year(y: int) -> str:
    return f"{1 - y} BCE" if y <= 0 else f"{y} CE"


def pct(p: dict) -> str:
    f = lambda v: f"{100 * v:.1f}".rstrip("0").rstrip(".")
    rng = f" ({f(p['low'])}–{f(p['high'])})" if p.get("low") is not None and p.get("high") is not None else ""
    return f"{f(p['value'])}%{rng}"


def short(s: dict | None, fallback: str) -> str:
    if not s:
        return fallback
    authors = s["citation"].split("(")[0].strip().rstrip(".,")
    first = authors.split(",")[0].split()
    surname = " ".join(first[:-1]) if len(first) > 1 else (first[0] if first else fallback)
    return f"{surname}{' et al.' if ',' in authors else ''} {s['year']}"


def main(ids: list[str]) -> int:
    pops = {p["id"]: p for p in json.loads((CUR / "populations.json").read_text())["populations"]}
    ev = {e["id"]: e for e in json.loads((CUR / "evidence.json").read_text())["evidence"]}
    src = {s["id"]: s for s in json.loads((CUR / "sources.json").read_text())["sources"]}
    rels = json.loads((CUR / "relationships.json").read_text())["relationships"]
    events = json.loads((CUR / "admixture_events.json").read_text())["events"]
    stats = {}
    if WEB.exists():
        stats = {p["id"]: p.get("stats", {}) for p in json.loads(WEB.read_text())["populations"]}

    def ev_line(i: str) -> str:
        e = ev.get(i)
        if not e:
            return f"  [{i}] MISSING"
        return (
            f"  [{i}] {short(src.get(e['source_id']), e['source_id'])} · {e['confidence']} · "
            f"{e.get('verification', '?')} · {e.get('stance', 'supports')} · at: {e.get('location', '?')}\n      {e['claim']}"
        )

    for pid in ids:
        p = pops.get(pid)
        if not p:
            print(f"### {pid}: unknown population\n")
            continue
        st = stats.get(pid, {})
        print(f"### {pid} — {p['name']}")
        print(f"category: {p['category']} · transition: {p.get('transition')} · confidence: {p['confidence']} · inferred_only: {p['inferred_only']}")
        tr = p.get("time_range")
        if tr:
            print(f"time_range (curated): {year(tr['start'])} – {year(tr['end'])} (basis: {p.get('time_range_basis', '?')})")
        if st and not p["inferred_only"]:
            print(f"on the map: {st.get('members')} individuals · {st.get('sites')} sites · {st.get('publications')} publications · sampled {year(st['earliest'])} – {year(st['latest'])} · sparse: {st.get('sparse')}")
            labels = ", ".join(f"{lab} ({n})" for lab, n in st.get("labels", [])[:12])
            print(f"source group labels: {labels}")
        print(f"region: {p['region'].get('name')}")
        if p.get("aliases"):
            print("aliases: " + "; ".join(a["name"] for a in p["aliases"]))
        if p.get("membership", {}).get("notes"):
            print(f"membership notes: {p['membership']['notes']}")
        print(f"\nDESCRIPTION (current): {p['description']}")
        for f in ("genetic_profile", "archaeological_context"):
            if p.get(f):
                print(f"{f.upper()} (shown as its own block): {p[f]}")
        for sec in p.get("overview", []):
            print(f"\n## {sec['heading']} (current) cites {', '.join(sec['evidence_ids'])}\n{sec['text']}")
        if p.get("caveats"):
            print("\nCAVEATS (shown as a list lower in the panel):")
            for c in p["caveats"]:
                print(f"  - {c}")
        print("\nEVIDENCE this population cites (the only facts the prose may state):")
        for i in p["evidence_ids"]:
            print(ev_line(i))
        touching = [r for r in rels if pid in (r["source"], r["target"])]
        if touching:
            print("\nRELATIONSHIPS (shown in the panel as 'connections'):")
            for r in touching:
                other = r["target"] if r["source"] == pid else r["source"]
                arrow = "→" if r["source"] == pid else "←"
                print(f"  {r['type']} {arrow} {other} ({pops.get(other, {}).get('name', other)}) · {r['confidence']}: {r.get('wording', '')}")
                for i in r["evidence_ids"]:
                    print("  " + ev_line(i))
        for e in events:
            srcs = {c.get("population_id") for m in e["models"] for c in m["components"]}
            if e["target"] != pid and pid not in srcs:
                continue
            role = "target" if e["target"] == pid else "a source"
            print(f"\nADMIXTURE EVENT {e['id']} (this population is {role}; target {e['target']}; shown in the panel with proportion bars):")
            for m in e["models"]:
                comps = ", ".join(
                    f"{c['proxy_label']} {pct(c['proportion'])}" if c.get("proportion") else c["proxy_label"] for c in m["components"]
                )
                print(f"  model {m['id']} ({short(src.get(m['source_id']), m['source_id'])}, {m['method']}): {m['label']}: {comps}")
        print("\n" + "=" * 80 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
