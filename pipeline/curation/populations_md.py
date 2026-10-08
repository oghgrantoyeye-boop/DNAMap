"""Generate POPULATIONS.md and research/populations/<transition>.md from curated data.

Usage (from pipeline/): uv run python -m curation.populations_md
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import polars as pl

from aadr.manifest import RELEASE
from populations.membership import display_range

REPO = Path(__file__).resolve().parents[2]
CUR = REPO / "data" / "curated"
PROC = REPO / "data" / "processed"

TRANSITIONS = {
    "archaic": "Archaic admixture",
    "early-eurasians": "Earliest modern humans in Eurasia",
    "eur-hg": "Late Pleistocene and early Holocene hunter-gatherers",
    "near-east": "Near Eastern hunter-gatherers and first farmers",
    "neolithic": "Farming spreads into Europe",
    "steppe": "Eneolithic steppe and steppe-related expansions",
    "south-asia": "South Asia",
    "east-asia": "East and Southeast Asia",
    "americas": "Peopling of the Americas",
    "oceania": "Oceania",
    "africa": "Africa",
}
CAT = {
    "genetic_cluster": "genetic cluster",
    "archaeological_population": "archaeological",
    "geographic_population": "geographic",
    "historical_population": "historical",
    "archaic_population": "archaic",
    "modern_population": "modern",
}


def fy(y: int) -> str:
    if y <= 0:
        b = 1 - y
        return f"{b:,} BCE" if b < 10000 else f"{round(b, -2):,} BCE"
    return f"{y} CE"


def pct(p: dict | None) -> str:
    if not p:
        return "not given"
    v = f"{100 * p['value']:.1f}".rstrip("0").rstrip(".") + "%"
    if "low" in p and "high" in p:
        lo = f"{100 * p['low']:.1f}".rstrip("0").rstrip(".")
        hi = f"{100 * p['high']:.1f}".rstrip("0").rstrip(".")
        v += f" ({lo}–{hi}%, {p['kind'].replace('_', ' ')})"
    elif p["kind"] == "approximate":
        v = "~" + v
    return v


def load() -> dict:
    return {n: json.loads((CUR / f"{n}.json").read_text()) for n in ["populations", "evidence", "sources", "relationships", "admixture_events", "disagreements"]}


def main() -> None:
    d = load()
    pops = d["populations"]["populations"]
    ev = {e["id"]: e for e in d["evidence"]["evidence"]}
    src = {s["id"]: s for s in d["sources"]["sources"]}
    names = {p["id"]: p["name"] for p in pops}
    ind = pl.read_parquet(PROC / f"aadr_{RELEASE}_individuals.parquet")
    mem = pl.read_parquet(PROC / "membership.parquet").join(ind, on="individual_id")

    stats = {}
    for p in pops:
        s = mem.filter(pl.col("population_id") == p["id"])
        if p["inferred_only"] or s.height == 0:
            tr = p.get("time_range")
            stats[p["id"]] = {"n": 0, "sites": 0, "range": (tr["start"], tr["end"]) if tr else None, "labels": []}
        else:
            stats[p["id"]] = {
                "n": s.height,
                "sites": s.select(pl.struct("lat", "lon").n_unique()).item(),
                "range": display_range(s["start"], s["end"]),
                "labels": s.group_by("group_label").len().sort("len", descending=True).rows(),
            }

    out = [
        "# POPULATIONS",
        "",
        f"The proposed curated population set for V1, with the published admixture models behind it. **Generated** from `data/curated/*.json` and AADR {RELEASE} membership by `pipeline/curation/populations_md.py`; edit the JSON, not this file. The hand-written problems section comes from `research/populations/problems.md`.",
        "",
        "How to read: *members* = AADR individuals matched by the population's membership rule (quality-usable, outliers excluded). *Range* = 5th–95th percentile of member date ranges (full span for <20 members); for inferred-only populations, a display window stated in the caveats. *Sparse* = fewer than 5 members or only one site.",
        "",
        f"**{len(pops)} populations**: " + ", ".join(f"{sum(1 for p in pops if p['category'] == c)} {CAT[c]}" for c in CAT if any(p['category'] == c for p in pops)) + f"; {sum(1 for p in pops if p['inferred_only'])} are inferred only (no sampled members).",
        "",
    ]
    by_t = defaultdict(list)
    for p in pops:
        by_t[p["transition"]].append(p)
    for t, title in TRANSITIONS.items():
        if t not in by_t:
            continue
        out += [f"## {title}", "", "| population | category | members (sites) | range | region | confidence | key sources |", "|---|---|---|---|---|---|---|"]
        for p in by_t[t]:
            st = stats[p["id"]]
            mem_s = "inferred only" if p["inferred_only"] else f"{st['n']} ({st['sites']})" + (" · sparse" if st["n"] < 5 or st["sites"] < 2 else "")
            rng = f"{fy(st['range'][0])} – {fy(st['range'][1])}" if st["range"] else "–"
            srcs = sorted({ev[e]["source_id"] for e in p["evidence_ids"]})
            out.append(f"| **{p['name']}** `{p['id']}` | {CAT[p['category']]} | {mem_s} | {rng} | {p['region']['name']} | {p['confidence']} | {', '.join(srcs)} |")
        out.append("")

    out += ["## Admixture-event catalogue", "", "Each event lists every published model we checked, side by side. Proportions are as published (interval type in brackets). 'not given' = the component is named in the checked text without a number.", ""]
    for e in d["admixture_events"]["events"]:
        out += [f"### {names[e['target']]} — `{e['id']}`" + (" (archaic)" if e["archaic"] else ""), ""]
        for m in e["models"]:
            s = src[m["source_id"]]
            comps = "; ".join(f"{c['proxy_label']}{' → ' + names[c['population_id']] if c['population_id'] else ''}: {pct(c['proportion'])}" for c in m["components"]) or "—"
            line = f"- **{m['label']}** ({s['citation'].split('(')[0].strip().rstrip(',')} {s['year']}; {m['method']}{'; ' + s['verification'].replace('_', ' ') if s['verification'] != 'full_text' else ''}). Components: {comps}."
            if m.get("admixture_date"):
                ad = m["admixture_date"]
                rng = f"{fy(ad['range']['start'])}" + (f" – {fy(ad['range']['end'])}" if ad["range"]["end"] != ad["range"]["start"] else "") if ad.get("range") else ""
                gen = f"{ad['generations_before_sample'][0]}–{ad['generations_before_sample'][1]} generations before the sampled individual" if ad.get("generations_before_sample") else ""
                line += f" Date of mixing: {rng or gen} ({ad['method']})."
            if m.get("sex_bias"):
                line += f" Sex bias: {m['sex_bias']}"
            out.append(line)
        out.append("")

    out += ["## Relationships (non-admixture)", "", "| type | from → to | confidence | wording |", "|---|---|---|---|"]
    for r in d["relationships"]["relationships"]:
        arrow = "→" if r["direction_supported"] else "↔"
        out.append(f"| {r['type']} | {names[r['source']]} {arrow} {names[r['target']]} | {r['confidence']} | {r['wording']} |")
    out += ["", "## Disagreements represented", ""]
    for g in d["disagreements"]["disagreements"]:
        out.append(f"- **{g['topic']}** ({g['status']}). {g['summary']}")
    out += ["", (REPO / "research" / "populations" / "problems.md").read_text()]
    (REPO / "POPULATIONS.md").write_text("\n".join(out))

    # Per-transition research notes
    for t, title in TRANSITIONS.items():
        if t not in by_t:
            continue
        lines = [f"# {title}: population notes", "", "Generated by `pipeline/curation/populations_md.py` from `data/curated/populations.json`. Membership rules and matched AADR labels for review.", ""]
        for p in by_t[t]:
            st = stats[p["id"]]
            lines += [f"## {p['name']} (`{p['id']}`)", "", f"*{CAT[p['category']]} · confidence {p['confidence']} · {p['region']['name']}*", "", p["description"], ""]
            if p.get("genetic_profile"):
                lines += [f"**Genetic profile.** {p['genetic_profile']}", ""]
            if p.get("archaeological_context"):
                lines += [f"**Archaeological context.** {p['archaeological_context']}", ""]
            if p["aliases"]:
                lines += ["**Aliases:** " + "; ".join(f"{a['name']} ({', '.join(a['used_by']) or '—'})" for a in p["aliases"]), ""]
            m = p["membership"]
            if p["inferred_only"]:
                lines += ["**Membership:** inferred only (no sampled individuals).", ""]
            else:
                rules = "; ".join(f"`{r['group_label_regex']}`" + (f" within {fy(r['date_within']['start'])}–{fy(r['date_within']['end'])}" if r.get("date_within") else "") for r in m["include"])
                lines += [f"**Membership rule:** {rules}" + (f"; excluding `{m['exclude_group_label_regex']}`" if m.get("exclude_group_label_regex") else "") + ".", ""]
                if m["notes"]:
                    lines += [f"*{m['notes']}*", ""]
                lines += [f"**Matched ({st['n']} individuals, {st['sites']} sites):** " + "; ".join(f"{a} ({b})" for a, b in st["labels"]), ""]
            lines += ["**Evidence:**"] + [f"- {ev[e]['claim']} — {ev[e]['source_id']}, {ev[e]['location']}" for e in p["evidence_ids"]] + [""]
            if p["caveats"]:
                lines += ["**Caveats:**"] + [f"- {c}" for c in p["caveats"]] + [""]
        (REPO / "research" / "populations" / f"{t}.md").write_text("\n".join(lines))
    print("wrote POPULATIONS.md and research/populations/*.md")


if __name__ == "__main__":
    main()
