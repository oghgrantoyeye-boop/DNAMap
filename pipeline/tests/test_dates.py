from aadr.dates import bp_to_year, era_to_year, parse_full_date, date_kind
from aadr.normalize import resolve_range, precision_class


def test_axis_conversions():
    assert era_to_year(1, "BCE") == 0
    assert era_to_year(2, "BCE") == -1
    assert era_to_year(1, "CE") == 1
    assert bp_to_year(0) == 1950
    assert bp_to_year(1950) == 0


def test_parse_direct_calibrated():
    p = parse_full_date('"6221-5986 calBCE (7205±50 BP, OxA-7738)"')
    assert (p.start, p.end, p.calibrated) == (-6220, -5985, True)
    assert (p.c14_age_bp, p.c14_error, p.lab_code) == (7205, 50, "OxA-7738")


def test_parse_contextual_and_cross_era():
    def se(t):
        p = parse_full_date(t)
        return (p.start, p.end)

    assert se("2600-2000 BCE") == (-2599, -1999)
    p = parse_full_date("50 calBCE - 120 calCE (1950±30 BP, X-1)")
    assert (p.start, p.end) == (-49, 120)
    assert se("1954 CE") == (1954, 1954)
    assert se("1200–1300 CE") == (1200, 1300)  # en dash


def test_parse_r_combine_takes_leading_range():
    p = parse_full_date("2457-2210 calBCE (3870±25 BP) [R_Combine: (3880±30 BP, A-1), (3860±40 BP, B-2)]")
    assert (p.start, p.end) == (-2456, -2209)


def test_open_ended():
    p = parse_full_date(">43500 calBCE (45300±2300 BP, OxA-32278)")
    assert p.open_ended and p.start == -43499


def test_date_kind():
    assert date_kind("Direct: IntCal20") == "direct_radiocarbon"
    assert date_kind("Context: Archaeological") == "contextual"
    assert date_kind("Modern") == "present_day"


def test_resolve_consistent_uses_text_range():
    p = parse_full_date("6221-5986 calBCE (7205±50 BP, OxA-7738)")
    s, e, src, conflict = resolve_range(p, 8053, 64)
    assert (s, e, src, conflict) == (-6220, -5985, "full_date", None)


def test_resolve_calbp_mislabelled_as_calbce_gives_union():
    # Regression (AADR v66.p1, GoyetQ376-19): a cal BP interval written as calBCE.
    p = parse_full_date("27717-27301 calBCE (23260±105 BP, GrA-54026)")
    s, e, src, conflict = resolve_range(p, 27509, 120)
    assert conflict == "full_date_inconsistent_with_mean_bp"
    assert src == "union_full_date_and_mean_sd"
    assert s == -27716 and e == bp_to_year(27509 - 240)


def test_resolve_open_ended_uses_mean_sd():
    p = parse_full_date(">43500 calBCE (45300±2300 BP, OxA-32278)")
    s, e, src, conflict = resolve_range(p, 50000, 5000)
    assert conflict == "full_date_open_ended" and src == "derived_from_mean_sd"
    assert (s, e) == (bp_to_year(60000), bp_to_year(40000))


def test_precision_class():
    assert precision_class("49.81", "6.4") == "coarse"
    assert precision_class("36.93", "25.61") == "site"
    assert precision_class("36.937529", "25.60652") == "fine"
    assert precision_class("..", "..") == "missing"
