# data/raw/

Immutable source files. **Not committed** (see `.gitignore`). Recreate with:

```
cd pipeline && uv run python -m aadr.download        # AADR metadata (.anno) + README
```

Every file here is fetched by a script that pins the source URL, version, and checksum. Never edit files in this directory; corrections go in `data/curated/overrides/` with a source and reason.
