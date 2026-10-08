"""Rebuild all processed, curated-derived and browser data from raw sources.

Usage (from pipeline/):  uv run python -m build
Steps: download+verify AADR → inspection report → normalize → sources.json →
membership → validation (fails the build on errors) → POPULATIONS.md →
basemap → relief → atlas → web export → data report.
"""

from __future__ import annotations

import sys

from aadr import download, inspect_anno, normalize
from curation import build_sources, populations_md
from export import web
from geo import atlas, basemap, relief
from populations import membership
from validation import validate

import data_report


def main() -> int:
    sys.argv = sys.argv[:1]
    if download.main() != 0:
        return 1
    inspect_anno.main()
    normalize.main()
    build_sources.main()
    membership.main()
    if validate.main() != 0:
        print("validation failed; stopping")
        return 1
    populations_md.main()
    basemap.main()
    relief.main()
    atlas.main()
    web.main()
    data_report.main()
    return 0


if __name__ == "__main__":
    sys.exit(main())
