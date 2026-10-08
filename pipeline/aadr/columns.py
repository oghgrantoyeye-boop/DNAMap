"""Column map for AADR v66.p1 `.anno` files.

AADR headers are long free-text descriptions that change between releases, so we
map columns by position and assert that each header starts with the expected
prefix. If a future release reorders or renames columns, `read_anno` fails
loudly instead of silently mis-assigning fields.
"""

from __future__ import annotations

from pathlib import Path

import polars as pl

# (short name, expected header prefix). Order = column order in the file.
COLUMNS: list[tuple[str, str]] = [
    ("genetic_id", "Genetic ID"),
    ("persistent_id", "Persistent Genetic ID"),
    ("individual_id", "Individual ID"),
    ("skeletal_code", "Skeletal code"),
    ("skeletal_element", "Skeletal element"),
    ("first_publication", "First publication"),
    ("publication", "Publication abbreviation"),
    ("doi", "doi for publication"),
    ("data_repository", "Link to the most permanent repository"),
    ("date_method", "Method for Determining Date"),
    ("date_mean_bp", "Date mean in BP"),
    ("date_sd_bp", "Date standard deviation in BP"),
    ("full_date", "Full Date"),
    ("age_sex_morph", "Age at death, Morphological sex"),
    ("group_id", "Group ID"),
    ("locality", "Locality"),
    ("political_entity", "Political Entity"),
    ("latitude", "Latitude"),
    ("longitude", "Longitude"),
    ("pulldown_strategy", "Pulldown Strategy"),
    ("data_suffixes", "Suffices"),
    ("data_type", "Data type"),
    ("n_libraries", "No. Libraries"),
    ("coverage_1240k_targets", "Mean coverage on 1.15M autosomal targets"),
    ("coverage_off_target", "Mean coverage on non-targeted"),
    ("snps_2m", "SNPs hit on autosomal targets (Computed using easystats on enhance 2M"),
    ("snps_1240k", "SNPs hit on autosomal targets (Computed using easystats on 1240k"),
    ("snps_ho", "SNPs hit on autosomal targets (Computed using easystats on HO"),
    ("snps_compat", "SNPs hit on autosomal targets (Computed using easystats on Compatibility snpset"),
    ("snps_compat_ho", "SNPs hit on autosomal targets (Computed using easystats on Compatibility_HO"),
    ("molecular_sex", "Molecular Sex"),
    ("family_relations", "Family relations"),
    # Two adjacent columns share the header "Sum total of ROH segments >20cM" in
    # v66.p1 (a header error in the release); we keep both, unlabelled by threshold.
    ("roh_a", "Sum total of ROH segments"),
    ("roh_b", "Sum total of ROH segments"),
    ("y_hg_terminal", "Y haplogroup in terminal mutation notation"),
    ("y_hg_isogg", "Y haplogroup  in ISOGG notation"),
    ("y_hg_manual", "Y haplogroup manually called"),
    ("mt_coverage", "mtDNA coverage"),
    ("mt_hg", "mtDNA haplogroup"),
    ("mt_match", "mtDNA match to consensus"),
    ("damage_rate", "Damage rate in first nucleotide"),
    ("sex_ratio", "Sex ratio"),
    ("contam_angsd", "ANGSD MOM"),
    ("contam_hapconx", "hapConX"),
    ("library_type", "Library type"),
    ("libraries", "Libraries"),
    ("endogenous", "endogenous by library"),
    ("assessment", "ASSESSMENT"),
    ("assessment_warnings", "ASSESSMENT WARNINGS"),
]

# Values AADR uses for "no data".
MISSING = ["..", "", "n/a", "NA"]


def read_anno(path: Path) -> pl.DataFrame:
    """Read an .anno file as all-string columns with short names (values verbatim)."""
    df = pl.read_csv(path, separator="\t", infer_schema=False, quote_char='"', encoding="utf8")
    headers = [h.strip().strip('"') for h in df.columns]
    if len(headers) != len(COLUMNS):
        raise ValueError(f"{path.name}: expected {len(COLUMNS)} columns, found {len(headers)}")
    for i, ((short, prefix), header) in enumerate(zip(COLUMNS, headers)):
        if not header.startswith(prefix):
            raise ValueError(f"{path.name}: column {i} header {header[:60]!r} does not start with {prefix!r}")
    return df.rename(dict(zip(df.columns, [c[0] for c in COLUMNS])))
