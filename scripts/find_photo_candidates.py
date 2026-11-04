#!/usr/bin/env python3
"""Find better Wikimedia Commons photos for catalog questions.

Reads catalogs/photo-requests.json, searches Commons' reviewed collections
(Featured pictures first, then Quality images) for each request, and saves
small previews plus real author/licence metadata to review/ so a person can
pick a replacement. Nothing in the catalogs is changed.

Run from the repository root:  python3 scripts/find_photo_candidates.py
"""
import html
import json
import re
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
REQUESTS = ROOT / "catalogs" / "photo-requests.json"
OUT = ROOT / "review"
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "GuessThePhotoFinder/1.0 (static educational quiz; finding openly licensed photos)"
COLLECTIONS = ["Featured pictures on Wikimedia Commons", "Quality images"]
ALLOWED_LICENCES = re.compile(r"^(CC BY(-SA)? [0-9.]+|CC0( 1\.0)?|Public domain)", re.I)
PER_REQUEST = 6


def plain(value):
    """Commons metadata is HTML; keep the text only."""
    return html.unescape(re.sub(r"<[^>]+>", "", value or "")).strip()


def search(session, query, collection):
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrlimit": 20, "gsrsearch": f'{query} incategory:"{collection}"',
        "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 640,
        "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|ImageDescription",
    }
    response = session.get(API, params=params, timeout=60)
    response.raise_for_status()
    pages = (response.json().get("query") or {}).get("pages") or {}
    return sorted(pages.values(), key=lambda p: p.get("index", 0))


def main():
    requests_list = json.loads(REQUESTS.read_text(encoding="utf-8"))["requests"]
    (OUT / "previews").mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    results = {}
    for req in requests_list:
        found, seen = [], set()
        for collection in COLLECTIONS:
            for page in search(session, req["query"], collection):
                info = (page.get("imageinfo") or [{}])[0]
                meta = info.get("extmetadata") or {}
                licence = plain((meta.get("LicenseShortName") or {}).get("value"))
                title = page["title"]
                if title in seen or info.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
                    continue
                if not ALLOWED_LICENCES.match(licence):
                    continue
                width, height = info.get("width", 0), info.get("height", 0)
                if min(width, height) < 1000:
                    continue
                seen.add(title)
                index = len(found) + 1
                preview = OUT / "previews" / f"{req['id']}_{index}.jpg"
                try:
                    data = session.get(info["thumburl"], timeout=60).content
                    with Image.open(BytesIO(data)) as im:
                        im = ImageOps.exif_transpose(im).convert("RGB")
                        im.thumbnail((640, 640))
                        im.save(preview, "JPEG", quality=80)
                except Exception as exc:  # keep going; one bad file should not stop the batch
                    print(f"{req['id']}: preview failed for {title}: {exc}")
                    continue
                file_name = title.split(":", 1)[1]
                found.append({
                    "candidate": index,
                    "collection": collection,
                    "file": file_name,
                    "sourcePage": info.get("descriptionurl"),
                    "sourceUrl": "https://commons.wikimedia.org/wiki/Special:FilePath/" + requests.utils.quote(file_name.replace(" ", "_")) + "?width=1200",
                    "creator": plain((meta.get("Artist") or {}).get("value")),
                    "license": licence,
                    "licenseUrl": plain((meta.get("LicenseUrl") or {}).get("value")),
                    "size": f"{width}x{height}",
                    "description": plain((meta.get("ImageDescription") or {}).get("value"))[:300],
                    "preview": f"review/previews/{preview.name}",
                })
                time.sleep(1)
                if len(found) >= PER_REQUEST:
                    break
            if len(found) >= PER_REQUEST:
                break
        results[req["id"]] = {"query": req["query"], "answer": req.get("answer"), "candidates": found}
        print(f"{req['id']} ({req['query']}): {len(found)} candidates")
    (OUT / "candidates.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
