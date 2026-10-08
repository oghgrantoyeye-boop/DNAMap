"""Validate curated data (DATA_MODEL.md §9). Exit code 1 on any error.

Usage (from pipeline/): uv run python -m validation.validate
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import polars as pl
from jsonschema import Draft202012Validator
from referencing import Registry, Resource

from aadr.manifest import RELEASE

REPO = Path(__file__).resolve().parents[2]
CURATED = REPO / "data" / "curated"
SCHEMAS = REPO / "data" / "schemas"
PROCESSED = REPO / "data" / "processed"

FILES = ["sources", "evidence", "populations", "relationships", "admixture_events", "disagreements", "periods"]
RANK = {"low": 0, "medium": 1, "high": 2}

# Deterministic-lineage and essentialising phrasing (CLAUDE.md rule 2).
FORBIDDEN = [
    (re.compile(r"\bbec(a|o)me\b", re.I), "'became/become' implies identity change"),
    (re.compile(r"\bturned into\b", re.I), "'turned into'"),
    (re.compile(r"\bthe [A-Z][a-z]+ people\b"), "'the X people' essentialises a group"),
    (re.compile(r"\b(invaded|invasion|conquered|conquest)\b", re.I), "causal/violent framing not supported by genetics"),
    (re.compile(r"\b(pure|purity|race|racial)\b", re.I), "race/purity language"),
    (re.compile(r"\bwere replaced by\b", re.I), "'were replaced by' without a proportion"),
]
PROSE_FIELDS = {"description", "genetic_profile", "archaeological_context", "wording", "claim", "summary", "label", "text"}


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def err(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)


def load(name: str) -> dict:
    return json.loads((CURATED / f"{name}.json").read_text())


def schema_check(r: Report, data: dict[str, dict]) -> None:
    resources = []
    for p in SCHEMAS.glob("*.schema.json"):
        s = json.loads(p.read_text())
        resources.append((s["$id"], Resource.from_contents(s)))
    registry = Registry().with_resources(resources)
    for name in FILES:
        schema = json.loads((SCHEMAS / f"{name}.schema.json").read_text())
        v = Draft202012Validator(schema, registry=registry)
        for e in v.iter_errors(data[name]):
            r.err(f"schema {name}: {'/'.join(map(str, e.absolute_path))}: {e.message[:200]}")


def walk_prose(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in PROSE_FIELDS and isinstance(v, str):
                yield f"{path}.{k}", v
            else:
                yield from walk_prose(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            ident = v.get("id", i) if isinstance(v, dict) else i
            yield from walk_prose(v, f"{path}[{ident}]")


def integrity(r: Report, d: dict[str, dict]) -> None:
    sources = {s["id"]: s for s in d["sources"]["sources"]}
    evidence = {e["id"]: e for e in d["evidence"]["evidence"]}
    pops = {p["id"]: p for p in d["populations"]["populations"]}
    rels = {x["id"]: x for x in d["relationships"]["relationships"]}
    events = {x["id"]: x for x in d["admixture_events"]["events"]}
    disagreements = {x["id"]: x for x in d["disagreements"]["disagreements"]}

    for coll, name in [(evidence, "evidence"), (pops, "populations"), (rels, "relationships"), (events, "events")]:
        if len(coll) != len(d[{"events": "admixture_events"}.get(name, name)][{"events": "events"}.get(name, name)]):
            r.err(f"duplicate ids in {name}")

    # Evidence → source
    for e in evidence.values():
        s = sources.get(e["source_id"])
        if not s:
            r.err(f"evidence {e['id']}: unknown source {e['source_id']}")
            continue
        if s["status"] == "unmined":
            r.err(f"evidence {e['id']}: source {s['id']} is 'unmined' (no checked claims)")
        if s["status"] == "erratum" and not e.get("note") and "rratum" not in e["claim"]:
            r.err(f"evidence {e['id']}: source has an erratum; evidence must say how it is handled")
        if e["verification"] != s["verification"] and s["verification"] != "not_applicable":
            r.err(f"evidence {e['id']}: verification {e['verification']} differs from source note ({s['verification']})")
        if e["verification"] == "abstract_only" and e["confidence"] == "high":
            r.err(f"evidence {e['id']}: abstract-only evidence cannot be high confidence")
        if not e["id"].startswith(f"ev-{e['source_id']}-"):
            r.err(f"evidence {e['id']}: id must start with ev-{e['source_id']}-")

    def check_ev(owner: str, ids: list[str], conf: str | None = None) -> None:
        if not ids:
            r.err(f"{owner}: no evidence")
            return
        best = -1
        for i in ids:
            if i not in evidence:
                r.err(f"{owner}: unknown evidence {i}")
            else:
                best = max(best, RANK[evidence[i]["confidence"]])
        if conf is not None and best >= 0 and RANK[conf] > best:
            r.err(f"{owner}: confidence {conf} exceeds its best evidence")

    for p in pops.values():
        check_ev(f"population {p['id']}", p["evidence_ids"], p["confidence"])
        for a in p["aliases"]:
            for sid in a["used_by"]:
                if sid not in sources:
                    r.err(f"population {p['id']}: alias used_by unknown source {sid}")
        for sid in p["membership"]["defining_source_ids"]:
            if sid not in sources:
                r.err(f"population {p['id']}: unknown defining source {sid}")
        if p["inferred_only"] and p["membership"]["include"]:
            r.err(f"population {p['id']}: inferred_only populations must not have membership rules")
        if not p["inferred_only"] and not p["membership"]["include"] and not p["membership"].get("include_individual_ids"):
            r.err(f"population {p['id']}: no membership rules")
        if "time_range" in p and p["time_range"]["start"] > p["time_range"]["end"]:
            r.err(f"population {p['id']}: time_range start > end")
        for rule in p["membership"]["include"]:
            try:
                re.compile(rule["group_label_regex"])
            except re.error as ex:
                r.err(f"population {p['id']}: bad regex {rule['group_label_regex']!r}: {ex}")
        # Overview sections: every paragraph is tied to claims the population already cites.
        seen_headings = set()
        for sec in p.get("overview", []):
            if sec["heading"] in seen_headings:
                r.err(f"population {p['id']}: overview heading {sec['heading']!r} repeated")
            seen_headings.add(sec["heading"])
            for ev_id in sec["evidence_ids"]:
                if ev_id not in p["evidence_ids"]:
                    r.err(f"population {p['id']}: overview cites {ev_id}, which is not in the population's evidence_ids")
        if p.get("location_hint"):
            for sid in p["location_hint"]["source_ids"]:
                if sid not in sources:
                    r.err(f"population {p['id']}: location_hint unknown source {sid}")

    for x in rels.values():
        for end in ("source", "target"):
            if x[end] not in pops:
                r.err(f"relationship {x['id']}: unknown {end} {x[end]}")
        if x["source"] == x["target"]:
            r.err(f"relationship {x['id']}: self-loop")
        check_ev(f"relationship {x['id']}", x["evidence_ids"], x["confidence"])
        for did in x.get("disagreement_ids", []):
            if did not in disagreements:
                r.err(f"relationship {x['id']}: unknown disagreement {did}")
        tr = x["time_range"]
        if tr and tr["end"] is not None and tr["start"] > tr["end"]:
            r.err(f"relationship {x['id']}: time_range start > end")
        if x["type"] in ("split", "shared_ancestry") and x["direction_supported"] and x["type"] == "shared_ancestry":
            r.err(f"relationship {x['id']}: shared_ancestry cannot have a supported direction")

    for ev in events.values():
        if ev["target"] not in pops:
            r.err(f"event {ev['id']}: unknown target {ev['target']}")
        check_ev(f"event {ev['id']}", ev["evidence_ids"])
        mids = {m["id"] for m in ev["models"]}
        if ev.get("default_model_id") and ev["default_model_id"] not in mids:
            r.err(f"event {ev['id']}: default_model_id not among models")
        for m in ev["models"]:
            owner = f"event {ev['id']} model {m['id']}"
            if m["source_id"] not in sources:
                r.err(f"{owner}: unknown source {m['source_id']}")
            check_ev(owner, m["evidence_ids"])
            if any(evidence.get(i, {}).get("source_id") != m["source_id"] for i in m["evidence_ids"]):
                r.warn(f"{owner}: some evidence comes from a different source than the model")
            for c in m["components"]:
                if c["population_id"] and c["population_id"] not in pops:
                    r.err(f"{owner}: unknown component population {c['population_id']}")
                if c["population_id"] == ev["target"]:
                    r.err(f"{owner}: component is the target itself")
                pr = c["proportion"]
                if pr and (("low" in pr and pr["low"] > pr["value"]) or ("high" in pr and pr["high"] < pr["value"])):
                    r.err(f"{owner}: proportion interval does not contain value ({c['proxy_label']})")
            if m["complete"]:
                vals = [c["proportion"]["value"] for c in m["components"] if c["proportion"]]
                if len(vals) != len(m["components"]):
                    r.err(f"{owner}: complete model has components without proportions")
                elif abs(sum(vals) - 1) > 0.03:
                    r.err(f"{owner}: complete model sums to {sum(vals):.3f}")
            ad = m.get("admixture_date")
            if ad and ad.get("range") and ad["range"]["start"] > ad["range"]["end"]:
                r.err(f"{owner}: admixture date start > end")

    for dg in disagreements.values():
        for pos in dg["positions"]:
            for i in pos["evidence_ids"]:
                if i not in evidence:
                    r.err(f"disagreement {dg['id']}: unknown evidence {i}")
        for a in dg["affects"]:
            if a not in pops and a not in rels and a not in events:
                r.err(f"disagreement {dg['id']}: affects unknown id {a}")

    for per in d["periods"]["periods"]:
        if per["window"]["start"] >= per["window"]["end"]:
            r.err(f"period {per['id']}: empty window")
        if per.get("select") and per["select"] not in pops:
            r.err(f"period {per['id']}: unknown population {per['select']}")
        for sid in per["source_ids"]:
            if sid not in sources:
                r.err(f"period {per['id']}: unknown source {sid}")

    # Unused evidence is allowed but reported.
    used = set()
    for p in pops.values():
        used |= set(p["evidence_ids"])
    for x in rels.values():
        used |= set(x["evidence_ids"])
    for ev in events.values():
        used |= set(ev["evidence_ids"])
        for m in ev["models"]:
            used |= set(m["evidence_ids"])
    for dg in disagreements.values():
        for pos in dg["positions"]:
            used |= set(pos["evidence_ids"])
    for i in sorted(set(evidence) - used):
        r.warn(f"evidence {i} is not used by any entity")

    for name in FILES:
        for path, text in walk_prose(d[name], name):
            for rx, why in FORBIDDEN:
                if rx.search(text):
                    r.err(f"wording {path}: {why}: {text[:120]!r}")


def membership_checks(r: Report, d: dict[str, dict]) -> None:
    mpath = PROCESSED / "membership.parquet"
    if not mpath.exists():
        r.warn("membership.parquet missing; run populations.membership")
        return
    mem = pl.read_parquet(mpath)
    ind = pl.read_parquet(PROCESSED / f"aadr_{RELEASE}_individuals.parquet")
    counts = dict(mem.group_by("population_id").len().iter_rows())
    for p in d["populations"]["populations"]:
        if p["inferred_only"]:
            continue
        n = counts.get(p["id"], 0)
        if n == 0:
            r.err(f"population {p['id']}: no members in AADR {RELEASE}")
        elif n < 5:
            r.warn(f"population {p['id']}: only {n} members (will be flagged sparse)")
    # Coordinates sanity for members
    j = mem.join(ind, on="individual_id")
    bad = j.filter(pl.col("lat").is_null())
    if bad.height:
        r.warn(f"{bad.height} member individuals lack coordinates (not drawn in population footprints)")
    out = j.filter((pl.col("lat").abs() > 90) | (pl.col("lon").abs() > 180))
    if out.height:
        r.err(f"{out.height} member individuals have out-of-range coordinates")


def main() -> int:
    r = Report()
    data = {name: load(name) for name in FILES}
    schema_check(r, data)
    if not r.errors:
        integrity(r, data)
        membership_checks(r, data)
    for w in r.warnings:
        print(f"WARN  {w}")
    for e in r.errors:
        print(f"ERROR {e}")
    print(f"validation: {len(r.errors)} errors, {len(r.warnings)} warnings")
    return 1 if r.errors else 0


if __name__ == "__main__":
    sys.exit(main())
