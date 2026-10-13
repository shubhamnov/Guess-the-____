#!/usr/bin/env python3
"""Download Wikimedia Commons landmark photos and store optimized local WebP copies.

The catalog retains sourcePage, creator, license and the original sourceUrl for
attribution/provenance. The game uses image.url, which is changed to a local
relative path after the download succeeds.
"""
import json
import sys
from pathlib import Path
from io import BytesIO

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalogs" / "landmarks-v1.json"
ASSET_DIR = ROOT / "assets" / "landmarks"
USER_AGENT = "GuessTheLandmark/1.0 (static educational quiz; image caching and attribution)"
MAX_DIMENSIONS = (1200, 1200)
WEBP_QUALITY = 72


def main():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    questions = data.get("questions", [])
    if not questions:
        raise RuntimeError("The landmark catalog has no questions.")

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    pending = []

    # Validate/download/optimize all remote files before changing the catalog.
    for question in questions:
        image = question.get("image") or {}
        current_url = image.get("url", "")
        asset_name = f"{question['id']}.webp"
        asset_path = ASSET_DIR / asset_name
        if current_url.startswith("../assets/landmarks/") and asset_path.exists():
            continue

        source_url = image.get("sourceUrl") or current_url
        if not source_url.startswith("https://commons.wikimedia.org/"):
            raise RuntimeError(f"{question.get('id')}: unexpected image URL: {source_url}")

        response = session.get(source_url, timeout=45, allow_redirects=True)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "").lower()
        if not content_type.startswith("image/"):
            raise RuntimeError(
                f"{question['id']}: expected an image from {source_url}, got {content_type or 'unknown content type'}"
            )
        try:
            with Image.open(BytesIO(response.content)) as source:
                image_copy = ImageOps.exif_transpose(source).convert("RGB")
                image_copy.thumbnail(MAX_DIMENSIONS, Image.Resampling.LANCZOS)
                buffer = BytesIO()
                image_copy.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
                optimized_bytes = buffer.getvalue()
        except Exception as exc:
            raise RuntimeError(f"{question['id']}: downloaded content is not a readable image") from exc
        pending.append((question, source_url, asset_path, optimized_bytes))
        print(f"Prepared {question['id']}: {len(response.content)} -> {len(optimized_bytes)} bytes")

    for question, source_url, asset_path, optimized_bytes in pending:
        asset_path.write_bytes(optimized_bytes)
        image = question["image"]
        image["sourceUrl"] = source_url
        image["path"] = f"assets/landmarks/{asset_path.name}"
        image["url"] = f"../assets/landmarks/{asset_path.name}"
        question["status"] = "needs_image_render_check"

    data["notes"] = [
        "Landmark photos are stored in the repository as locally optimized WebP files so gameplay does not fetch each photo from Wikimedia Commons.",
        "Each image retains its sourcePage, sourceUrl, creator, and license metadata for attribution and provenance.",
        "Photo rendering in the published GitHub Pages site must still be checked before questions are marked approved."
    ]
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Processed {len(pending)} remote images; catalog now points to local assets.")
    print("Existing local images were retained without re-downloading.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
