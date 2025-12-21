#!/usr/bin/env python3
"""
Convert Label Studio export -> simple CandorLens annotation JSONs.

Input:
  labelstudio_export_v1.json  (exported from Label Studio)

Output:
  One JSON per image in:
    ml/data/annotations/<image_stem>.json

For now we only map to 2 high-level labels:
  - BENIGN
  - FRC_FORCED_ACTION   (any FRC-* dark pattern)
"""

import json
import os
from pathlib import Path


# ---- CONFIG ----

PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXPORT_PATH = PROJECT_ROOT / "labelstudio_export_v1.json"
OUT_DIR = PROJECT_ROOT / "ml" / "data" / "annotations"

OUT_DIR.mkdir(parents=True, exist_ok=True)


def map_ls_to_internal(choices):
    """
    Map Label Studio choice strings to our internal labels.json IDs.

    LS examples:
      "BENIGN"
      "FRC-02 Forced Account Creation"
      "FRC-06 Blocking Content Until Action"
      "INT-07 Forced Popups"
      "SNK-04 Preselected Options"
    """
    internal = set()
    subpatterns = []

    for ch in choices:
        if not ch:
            continue
        subpatterns.append(ch)

        # BENIGN passthrough
        if ch == "BENIGN":
            internal.add("BENIGN")

        # Any Forced Action subpattern -> FRC_FORCED_ACTION
        if ch.startswith("FRC-"):
            internal.add("FRC_FORCED_ACTION")

        # (Later we can add mappings for SNK-*, OBS-*, etc.)

    return sorted(internal), subpatterns


def main():
    if not EXPORT_PATH.exists():
        raise SystemExit(f"❌ Export file not found: {EXPORT_PATH}")

    print(f"🔍 Loading Label Studio export from: {EXPORT_PATH}")
    with open(EXPORT_PATH, "r", encoding="utf-8") as f:
        tasks = json.load(f)

    print(f"Found {len(tasks)} tasks in export.\n")

    converted = 0

    for task in tasks:
        data = task.get("data", {})
        img_path = data.get("img") or data.get("image") or ""
        if not img_path:
            print("  ⚠️  Skipping task with no 'img'/'image' field:", task.get("id"))
            continue

        img_file = os.path.basename(img_path)

        # Collect all choices from annotations
        all_choices = []
        for ann in task.get("annotations", []):
            for res in ann.get("result", []):
                if res.get("from_name") == "labels":
                    choices = res.get("value", {}).get("choices", [])
                    all_choices.extend(choices)

        if not all_choices:
            print(f"  ⚠️  {img_file}: no choices selected, skipping.")
            continue

        internal_labels, subpatterns = map_ls_to_internal(all_choices)

        if not internal_labels:
            print(f"  ⚠️  {img_file}: no internal labels mapped from {all_choices}, skipping.")
            continue

        # Build labels array matching ml/labels_v1.json
        label_objs = []
        for lid in internal_labels:
            if lid == "BENIGN":
                label_objs.append({
                    "id": "BENIGN",
                    "name": "Benign (no dark pattern)"
                })
            elif lid == "FRC_FORCED_ACTION":
                label_objs.append({
                    "id": "FRC_FORCED_ACTION",
                    "name": "Forced Action"
                })

        ann_obj = {
            "image_file": img_file,
            "labels": label_objs,
            "raw_labelstudio_choices": subpatterns,
            "source": "labelstudio_v1",
            "multilabel": len(internal_labels) > 1
        }

        out_path = OUT_DIR / (Path(img_file).stem + ".json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(ann_obj, f, indent=2)

        converted += 1
        print(f"  ✅ Wrote {out_path}  (labels={internal_labels})")

    print(f"\n✨ Done. Converted {converted} tasks into ml/data/annotations/ JSON files.")


if __name__ == "__main__":
    main()