"""Parse AADR date fields into ranges on the project's astronomical-year axis.

Convention (see DATA_MODEL.md): years are integers on the astronomical axis,
1 CE = 1, 1 BCE = 0, 2 BCE = -1. BP means years before 1950 CE, so
astronomical_year = 1950 - BP.

AADR gives, per row:
  * `date_mean_bp` / `date_sd_bp`: OxCal mean/sigma for direct radiocarbon dates,
    or midpoint / uniform-distribution SD for contextual ranges.
  * `full_date`: free text. Usually "A-B calBCE (C14±err BP, LabCode)" for direct
    dates (95.4% calibrated interval) or "A-B BCE" for contextual ranges, with
    ~60 minor variants (see the inspection report).

We keep `full_date` verbatim and derive a [start, end] range from it when it
parses; otherwise we fall back to mean ± 2 SD from the BP columns, and record
which path was used.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

BP_ZERO = 1950


def bp_to_year(bp: float) -> int:
    return int(round(BP_ZERO - bp))


def year_to_bp(year: int) -> int:
    return BP_ZERO - year


def era_to_year(value: int, era: str) -> int:
    """Convert a calendar year with an era label to the astronomical axis."""
    era = era.upper()
    if era == "BCE":
        return 1 - value
    if era == "CE":
        return value
    if era == "BP":
        return bp_to_year(value)
    raise ValueError(era)


@dataclass(frozen=True)
class ParsedDate:
    start: int  # astronomical year, older bound
    end: int  # astronomical year, younger bound
    calibrated: bool  # 'cal' present: a calibrated radiocarbon interval
    c14_age_bp: int | None  # conventional radiocarbon age, if given
    c14_error: int | None
    lab_code: str | None
    open_ended: bool = False  # e.g. ">5000 calBCE"


_ERA = r"(?P<{n}>cal\s*BCE|cal\s*CE|calBCE|calCE|BCE|CE|BP)"
_NUM = r"(?P<{n}>\d{{1,6}})"
# "A-B ERA" (one era for both bounds)
RANGE_ONE_ERA = re.compile(rf"^\s*{_NUM.format(n='a')}\s*-\s*{_NUM.format(n='b')}\s*{_ERA.format(n='era')}")
# "A ERA1 - B ERA2" (e.g. "50 calBCE - 120 calCE")
RANGE_TWO_ERA = re.compile(
    rf"^\s*{_NUM.format(n='a')}\s*{_ERA.format(n='era1')}\s*-\s*{_NUM.format(n='b')}\s*{_ERA.format(n='era2')}"
)
SINGLE = re.compile(rf"^\s*(?P<gt>>)?\s*{_NUM.format(n='a')}\s*{_ERA.format(n='era')}\s*(?:$|[\(\[;,])")
C14 = re.compile(r"\(\s*(?P<age>\d{2,6})\s*±\s*(?P<err>\d{1,5})\s*BP\s*,\s*(?P<lab>[^)\]]+?)\s*\)")


def _norm_era(era: str) -> tuple[str, bool]:
    e = era.replace(" ", "")
    cal = e.lower().startswith("cal")
    return (e[3:] if cal else e).upper(), cal


def parse_full_date(text: str | None) -> ParsedDate | None:
    if text is None:
        return None
    t = text.strip().strip('"').replace("–", "-").replace("—", "-")
    if not t or t == "..":
        return None
    c14 = C14.search(t)
    age = int(c14["age"]) if c14 else None
    err = int(c14["err"]) if c14 else None
    lab = c14["lab"].strip() if c14 else None

    m = RANGE_TWO_ERA.match(t)
    if m:
        e1, cal1 = _norm_era(m["era1"])
        e2, cal2 = _norm_era(m["era2"])
        y1, y2 = era_to_year(int(m["a"]), e1), era_to_year(int(m["b"]), e2)
        return ParsedDate(min(y1, y2), max(y1, y2), cal1 or cal2, age, err, lab)
    m = RANGE_ONE_ERA.match(t)
    if m:
        e, cal = _norm_era(m["era"])
        y1, y2 = era_to_year(int(m["a"]), e), era_to_year(int(m["b"]), e)
        return ParsedDate(min(y1, y2), max(y1, y2), cal, age, err, lab)
    m = SINGLE.match(t)
    if m:
        e, cal = _norm_era(m["era"])
        y = era_to_year(int(m["a"]), e)
        return ParsedDate(y, y, cal, age, err, lab, open_ended=bool(m["gt"]))
    return None


def date_kind(method: str | None) -> str:
    """Coarse dating-method class from AADR's free-text 'Method for Determining Date'."""
    if not method:
        return "unknown"
    m = method.strip().lower()
    if m.startswith("modern"):
        return "present_day"
    if m.startswith("direct"):
        return "direct_radiocarbon"
    if m.startswith("context"):
        return "contextual"
    if m.startswith("genetic"):
        return "genetic"
    if m.startswith("method"):
        # e.g. "Method: Tethering to radiocarbon dated close genetic relatives..."
        return "relative_tethered"
    return "other"
