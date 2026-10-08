"""Fetch pinned Natural Earth layers and write compact GeoJSON for the web app.

Usage (from pipeline/):
    uv run python -m geo.basemap

Source: Natural Earth (public domain), https://www.naturalearthdata.com/,
downloaded from the official CDN https://naciscdn.org/naturalearth/.
md5 values were recorded on first download (2026-10-08); a mismatch fails the build.
"""

from __future__ import annotations

import hashlib
import io
import json
import urllib.request
import zipfile
from pathlib import Path

import shapefile  # pyshp (MIT)

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "data" / "raw" / "naturalearth"
OUT = REPO / "apps" / "web" / "public" / "data"
CDN = "https://naciscdn.org/naturalearth"

LAYERS = {
    "ne_110m_land": ("110m/physical", "3a2fddac35adedc5095e23b9129d3cb3"),
    "ne_110m_lakes": ("110m/physical", "e4bc0c3e31f68628d2f44a445b04de9b"),
    "ne_110m_rivers_lake_centerlines": ("110m/physical", "4d176ff6bb5be9e8417704a3e576c861"),
    "ne_110m_glaciated_areas": ("110m/physical", "4ebb7dfdd5727d4db2b96331ecf09f9e"),
    "ne_110m_admin_0_countries": ("110m/cultural", "374f5381a2ff702d3d79d345a9e5f65c"),
    "ne_50m_land": ("50m/physical", "b4510758906d2794c6ccba99fb48f211"),
    "ne_50m_lakes": ("50m/physical", "93de5a3d32451e7c18c75425b2f071dd"),
    "ne_50m_rivers_lake_centerlines": ("50m/physical", "45bb279adddffc35f3535cd01da2e45e"),
    "ne_50m_glaciated_areas": ("50m/physical", "9cb9236e05304cd761df102b1220ccd0"),
}


def fetch(name: str) -> Path:
    sub, md5 = LAYERS[name]
    dest = RAW / f"{name}.zip"
    if not dest.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(f"{CDN}/{sub}/{name}.zip", timeout=120) as r:
            dest.write_bytes(r.read())
    got = hashlib.md5(dest.read_bytes()).hexdigest()
    if got != md5:
        raise SystemExit(f"{name}: md5 {got} != pinned {md5}")
    return dest


def q(coords, nd):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], nd), round(coords[1], nd)]
    return [q(c, nd) for c in coords]


def read_layer(name: str, nd: int, keep: list[str] | None = None) -> dict:
    z = zipfile.ZipFile(fetch(name))
    shp = io.BytesIO(z.read(f"{name}.shp"))
    dbf = io.BytesIO(z.read(f"{name}.dbf"))
    shx = io.BytesIO(z.read(f"{name}.shx"))
    rdr = shapefile.Reader(shp=shp, dbf=dbf, shx=shx, encoding="utf-8")
    fields = [f[0] for f in rdr.fields[1:]]
    feats = []
    for sr in rdr.iterShapeRecords():
        if sr.shape.shapeType == shapefile.NULL:
            continue
        geom = sr.shape.__geo_interface__
        props = {}
        if keep:
            rec = dict(zip(fields, sr.record))
            props = {k: rec.get(k) for k in keep if k in rec}
        feats.append({"type": "Feature", "properties": props, "geometry": {"type": geom["type"], "coordinates": q(geom["coordinates"], nd)}})
    return {"type": "FeatureCollection", "features": feats}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for scale, nd in (("110m", 2), ("50m", 3)):
        layers = {
            "land": read_layer(f"ne_{scale}_land", nd),
            "lakes": read_layer(f"ne_{scale}_lakes", nd),
            "rivers": read_layer(f"ne_{scale}_rivers_lake_centerlines", nd, ["scalerank"]),
            "glaciers": read_layer(f"ne_{scale}_glaciated_areas", nd),
        }
        if scale == "110m":
            layers["borders"] = read_layer("ne_110m_admin_0_countries", nd, ["NAME"])
        doc = {"source": "Natural Earth (public domain)", "scale": scale, "layers": layers}
        path = OUT / f"basemap-{scale}.json"
        path.write_text(json.dumps(doc, separators=(",", ":")))
        print(f"wrote {path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
