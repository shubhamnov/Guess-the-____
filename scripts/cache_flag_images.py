#!/usr/bin/env python3
"""Cache all flag images used by Daily Mix and Guess the Flag as small local WebP files."""
import json
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "daily-challenge-data-v1.js"
ASSET_DIR = ROOT / "assets" / "flags"
USER_AGENT = "GuessTheBlank/1.0 (static educational quiz; flag image caching)"
MAX_SIZE = (320, 240)
QUALITY = 68


def read_data():
    source = DATA_FILE.read_text(encoding="utf-8")
    marker = source.find("=")
    if marker < 0:
        raise RuntimeError("Could not locate the Daily Mix data object.")
    return json.loads(source[marker + 1:].strip().removesuffix(";").strip())


def fetch_image(session, url, code):
    for attempt in range(6):
        try:
            response = session.get(url, timeout=30)
            if response.status_code == 429 or response.status_code >= 500:
                if attempt == 5:
                    response.raise_for_status()
                retry_after = response.headers.get("Retry-After", "")
                delay = int(retry_after) if retry_after.isdigit() else min(30, 2 ** (attempt + 1))
                print(f"{code}: HTTP {response.status_code}; retrying in {delay}s")
                time.sleep(delay)
                continue
            response.raise_for_status()
            if not response.headers.get("Content-Type", "").lower().startswith("image/"):
                raise RuntimeError(f"{code}: response was not an image")
            return response
        except requests.RequestException as exc:
            if attempt == 5:
                raise RuntimeError(f"{code}: download failed after retries: {exc}") from exc
            delay = min(30, 2 ** (attempt + 1))
            print(f"{code}: request failed; retrying in {delay}s")
            time.sleep(delay)
    raise RuntimeError(f"{code}: unable to download image")


def main():
    data = read_data()
    flags = data.get("flags", [])
    codes = sorted({item[1].lower() for item in flags if len(item) >= 2})
    if not codes:
        raise RuntimeError("No flag codes found in the Daily Mix snapshot.")

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "image/png,image/*,*/*;q=0.8"})
    created = 0
    total_bytes = 0

    for index, code in enumerate(codes, start=1):
        target = ASSET_DIR / f"{code}.webp"
        if target.exists() and target.stat().st_size:
            total_bytes += target.stat().st_size
            continue
        url = f"https://flagcdn.com/w320/{code}.png"
        response = fetch_image(session, url, code)
        with Image.open(BytesIO(response.content)) as source:
            optimized = ImageOps.exif_transpose(source).convert("RGBA")
            optimized.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
            buffer = BytesIO()
            optimized.save(buffer, format="WEBP", quality=QUALITY, method=6)
        payload = buffer.getvalue()
        target.write_bytes(payload)
        total_bytes += len(payload)
        created += 1
        print(f"[{index}/{len(codes)}] {code}: {len(response.content)} -> {len(payload)} bytes")
        time.sleep(0.2)

    print(f"Flag cache ready: {len(codes)} unique codes, {created} new files, {total_bytes} bytes total.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
