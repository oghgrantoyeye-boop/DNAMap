"""Export compact browser files for apps/web (DATA_MODEL.md §8).

Usage (from pipeline/): uv run python -m export.web

Writes to apps/web/public/data/:
  samples.json            columnar core fields for ancient individuals in/near the V1 window
  samples-detail/NN.json  full records, 64 shards by a stable hash of the individual id
  ontology.json           populations (+ computed stats), relationships (+ resolved times),
                          admixture events (+ derived edges), evidence, sources, disagreements, periods
  manifest.json           versions, counts, content hashes
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import zlib
from datetime import datetime, timezone
from pathlib import Path

import polars as pl

from aadr.manifest import RELEASE, RELEASE_DATE
from geo.continents import CONTINENTS, continent
from populations.membership import display_range

REPO = Path(__file__).resolve().parents[2]
CUR = REPO / "data" / "curated"
PROC = REPO / "data" / "processed"
OUT = REPO / "apps" / "web" / "public" / "data"

V1 = (-50000, 1500)
KIND = ["direct_radiocarbon", "contextual", "genetic", "relative_tethered", "other"]
PREC = ["fine", "site", "coarse", "missing"]
N_SHARDS = 64


def shard_of(iid: str) -> int:
    return zlib.crc32(iid.encode()) % N_SHARDS


def write(path: Path, obj) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.dumps(obj, separators=(",", ":"), ensure_ascii=False)
    path.write_text(data)
    return hashlib.sha256(data.encode()).hexdigest()[:16]


# AADR v66.p1 ships 23 U+FFFD replacement characters in free-text date notes, all
# where a symbol was lost to an encoding error upstream: "6914\ufffd34 BP" (a
# radiocarbon age ± error) and once "2141\ufffd1962 cal BCE" (a range). The raw file
# and processed tables keep the text verbatim; only the browser copy is repaired,
# and only for these two digit-bounded patterns. Anything else is left as is.
RE_PM = re.compile(r"(\d)\ufffd(\d+\s?BP)")
RE_RANGE = re.compile(r"(\d)\ufffd(\d)")


def repair_text(v):
    if isinstance(v, str) and "\ufffd" in v:
        return RE_RANGE.sub(r"\1–\2", RE_PM.sub(r"\1±\2", v))
    if isinstance(v, list):
        return [repair_text(x) for x in v]
    return v


def load_curated() -> dict:
    out = {n: json.loads((CUR / f"{n}.json").read_text()) for n in
           ["sources", "evidence", "populations", "relationships", "admixture_events", "disagreements", "periods"]}
    ex = CUR / "extraction.json"  # optional until the page's chapters are curated
    out["extraction"] = json.loads(ex.read_text()) if ex.exists() else {"chapters": []}
    return out


def main() -> None:
    ind = pl.read_parquet(PROC / f"aadr_{RELEASE}_individuals.parquet")
    mem = pl.read_parquet(PROC / "membership.parquet")
    cur = load_curated()
    pops = cur["populations"]["populations"]
    pop_index = {p["id"]: i for i, p in enumerate(pops)}

    # --- samples in/near window, with coordinates
    s = ind.filter((pl.col("end") >= V1[0]) & (pl.col("start") <= V1[1]) & pl.col("lat").is_not_null())
    s = s.sort(["start", "individual_id"])
    pubs = sorted(set(s["publication"].to_list()))
    pub_idx = {p: i for i, p in enumerate(pubs)}
    doi_of = dict(s.select("publication", "doi").unique("publication").iter_rows())
    groups = sorted(set(s["group_label"].to_list()))
    grp_idx = {g: i for i, g in enumerate(groups)}
    memb: dict[str, list[int]] = {}
    for iid, pid in mem.iter_rows():
        memb.setdefault(iid, []).append(pop_index[pid])
    # site ids for deterministic jitter of shared coordinates
    site_key = s.select(pl.concat_str([pl.col("lat").round(4).cast(pl.String), pl.col("lon").round(4).cast(pl.String)], separator=",")).to_series()
    sites = {k: i for i, k in enumerate(dict.fromkeys(site_key.to_list()))}

    ids = s["individual_id"].to_list()
    pop_primary, pop_extra = [], {}
    for i, iid in enumerate(ids):
        m = memb.get(iid, [])
        pop_primary.append(m[0] if m else -1)
        if len(m) > 1:
            pop_extra[str(i)] = m[1:]
    samples = {
        "n": s.height,
        "id": ids,
        "lon": [round(x, 4) for x in s["lon"].to_list()],
        "lat": [round(x, 4) for x in s["lat"].to_list()],
        "start": s["start"].to_list(),
        "end": s["end"].to_list(),
        "kind": [KIND.index(k) if k in KIND else 4 for k in s["date_kind"].to_list()],
        "precision": [PREC.index(p) for p in s["precision"].to_list()],
        "site": [sites[k] for k in site_key.to_list()],
        "group": [grp_idx[g] for g in s["group_label"].to_list()],
        "pub": [pub_idx[p] for p in s["publication"].to_list()],
        "pop": pop_primary,
        "popExtra": pop_extra,
        "usable": [1 if u else 0 for u in s["quality_usable"].to_list()],
        "conflict": [1 if c else 0 for c in s["date_conflict"].to_list()],
        "shard": [shard_of(i) for i in ids],
        "kinds": KIND,
        "precisions": PREC,
        "groups": groups,
        "publications": [{"key": p, "doi": doi_of.get(p)} for p in pubs],
    }

    # --- detail shards
    shards: dict[int, dict] = {k: {} for k in range(N_SHARDS)}
    detail_cols = ["individual_id", "persistent_id", "skeletal_code", "group_label", "alt_group_labels", "locality", "political_entity",
                   "source_lat", "source_lon", "precision", "shared_coordinate_count", "start", "end", "range_source", "date_conflict",
                   "mean_bp", "sd_bp", "full_date_text", "method_text", "date_kind", "calibrated", "c14_age_bp", "c14_error", "lab_code",
                   "date_warnings", "molecular_sex", "y_hg", "mt_hg", "publication", "first_publication", "doi", "data_repository",
                   "data_type", "snps_1240k", "assessment", "assessment_warnings", "family_relations", "genetic_ids",
                   "representative_genetic_id", "override_ids"]
    for r in s.select(detail_cols).iter_rows(named=True):
        r = {k: repair_text(v) for k, v in r.items()}
        r["population_ids"] = [pops[i]["id"] for i in memb.get(r["individual_id"], [])]
        shards[shard_of(r["individual_id"])][r["individual_id"]] = r
    hashes = {}
    for k, v in shards.items():
        hashes[f"samples-detail/{k:02d}.json"] = write(OUT / "samples-detail" / f"{k:02d}.json", v)

    # --- populations with computed stats
    j = mem.join(ind, on="individual_id")
    pop_out = []
    for p in pops:
        q = dict(p)
        sub = j.filter(pl.col("population_id") == p["id"])
        if p["inferred_only"] or sub.height == 0:
            q["stats"] = {"members": 0, "sites": 0, "display_range": p.get("time_range"), "sparse": True, "labels": []}
            q["range"] = p.get("time_range")
        else:
            lo, hi = display_range(sub["start"], sub["end"])
            nsites = sub.select(pl.struct("lat", "lon").n_unique()).item()
            labels = sub.group_by("group_label").len().sort(["len", "group_label"], descending=[True, False]).rows()  # ties alphabetical: reproducible output
            q["stats"] = {"members": sub.height, "sites": nsites, "display_range": {"start": lo, "end": hi},
                          "sparse": sub.height < 5 or nsites < 2, "labels": [[a, b] for a, b in labels],
                          "publications": sub["publication"].n_unique(),
                          "earliest": int(sub["start"].min()), "latest": int(sub["end"].max())}
            q["range"] = p.get("time_range") or {"start": lo, "end": hi}
        pop_out.append(q)
    rng = {p["id"]: p["range"] for p in pop_out}

    def convention(a: str, b: str) -> tuple[dict, str]:
        ra, rb = rng[a], rng[b]
        lo, hi = max(ra["start"], rb["start"]), min(ra["end"], rb["end"])
        if lo <= hi:
            return {"start": lo, "end": hi}, "overlap"
        return {"start": min(ra["end"], rb["end"]), "end": max(ra["start"], rb["start"])}, "gap"

    rels = []
    for r in cur["relationships"]["relationships"]:
        q = dict(r)
        tr = r["time_range"]
        if tr is None:
            q["time_range"], how = convention(r["source"], r["target"])
            q["time_estimated"] = False
            q["time_note"] = "Time not estimated in the cited sources; drawn " + ("while both populations are attested." if how == "overlap" else "across the gap between them.")
        elif tr["end"] is None:
            conv, _ = convention(r["source"], r["target"])
            q["time_range"] = {"start": tr["start"], "end": max(tr["start"], conv["end"])}
            q["time_estimated"] = True
        else:
            q["time_estimated"] = True
        rels.append(q)

    edges = []
    for e in cur["admixture_events"]["events"]:
        tgt = rng[e["target"]]
        for m in e["models"]:
            ad = m.get("admixture_date") or {}
            if ad.get("range"):
                t, est = ad["range"], True
            else:
                span = tgt["end"] - tgt["start"]
                t, est = {"start": tgt["start"], "end": tgt["start"] + int(min(500, 0.2 * span))}, False
            for c in m["components"]:
                if not c["population_id"]:
                    continue
                edges.append({"id": f"{e['id']}:{m['id']}:{c['population_id']}", "event_id": e["id"], "model_id": m["id"],
                              "type": "admixture", "source": c["population_id"], "target": e["target"],
                              "proportion": c["proportion"], "proxy_label": c["proxy_label"], "time_range": t,
                              "time_estimated": est, "archaic": e["archaic"]})

    ontology = {
        "populations": pop_out,
        "relationships": rels,
        "admixture_events": cur["admixture_events"]["events"],
        "admixture_edges": edges,
        "evidence": cur["evidence"]["evidence"],
        "sources": cur["sources"]["sources"],
        "disagreements": cur["disagreements"]["disagreements"],
        "periods": cur["periods"]["periods"],
    }
    # "From bone to genome" page: chapters with only the evidence and sources they cite
    chapters = cur["extraction"].get("chapters", [])
    ex_ids = {i for c in chapters for i in c["evidence_ids"]} | {i for c in chapters for f in c["facts"] for i in f["evidence_ids"]}
    ex_ev = [e for e in cur["evidence"]["evidence"] if e["id"] in ex_ids]
    ex_src_ids = {e["source_id"] for e in ex_ev}
    if chapters:
        hashes["extraction.json"] = write(OUT / "extraction.json", {
            "chapters": chapters,
            "evidence": ex_ev,
            "sources": [x for x in cur["sources"]["sources"] if x["id"] in ex_src_ids],
        })
    hashes["samples.json"] = write(OUT / "samples.json", samples)
    hashes["ontology.json"] = write(OUT / "ontology.json", ontology)

    try:
        commit = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=REPO, text=True).strip()
    except Exception:  # noqa: BLE001
        commit = "unknown"
    # --- coverage summary: how unevenly the world is sampled (geo/continents.py)
    cov = {k: {"samples": 0, "assigned": 0} for k in CONTINENTS}
    unmapped: dict[str, int] = {}
    for pe, lon, pp in zip(s["political_entity"].to_list(), s["lon"].to_list(), pop_primary):
        k = continent(pe, lon)
        if k is None:
            unmapped[str(pe)] = unmapped.get(str(pe), 0) + 1
            continue
        cov[k]["samples"] += 1
        cov[k]["assigned"] += pp >= 0
    if unmapped:
        print(f"coverage: {sum(unmapped.values())} samples with unmapped political entity: {unmapped}")
    groups_count: dict[str, int] = {}
    for p in pops:
        groups_count[p["transition"]] = groups_count.get(p["transition"], 0) + 1

    manifest = {
        "aadr_release": RELEASE, "aadr_release_date": RELEASE_DATE, "built": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "git_commit": commit, "window": {"start": V1[0], "end": V1[1]},
        "counts": {"samples": samples["n"], "populations": len(pops), "relationships": len(rels), "admixture_edges": len(edges),
                   "evidence": len(ontology["evidence"]), "sources": len(ontology["sources"]),
                   "ancient_individuals_total": ind.height, "assigned_samples": sum(1 for x in pop_primary if x >= 0)},
        "coverage": {"by_continent": cov, "unmapped": sum(unmapped.values()), "populations_by_group": groups_count},
        "hashes": hashes,
    }
    write(OUT / "manifest.json", manifest)
    print(json.dumps(manifest["counts"]))


if __name__ == "__main__":
    main()
