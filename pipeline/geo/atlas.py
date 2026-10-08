"""Bake the base map into two textures for the GPU map renderer.

Usage (from pipeline/): uv run python -m geo.atlas
Reads  apps/web/public/data/basemap-50m.json (Natural Earth 1:50m land, lakes, glaciers, rivers; public domain)
Writes apps/web/public/data/atlas-sdf-4096.png      8-bit, equirectangular 4096x2048
         signed distance to the coast: 128 at the coast, 255 = 4 degrees inland, 0 = 4 degrees offshore
       apps/web/public/data/atlas-overlay-4096.png  RGB, equirectangular 4096x2048
         R = lakes, G = glaciated areas, B = rivers (anti-aliased coverage)

The web app's fragment shader inverts the Equal Earth projection for each screen pixel and
samples these (see apps/web/lib/gpuBase.ts), so panning and zooming cost one cheap GPU pass
instead of re-rasterising vector paths. Present-day geography.

Distance accuracy: an equirectangular texel is narrower east-west than north-south away
from the equator. The distance transform therefore runs per latitude band on a copy squeezed
horizontally by cos(latitude), so that distances are the same in every direction.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "apps" / "web" / "public" / "data" / "basemap-50m.json"
OUT = REPO / "apps" / "web" / "public" / "data"

W, H = 8192, 4096  # working resolution; written at half size
OUT_W, OUT_H = 4096, 2048
RANGE_DEG = 4.0  # distance stored either side of the coast
BAND = 256  # rows per latitude band at working resolution
DEG_PER_TEXEL = 360.0 / W


def to_px(lon: float, lat: float) -> tuple[float, float]:
    return ((lon + 180.0) / 360.0 * W, (90.0 - lat) / 180.0 * H)


def polygons(layer: dict) -> list[list[list[tuple[float, float]]]]:
    """Each polygon is [exterior, hole, hole...] in pixel coordinates."""
    out = []
    for f in layer["features"]:
        g = f["geometry"]
        if g is None:
            continue
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]] if g["type"] == "Polygon" else []
        for rings in polys:
            out.append([[to_px(x, y) for x, y in ring] for ring in rings])
    return out


def ring_area(ring: list[tuple[float, float]]) -> float:
    a = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        a += x0 * y1 - x1 * y0
    return abs(a) / 2


def fill(layer: dict) -> np.ndarray:
    """Even-odd fill, containers before the islands they hold (largest exterior first)."""
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    for rings in sorted(polygons(layer), key=lambda r: -ring_area(r[0])):
        d.polygon(rings[0], fill=255)
        for hole in rings[1:]:
            d.polygon(hole, fill=0)
    return np.asarray(img) > 127


def rivers(layer: dict) -> np.ndarray:
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    for f in layer["features"]:
        g = f["geometry"]
        if g is None:
            continue
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]] if g["type"] == "LineString" else []
        for line in lines:
            if len(line) > 1:
                d.line([to_px(x, y) for x, y in line], fill=255, width=2)
    return np.asarray(img)


def signed_distance_deg(land: np.ndarray) -> np.ndarray:
    """Distance to the coast in degrees: positive on land, negative at sea. Float32, working size."""
    sd = np.zeros((H, W), dtype=np.float32)
    margin = int(np.ceil(RANGE_DEG / DEG_PER_TEXEL)) + 8
    for a in range(0, H, BAND):
        b = min(H, a + BAND)
        lat_mid = 90.0 - ((a + b) / 2) / H * 180.0
        c = max(0.06, float(np.cos(np.radians(lat_mid))))
        lo, hi = max(0, a - margin), min(H, b + margin)
        sub = land[lo:hi].astype(np.float32)
        # squeeze columns so a texel covers the same ground distance east-west as north-south
        nw = max(8, int(round(W * c)))
        small = np.asarray(Image.fromarray(sub, mode="F").resize((nw, hi - lo), Image.BOX)) > 0.5
        pad = int(np.ceil(RANGE_DEG / DEG_PER_TEXEL)) + 8
        padded = np.pad(small, ((0, 0), (pad, pad)), mode="wrap")
        d_in = ndimage.distance_transform_edt(padded)  # land pixels: distance to the sea
        d_out = ndimage.distance_transform_edt(~padded)  # sea pixels: distance to land
        s = (d_in - d_out).astype(np.float32)[:, pad:-pad]
        s = np.asarray(Image.fromarray(s, mode="F").resize((W, hi - lo), Image.BILINEAR))
        sd[a:b] = s[a - lo : b - lo]
    return sd * DEG_PER_TEXEL


def halve(a: np.ndarray) -> np.ndarray:
    return a.reshape(OUT_H, 2, OUT_W, 2).mean(axis=(1, 3))


def main() -> None:
    layers = json.loads(SRC.read_text())["layers"]
    print("land …")
    land = fill(layers["land"])
    print("signed distance …")
    sd = halve(signed_distance_deg(land))
    sd_byte = np.clip(np.round(127.5 + 127.5 * np.clip(sd / RANGE_DEG, -1, 1)), 0, 255).astype(np.uint8)
    p = OUT / "atlas-sdf-4096.png"
    Image.fromarray(sd_byte, mode="L").save(p, optimize=True)
    print(f"wrote {p} ({p.stat().st_size // 1024} KB)")
    print("overlay …")
    lakes = halve(fill(layers["lakes"]).astype(np.float32) * 255)
    glaciers = halve(fill(layers["glaciers"]).astype(np.float32) * 255)
    riv = halve(rivers(layers["rivers"]).astype(np.float32))
    rgb = np.stack([lakes, glaciers, riv], axis=-1).round().astype(np.uint8)
    p = OUT / "atlas-overlay-4096.png"
    Image.fromarray(rgb, mode="RGB").save(p, optimize=True)
    print(f"wrote {p} ({p.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
