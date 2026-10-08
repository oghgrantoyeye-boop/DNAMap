# Date conventions

## Storage axis: astronomical years (decision)
All stored years are **integers on the astronomical axis**: 1 CE = 1, **1 BCE = 0**, 2 BCE = −1, *n* BCE = 1 − *n*.

Why this axis rather than BP:
- The app displays BCE/CE, and most AADR `full_date` ranges are already written in BCE/CE. Storing on the display axis avoids round-trips.
- Arithmetic (overlap, sorting, scales) works on the astronomical axis without the BCE/CE gap.
- BP ("before present", where present = 1950 CE) converts exactly: `year = 1950 − BP`.

Display rules (in `packages/data-model/src/time.ts`):
- `year ≤ 0` → `(1 − year) BCE`; `year ≥ 1` → `year CE`.
- "years ago" mode shows `2000 − year`, rounded, labelled "years ago (from 2000 CE)". Our "years ago" is deliberately not "BP", because BP is anchored to 1950 and readers do not expect that.
- Round displayed numbers to the precision the data supports: hundreds for most prehistoric ranges, thousands before ~15,000 BCE. Stored values are never rounded.

## Ranges, not points
Every dated thing stores `{start, end}` (start ≤ end, older first), plus how the range was obtained:
- **Direct radiocarbon:** AADR's `full_date` gives the 95.4% calibrated interval (IntCal20 or SHCal20 via OxCal), with the conventional 14C age and lab code when available. We keep `date_mean_bp`/`date_sd_bp` as well, because the calibrated distribution is not uniform.
- **Contextual:** a range from archaeological or historical context. AADR's SD for these is the SD of a uniform distribution over the range.
- **Genetic / tethered:** dates inferred from relatives or from genetics; flagged.
- **Fallback:** when `full_date` cannot be parsed (0 rows in v66.p1), use mean ± 2·SD and flag it as `derived_from_mean_sd`.

Calibration caveats we carry as flags rather than corrections. We never recalibrate:
- AADR warnings in the method text (missing lab code, missing uncalibrated date, marine or freshwater reservoir effects not applied, old calibration curve) become `date_warnings` on the individual.
- Individuals whose diet may cause a reservoir offset (e.g. fishers) can appear older than they are; the warning is shown on the sample card.

## Admixture dates are a different kind of date
Admixture-dating methods (e.g. ALDER, DATES, segment-length methods) estimate *generations before the sampled individuals lived*. They are converted to years with an assumed generation time (usually 28–29 years), which the paper states. We store:
- `admixture_date: {start, end, method, generation_time_years, relative_to: "sample_dates" | "present", source_ids}`.
- If the paper gives generations before the sample, we store that as well as the converted calendar range, so that a different generation time can be applied later.
These ranges are drawn differently from sample dates (DESIGN.md: a separate band on the timeline).

## Model-based split times
Population split times from demographic models (e.g. "CHG split from WHG ~45 ka", Jones 2015) depend on mutation rate and model assumptions. They are stored as `model_estimate` dates with `confidence ≤ medium` and are never drawn as observed events.
