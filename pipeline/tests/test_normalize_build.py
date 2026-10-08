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


def test_continent_mapping():
    from geo.continents import continent

    assert continent("Russia", 37.6) == "Europe"
    assert continent("Russia", 104.0) == "Asia"
    assert continent("Kenya", 36.8) == "Africa"
    assert continent("Greenland", -45.0) == "Americas"
    assert continent("Atlantis", 0.0) is None


AMERICAS = {"Argentina", "Bahamas", "Belize", "Bolivia", "Brazil", "Canada", "Chile", "Colombia", "Cuba", "Curacao", "Dominican Republic",
            "Greenland", "Guadeloupe", "Haiti", "Mexico", "Panama", "Paraguay", "Peru", "Puerto Rico", "Saint Lucia", "Uruguay", "Venezuela"}


def test_cuba_ceramic_longitude_regression(ind):
    # AADR wrote 77.844 (India) for Cueva de los Esqueletos 1, Camaguey, Cuba; corrected by ov-0011..0015.
    r = ind.filter(pl.col("individual_id") == "CDE001").row(0, named=True)
    assert r["lon"] == pytest.approx(-77.844)
    assert "ov-0011" in r["override_ids"]


def test_no_american_site_has_eastern_longitude(ind):
    # A dropped minus sign puts an American site in Africa, Europe or Asia. (USA is excluded: Guam and the
    # Northern Marianas are US territories in the western Pacific, with genuinely eastern longitudes.)
    bad = ind.filter(pl.col("political_entity").is_in(sorted(AMERICAS)) & (pl.col("lon") > 0))
    assert bad.height == 0, bad.select("individual_id", "political_entity", "lon").to_dicts()[:10]
