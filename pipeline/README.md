# pipeline/

Python + Polars. Reproducible steps from immutable raw files to curated, validated, browser-ready data.

```
cd pipeline
uv sync                                   # install pinned deps
uv run python -m aadr.download            # fetch + md5-verify AADR metadata into data/raw/aadr/<release>/
uv run python -m aadr.inspect_anno        # write research/sources/aadr-<release>-inspection.md
```

- `aadr/manifest.py` — pinned release, Dataverse file ids, md5 checksums, licence.
- `aadr/columns.py` — positional column map with header-prefix assertions.
- `aadr/dates.py` — date parsing onto the astronomical-year axis (see `DATA_MODEL.md`).
