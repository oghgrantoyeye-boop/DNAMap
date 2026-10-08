"""Download the pinned AADR release files into data/raw/aadr/<release>/ and verify md5.

Usage (from pipeline/):
    uv run python -m aadr.download            # default metadata files
    uv run python -m aadr.download --all      # also genotype files (many GB)
    uv run python -m aadr.download --verify   # only verify what is on disk
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import urllib.request
from pathlib import Path

from aadr.manifest import DATAVERSE_API, FILES, RELEASE

REPO = Path(__file__).resolve().parents[2]
RAW_DIR = REPO / "data" / "raw" / "aadr" / RELEASE


def md5sum(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(name: str, file_id: int, dest: Path) -> None:
    url = f"{DATAVERSE_API}/access/datafile/{file_id}"
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"  downloading {name} <- {url}")
    with urllib.request.urlopen(url, timeout=600) as r, tmp.open("wb") as out:
        while chunk := r.read(1 << 20):
            out.write(chunk)
    tmp.rename(dest)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="include large genotype files")
    ap.add_argument("--verify", action="store_true", help="verify only, no download")
    args = ap.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    ok = True
    for name, (file_id, md5, size, default) in FILES.items():
        if not (default or args.all):
            continue
        dest = RAW_DIR / name
        if not dest.exists():
            if args.verify:
                print(f"MISSING {name}")
                ok = False
                continue
            fetch(name, file_id, dest)
        got = md5sum(dest)
        if got != md5:
            print(f"CHECKSUM MISMATCH {name}: expected {md5}, got {got}")
            ok = False
        else:
            print(f"ok {name} ({dest.stat().st_size} bytes, md5 {got})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
