"""Normalize the AADR .anno into one record per ancient individual.

Usage (from pipeline/):
    uv run python -m aadr.normalize

Reads:  data/raw/aadr/<release>/<PRIMARY_ANNO>  (md5-verified)
        data/curated/overrides/aadr_overrides.csv
Writes: data/processed/aadr_<release>_rows.parquet         all rows, parsed, representative flag
        data/processed/aadr_<release>_individuals.parquet  one row per ancient Individual ID

Rules (see DATA_MODEL.md §2):
  * present-day rows (date method "Modern") and reference rows (suffix REF) are excluded;
  * representative row = most SNPs hit on 1240k targets (AADR README advice), ties
    broken by genetic_id for determinism;
  * date range from the parsed Full Date (95.4% interval or contextual range); if
    unparseable, mean ± 2 SD from the BP columns (flagged);
  * coordinate precision class from the number of decimals written;
  * overrides applied last, each checked against the raw value.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

import polars as pl

from aadr.columns import MISSING, read_anno
from aadr.dates import bp_to_year, date_kind, parse_full_date
from aadr.download import RAW_DIR, md5sum
from aadr.manifest import FILES, PRIMARY_ANNO, RELEASE

REPO = Path(__file__).resolve().parents[2]
PROCESSED = REPO / "data" / "processed"
OVERRIDES = REPO / "data" / "curated" / "overrides" / "aadr_overrides.csv"

WARNING_RE = re.compile(r"(WARNING[^)\]]*|CAUTION[^)\]]*)", re.IGNORECASE)


def _blank(v: str | None) -> bool:
    return v is None or v.strip() in MISSING


def _num(v: str | None) -> float | None:
    if _blank(v):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def _decimals(v: str | None) -> int:
    if _blank(v):
        return -1
    v = v.strip()
    return len(v.split(".")[1]) if "." in v else 0


def precision_class(lat: str | None, lon: str | None) -> str:
    d = min(_decimals(lat), _decimals(lon))
    if d < 0:
        return "missing"
    if d >= 3:
        return "fine"
    if d == 2:
        return "site"
    return "coarse"


def resolve_range(pd_, mean_bp: float | None, sd_bp: float | None) -> tuple[int | None, int | None, str, str | None]:
    """Choose the stored date range for one AADR row.

    The parsed `Full Date` text is preferred (it carries the asymmetric 95.4%
    calibrated interval). It is rejected, and mean ± 2 SD used instead, when:
      * it is open-ended (">43500 calBCE"), which is a bound, not a range; or
      * the numeric `date_mean_bp` falls outside the text range by more than
        max(100 years, 1 SD). In v66.p1 this catches calibrated-BP ranges
        mislabelled "calBCE" (offset ≈ 1950 years) and BCE/CE swaps.
    In the second case the stored range is the union of both readings (see
    below). The verbatim text is always kept; `date_conflict` explains it.
    """
    fallback = None
    if mean_bp is not None:
        sd = sd_bp or 0
        fallback = (bp_to_year(mean_bp + 2 * sd), bp_to_year(mean_bp - 2 * sd))
    if pd_ is None:
        if fallback:
            return fallback[0], fallback[1], "derived_from_mean_sd", "full_date_unparsed"
        return None, None, "missing", "no_date"
    if pd_.open_ended:
        if fallback:
            return fallback[0], fallback[1], "derived_from_mean_sd", "full_date_open_ended"
        return pd_.start, pd_.end, "full_date", "full_date_open_ended"
    if mean_bp is not None:
        y = bp_to_year(mean_bp)
        tol = max(100.0, sd_bp or 0)
        if y < pd_.start - tol or y > pd_.end + tol:
            # Which field is wrong differs case by case (calBP ranges labelled
            # calBCE; BCE/CE swaps; BCE midpoints entered as BP; 14C ages
            # entered as calibrated means). We do not guess: store the union
            # of both readings so the uncertainty is visible, flag it, and fix
            # clear-cut cases in the overrides file with a reason.
            return (
                min(pd_.start, fallback[0]),
                max(pd_.end, fallback[1]),
                "union_full_date_and_mean_sd",
                "full_date_inconsistent_with_mean_bp",
            )
    return pd_.start, pd_.end, "full_date", None


def parse_rows(anno: Path) -> pl.DataFrame:
    df = read_anno(anno)
    records = []
    for r in df.iter_rows(named=True):
        kind = date_kind(r["date_method"])
        if kind == "present_day" or "REF" in (r["data_suffixes"] or ""):
            continue
        mean_bp = _num(r["date_mean_bp"])
        sd_bp = _num(r["date_sd_bp"])
        pd_ = parse_full_date(r["full_date"])
        start, end, src, conflict = resolve_range(pd_, mean_bp, sd_bp)
        warnings = sorted({w.strip() for w in WARNING_RE.findall(r["date_method"] or "")})
        snps = _num(r["snps_1240k"]) or 0
        records.append(
            {
                "genetic_id": r["genetic_id"],
                "persistent_id": r["persistent_id"],
                "individual_id": r["individual_id"],
                "skeletal_code": r["skeletal_code"],
                "group_label": r["group_id"],
                "locality": r["locality"],
                "political_entity": None if _blank(r["political_entity"]) else r["political_entity"],
                "source_lat": r["latitude"],
                "source_lon": r["longitude"],
                "lat": _num(r["latitude"]),
                "lon": _num(r["longitude"]),
                "precision": precision_class(r["latitude"], r["longitude"]),
                "start": start,
                "end": end,
                "range_source": src,
                "date_conflict": conflict,
                "mean_bp": mean_bp,
                "sd_bp": sd_bp,
                "full_date_text": r["full_date"],
                "method_text": r["date_method"],
                "date_kind": kind,
                "calibrated": bool(pd_ and pd_.calibrated),
                "c14_age_bp": pd_.c14_age_bp if pd_ else None,
                "c14_error": pd_.c14_error if pd_ else None,
                "lab_code": pd_.lab_code if pd_ else None,
                "date_warnings": warnings,
                "molecular_sex": r["molecular_sex"],
                "y_hg": None if _blank(r["y_hg_isogg"]) or r["y_hg_isogg"].startswith("n/a") else r["y_hg_isogg"],
                "mt_hg": None if _blank(r["mt_hg"]) else r["mt_hg"],
                "publication": r["publication"],
                "first_publication": r["first_publication"],
                "doi": None if _blank(r["doi"]) else r["doi"],
                "data_repository": None if _blank(r["data_repository"]) else r["data_repository"],
                "data_type": r["data_type"],
                "data_suffixes": r["data_suffixes"],
                "snps_1240k": int(snps),
                "assessment": r["assessment"],
                "assessment_warnings": None if _blank(r["assessment_warnings"]) else r["assessment_warnings"],
                "family_relations": None if _blank(r["family_relations"]) else r["family_relations"],
            }
        )
    rows = pl.DataFrame(records, infer_schema_length=None)
    rows = rows.sort(["individual_id", "snps_1240k", "genetic_id"], descending=[False, True, False])
    rows = rows.with_columns((pl.col("genetic_id") == pl.col("genetic_id").first().over("individual_id")).alias("representative"))
    return rows


def load_overrides() -> list[dict]:
    if not OVERRIDES.exists():
        return []
    with OVERRIDES.open() as f:
        return [r for r in csv.DictReader(f) if r.get("override_id") and not r["override_id"].startswith("#")]


OVERRIDABLE = {"lat", "lon", "start", "end", "group_label", "locality"}


def apply_overrides(ind: pl.DataFrame, overrides: list[dict]) -> pl.DataFrame:
    if not overrides:
        return ind.with_columns(pl.lit([], dtype=pl.List(pl.String)).alias("override_ids"))
    rows = {r["individual_id"]: r for r in ind.iter_rows(named=True)}
    applied: dict[str, list[str]] = {}
    for o in overrides:
        iid, field = o["individual_id"], o["field"]
        if field not in OVERRIDABLE:
            raise ValueError(f"override {o['override_id']}: field {field!r} not overridable")
        if iid not in rows:
            raise ValueError(f"override {o['override_id']}: unknown individual {iid}")
        current = rows[iid][field]
        if str(current) != o["old_value"] and not (current is None and o["old_value"] == ""):
            raise ValueError(
                f"override {o['override_id']}: stale old_value for {iid}.{field}: raw={current!r} override expects {o['old_value']!r}"
            )
        new = o["new_value"]
        rows[iid][field] = float(new) if field in {"lat", "lon"} else int(new) if field in {"start", "end"} else new
        applied.setdefault(iid, []).append(o["override_id"])
    out = pl.DataFrame(list(rows.values()), schema=ind.schema)
    return out.with_columns(
        pl.col("individual_id").map_elements(lambda i: applied.get(i, []), return_dtype=pl.List(pl.String)).alias("override_ids")
    )


def build_individuals(rows: pl.DataFrame) -> pl.DataFrame:
    alt = (
        rows.group_by("individual_id")
        .agg(
            pl.col("genetic_id").alias("genetic_ids"),
            pl.col("group_label").unique().alias("_labels"),
        )
    )
    rep = rows.filter(pl.col("representative")).drop("representative")
    ind = rep.join(alt, on="individual_id", how="left")
    ind = ind.with_columns(
        pl.struct("_labels", "group_label")
        .map_elements(lambda s: sorted(x for x in s["_labels"] if x != s["group_label"]), return_dtype=pl.List(pl.String))
        .alias("alt_group_labels"),
        pl.col("genetic_id").alias("representative_genetic_id"),
    ).drop("_labels", "genetic_id")
    shared = ind.group_by("lat", "lon").agg(pl.len().alias("shared_coordinate_count"))
    ind = ind.join(shared, on=["lat", "lon"], how="left", nulls_equal=True)
    ind = ind.with_columns((~pl.col("assessment").str.contains("CRITICAL")).alias("quality_usable"))
    return ind.sort("individual_id")


def main() -> None:
    anno = RAW_DIR / PRIMARY_ANNO
    expected = FILES[PRIMARY_ANNO][1]
    if md5sum(anno) != expected:
        raise SystemExit(f"{anno} md5 mismatch; run `uv run python -m aadr.download`")
    rows = parse_rows(anno)
    ind = build_individuals(rows)
    ind = apply_overrides(ind, load_overrides())
    PROCESSED.mkdir(parents=True, exist_ok=True)
    rows.write_parquet(PROCESSED / f"aadr_{RELEASE}_rows.parquet")
    ind.write_parquet(PROCESSED / f"aadr_{RELEASE}_individuals.parquet")
    print(f"rows: {rows.height}  individuals: {ind.height}  overrides applied: {sum(len(x) for x in ind['override_ids'])}")


if __name__ == "__main__":
    main()
