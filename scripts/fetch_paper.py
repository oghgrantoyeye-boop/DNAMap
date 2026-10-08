"""Fetch the open-access full text of a paper for local reading during research.

Usage:
    python3 scripts/fetch_paper.py <DOI> [<DOI> ...] [--out DIR]

Looks the DOI up in Europe PMC; if an open-access full text exists, saves it as
plain text (section headings kept, one paragraph per line, figure/table captions
marked) to DIR/<doi-slug>.txt. Default DIR is $PAPER_CACHE or ./.paper-cache.

Full texts are for checking claims only. They are NOT committed (copyright):
research notes paraphrase and cite by section/figure instead.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

API = "https://www.ebi.ac.uk/europepmc/webservices/rest"


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "dnamap-research/0.1"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def lookup(doi: str) -> dict | None:
    q = urllib.parse.quote(f'DOI:"{doi}"')
    data = json.loads(get(f"{API}/search?query={q}&format=json&resultType=core"))
    res = data.get("resultList", {}).get("result", [])
    return res[0] if res else None


def text_of(el: ET.Element) -> str:
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip()


def xml_to_text(xml: bytes) -> str:
    root = ET.fromstring(xml)
    out: list[str] = []
    title = root.find(".//article-title")
    if title is not None:
        out.append("# " + text_of(title))
    abstract = root.find(".//abstract")
    if abstract is not None:
        out.append("## Abstract")
        out.append(text_of(abstract))
    body = root.find(".//body")
    if body is not None:
        def walk(el: ET.Element, depth: int) -> None:
            for child in el:
                tag = child.tag
                if tag == "sec":
                    t = child.find("title")
                    if t is not None:
                        out.append("#" * min(depth + 2, 6) + " " + text_of(t))
                    walk(child, depth + 1)
                elif tag == "p":
                    out.append(text_of(child))
                elif tag in ("fig", "table-wrap"):
                    label = child.find("label")
                    cap = child.find("caption")
                    out.append(f"[{tag.upper()} {text_of(label) if label is not None else ''}] "
                               + (text_of(cap) if cap is not None else ""))
                elif tag in ("list", "disp-quote", "boxed-text"):
                    out.append(text_of(child))
        walk(body, 0)
    back = root.find(".//back")
    if back is not None:
        for sec in back.iter("sec"):
            t = sec.find("title")
            if t is not None:
                out.append("## [back] " + text_of(t))
            for p in sec.findall("p"):
                out.append(text_of(p))
    return "\n\n".join(out)


def main(argv: list[str]) -> int:
    out_dir = Path(os.environ.get("PAPER_CACHE", ".paper-cache"))
    if "--out" in argv:
        i = argv.index("--out")
        out_dir = Path(argv[i + 1])
        argv = argv[:i] + argv[i + 2:]
    out_dir.mkdir(parents=True, exist_ok=True)
    status = 0
    for doi in argv:
        slug = re.sub(r"[^A-Za-z0-9]+", "_", doi).strip("_")
        dest = out_dir / f"{slug}.txt"
        if dest.exists():
            print(f"cached {doi} -> {dest}")
            continue
        meta = lookup(doi)
        if not meta:
            print(f"NOT FOUND {doi}")
            status = 1
            continue
        pmcid = meta.get("pmcid")
        head = f"{meta.get('authorString','')[:200]} ({meta.get('pubYear')}) {meta.get('title')} {meta.get('journalInfo',{}).get('journal',{}).get('title','')} doi:{doi} {pmcid or ''}"
        if not pmcid:
            print(f"NO OA FULL TEXT {doi} ({head[:160]})")
            status = 1
            continue
        xml = None
        for url in (f"{API}/{pmcid}/fullTextXML",
                    f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id={pmcid.removeprefix('PMC')}"):
            try:
                xml = get(url)
                if b"<body" in xml:
                    break
                xml = None
            except Exception:  # noqa: BLE001
                xml = None
        if xml is None:
            print(f"FULLTEXT FAILED {doi} {pmcid}")
            status = 1
            continue
        dest.write_text(head + "\n\n" + xml_to_text(xml))
        print(f"ok {doi} -> {dest} ({dest.stat().st_size} bytes)")
    return status


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
