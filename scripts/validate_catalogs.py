#!/usr/bin/env python3
"""Check the photo catalogs against the rules in catalogs/README.md.

Run from the repository root:  python3 scripts/validate_catalogs.py
Exits with status 1 and lists every problem when a check fails.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGS = {"landmarks": "catalogs/landmarks-v1.json", "cuisines": "catalogs/cuisines-v1.json"}
REQUIRED = ["id", "prompt", "image", "options", "answer", "explanation", "difficulty", "status"]
IMAGE_REQUIRED = ["url", "path", "sourcePage", "creator", "license"]
DIFFICULTIES = {"easy", "medium", "hard"}


def check_catalog(name, rel_path, problems):
    data = json.loads((ROOT / rel_path).read_text(encoding="utf-8"))
    questions = data.get("questions", [])
    seen_ids = set()
    approved = 0
    for i, q in enumerate(questions):
        where = f"{rel_path} #{i} ({q.get('id', '?')})"
        for field in REQUIRED:
            if q.get(field) in (None, "", []):
                problems.append(f"{where}: missing {field}")
        qid = q.get("id")
        if qid in seen_ids:
            problems.append(f"{where}: duplicate id")
        seen_ids.add(qid)
        options = q.get("options") or []
        if len(options) != 4 or len(set(options)) != 4 or any(not str(o).strip() for o in options):
            problems.append(f"{where}: needs exactly 4 distinct, non-empty options")
        if options.count(q.get("answer")) != 1:
            problems.append(f"{where}: answer must appear exactly once in options")
        if q.get("difficulty") not in DIFFICULTIES:
            problems.append(f"{where}: difficulty must be one of {sorted(DIFFICULTIES)}")
        image = q.get("image") or {}
        # A question still waiting for its photo to be cached has no local file yet; games only show approved ones.
        waiting = q.get("status") != "approved" and not image.get("path")
        for field in IMAGE_REQUIRED:
            if waiting and field == "path":
                continue
            if not image.get(field):
                problems.append(f"{where}: image.{field} missing")
        if image.get("path") and not (ROOT / image["path"]).is_file():
            problems.append(f"{where}: image file {image['path']} not found")
        if image.get("url") and image.get("path") and not image["url"].endswith(image["path"]):
            problems.append(f"{where}: image.url and image.path point to different files")
        if q.get("status") == "approved":
            approved += 1
    return approved, len(questions)


def main():
    problems = []
    manifest = json.loads((ROOT / "catalogs/manifest-v1.json").read_text(encoding="utf-8"))
    by_id = {c["id"]: c for c in manifest.get("categories", [])}
    for name, rel_path in CATALOGS.items():
        approved, total = check_catalog(name, rel_path, problems)
        entry = by_id.get(name)
        if entry is None:
            problems.append(f"manifest: no category entry for {name}")
        elif entry.get("approvedQuestions") != approved:
            problems.append(f"manifest: {name} approvedQuestions is {entry.get('approvedQuestions')}, catalog has {approved}")
        print(f"{name}: {approved} approved of {total} questions")
    if problems:
        print("\n".join(["", "Problems found:"] + [f"  - {p}" for p in problems]))
        sys.exit(1)
    print("All catalog checks passed.")


if __name__ == "__main__":
    main()
