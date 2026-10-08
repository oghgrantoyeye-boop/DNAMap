"""Natural Earth shaded relief (SR_50M, public domain) → web texture.

Usage (from pipeline/): uv run python -m geo.relief
Writes apps/web/public/data/relief-4096.jpg: equirectangular, 4096×2048, grayscale.
The app reprojects it on the GPU into the map's Equal Earth view and draws it
only inside land, as texture. It is present-day relief.
"""

from __future__ import annotations

import hashlib
import io
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "data" / "raw" / "naturalearth" / "SR_50M.zip"
URL = "https://naciscdn.org/naturalearth/50m/raster/SR_50M.zip"
MD5 = "7cebeeba5706babb4d58d7bd2e7b8d4b"
OUT = REPO / "apps" / "web" / "public" / "data" / "relief-4096.jpg"

Image.MAX_IMAGE_PIXELS = None


def main() -> None:
    if not RAW.exists():
        RAW.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(URL, timeout=300) as r:
            RAW.write_bytes(r.read())
    if hashlib.md5(RAW.read_bytes()).hexdigest() != MD5:
        raise SystemExit("SR_50M.zip md5 mismatch")
    with zipfile.ZipFile(RAW) as z:
        im = Image.open(io.BytesIO(z.read("SR_50M.tif")))
        im.load()
    im = im.convert("L").resize((4096, 2048), Image.LANCZOS)
    im.save(OUT, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB) from {im.size}")


if __name__ == "__main__":
    main()
