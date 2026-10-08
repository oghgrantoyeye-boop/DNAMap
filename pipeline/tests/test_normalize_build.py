"""Integration checks on the built individuals table (requires `python -m aadr.normalize`)."""
from pathlib import Path

import polars as pl
import pytest

from aadr.manifest import RELEASE

IND = Path(__file__).resolve().parents[2] / "data" / "processed" / f"aadr_{RELEASE}_individuals.parquet"
pytestmark = pytest.mark.skipif(not IND.exists(), reason="run aadr.normalize first")


@pytest.fixture(scope="module")
def ind():
    return pl.read_parquet(IND)


def test_one_row_per_individual(ind):
    assert ind["individual_id"].n_unique() == ind.height


def test_ranges_ordered_and_not_in_future(ind):
    assert ind.filter(pl.col("start") > pl.col("end")).height == 0
    assert ind["end"].max() <= 2000


def test_overrides_applied(ind):
    r = ind.filter(pl.col("individual_id") == "19651").row(0, named=True)
    assert (r["start"], r["end"]) == (-3983, -3367)
    assert "ov-0003" in r["override_ids"]
    # Regression: an EBA individual must not appear in the Common Era.
    r = ind.filter(pl.col("individual_id") == "BK7").row(0, named=True)
    assert r["end"] < 0


def test_no_present_day_rows(ind):
    assert ind.filter(pl.col("date_kind") == "present_day").height == 0
