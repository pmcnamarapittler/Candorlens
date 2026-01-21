#!/usr/bin/env python3
"""
Convert Label Studio export -> CandorLens annotation JSONs + YOLO format.

Input:
  labelstudio_export.json  (exported from Label Studio)

Output:
  1. One JSON per image in: ml/data/annotations/<image_stem>.json
  2. YOLO format files in: ml/data/processed/labels/<image_stem>.txt

Supports all 49 labels (BENIGN + 48 dark patterns).
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Set, Tuple

# ---- CONFIG ----
PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXPORT_PATH = PROJECT_ROOT / "labelstudio_export.json"
LABELS_PATH = PROJECT_ROOT / "ml" / "labels.json"
ANNOTATIONS_DIR = PROJECT_ROOT / "ml" / "data" / "annotations"
YOLO_LABELS_DIR = PROJECT_ROOT / "ml" / "data" / "processed" / "labels"

ANNOTATIONS_DIR.mkdir(parents=True, exist_ok=True)
YOLO_LABELS_DIR.mkdir(parents=True, exist_ok=True)


def load_label_index() -> Dict[str, int]:
    """Load labels.json and create id -> index mapping for YOLO."""
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        labels = json.load(f)
    return {lbl["id"]: i for i, lbl in enumerate(labels)}


def extract_choices_from_task(task: dict) -> List[str]:
    """
    Extract all selected choices from a Label Studio task.
    
    Handles multiple annotation groups:
    - is_dark_pattern (BENIGN, DARK_PATTERN, UNUSABLE)
    - nagging, obstruction, sneaking, interface, forced, social, urgency, scarcity
    """
    all_choices = []
    
    for ann in task.get("annotations", []):
        for res in ann.get("result", []):
            # Get choices from any checkbox group
            if res.get("type") == "choices":
                choices = res.get("value", {}).get("choices", [])
                all_choices.extend(choices)
    
    return all_choices


def extract_bboxes_from_task(task: dict, img_width: int, img_height: int) -> List[dict]:
    """
    Extract bounding boxes from Label Studio task.
    
    Label Studio uses percentage coordinates (0-100).
    We convert to YOLO format (center_x, center_y, width, height) normalized 0-1.
    """
    bboxes = []
    
    for ann in task.get("annotations", []):
        for res in ann.get("result", []):
            if res.get("type") == "rectanglelabels":
                value = res.get("value", {})
                
                # Label Studio percentage coordinates
                x_pct = value.get("x", 0)
                y_pct = value.get("y", 0)
                w_pct = value.get("width", 0)
                h_pct = value.get("height", 0)
                labels = value.get("rectanglelabels", [])
                
                # Convert to YOLO format (normalized 0-1, center-based)
                x_center = (x_pct + w_pct / 2) / 100
                y_center = (y_pct + h_pct / 2) / 100
                width = w_pct / 100
                height = h_pct / 100
                
                bboxes.append({
                    "x_center": x_center,
                    "y_center": y_center,
                    "width": width,
                    "height": height,
                    "labels": labels
                })
    
    return bboxes


def map_choices_to_labels(choices: List[str]) -> Tuple[Set[str], bool]:
    """
    Map Label Studio choices to internal label IDs.
    
    Returns:
        - Set of label IDs (e.g., {"OBS-03", "INT-02"})
        - Boolean indicating if marked as UNUSABLE
    """
    labels = set()
    is_unusable = False
    
    for choice in choices:
        if not choice:
            continue
            
        # Handle top-level choices
        if choice == "BENIGN":
            labels.add("BENIGN")
        elif choice == "UNUSABLE":
            is_unusable = True
        elif choice == "DARK_PATTERN":
            # This is just a gate, not a label itself
            continue
        else:
            # Pattern IDs like "NAG-01", "OBS-03", etc.
            # These come directly from the category checkboxes
            labels.add(choice)
    
    return labels, is_unusable


def main():
    # Load label index for YOLO
    try:
        label_to_idx = load_label_index()
        print(f"✅ Loaded {len(label_to_idx)} labels from {LABELS_PATH}")
    except FileNotFoundError:
        print(f"❌ Labels file not found: {LABELS_PATH}")
        print("   Make sure ml/labels.json exists with the full 49-label taxonomy.")
        return
    
    # Load Label Studio export
    if not EXPORT_PATH.exists():
        print(f"❌ Export file not found: {EXPORT_PATH}")
        print(f"   Export your annotations from Label Studio and save as {EXPORT_PATH}")
        return
    
    print(f"🔍 Loading Label Studio export from: {EXPORT_PATH}")
    with open(EXPORT_PATH, "r", encoding="utf-8") as f:
        tasks = json.load(f)
    
    print(f"   Found {len(tasks)} tasks in export.\n")
    
    stats = {
        "converted": 0,
        "skipped_no_image": 0,
        "skipped_no_labels": 0,
        "skipped_unusable": 0,
        "benign": 0,
        "dark_pattern": 0,
        "with_bbox": 0,
    }
    
    for task in tasks:
        data = task.get("data", {})
        img_path = data.get("img") or data.get("image") or ""
        
        if not img_path:
            print(f"  ⚠️  Skipping task {task.get('id')}: no image field")
            stats["skipped_no_image"] += 1
            continue
        
        img_file = os.path.basename(img_path)
        img_stem = Path(img_file).stem
        
        # Extract choices
        choices = extract_choices_from_task(task)
        
        if not choices:
            print(f"  ⚠️  {img_file}: no choices selected, skipping")
            stats["skipped_no_labels"] += 1
            continue
        
        # Map to internal labels
        labels, is_unusable = map_choices_to_labels(choices)
        
        if is_unusable:
            print(f"  ⏭️  {img_file}: marked UNUSABLE, skipping")
            stats["skipped_unusable"] += 1
            continue
        
        if not labels:
            print(f"  ⚠️  {img_file}: no valid labels from {choices}, skipping")
            stats["skipped_no_labels"] += 1
            continue
        
        # Extract bounding boxes (if any)
        # Default image size - Label Studio stores percentages so actual size doesn't matter for YOLO
        bboxes = extract_bboxes_from_task(task, img_width=1280, img_height=1280)
        
        # Determine if benign or dark pattern
        is_benign = "BENIGN" in labels and len(labels) == 1
        
        if is_benign:
            stats["benign"] += 1
        else:
            stats["dark_pattern"] += 1
        
        if bboxes:
            stats["with_bbox"] += 1
        
        # --- Output 1: Annotation JSON ---
        ann_obj = {
            "image_file": img_file,
            "labels": sorted(labels),
            "is_benign": is_benign,
            "bboxes": bboxes,
            "raw_choices": choices,
            "source": "labelstudio_v2",
            "multilabel": len(labels) > 1
        }
        
        ann_path = ANNOTATIONS_DIR / f"{img_stem}.json"
        with open(ann_path, "w", encoding="utf-8") as f:
            json.dump(ann_obj, f, indent=2)
        
        # --- Output 2: YOLO format labels ---
        yolo_lines = []
        
        if bboxes:
            # If we have bounding boxes, use them
            for bbox in bboxes:
                # For YOLO, we need a single class per box
                # Use the first label for now (or could duplicate for multi-label)
                for label_id in labels:
                    if label_id in label_to_idx:
                        class_idx = label_to_idx[label_id]
                        line = f"{class_idx} {bbox['x_center']:.6f} {bbox['y_center']:.6f} {bbox['width']:.6f} {bbox['height']:.6f}"
                        yolo_lines.append(line)
                        break  # One box per bbox for now
        else:
            # No bounding boxes - use image-level classification
            # Create a full-image box (this is a simplification)
            for label_id in labels:
                if label_id in label_to_idx:
                    class_idx = label_to_idx[label_id]
                    # Full image box: center at 0.5, 0.5, size 1.0, 1.0
                    line = f"{class_idx} 0.5 0.5 1.0 1.0"
                    yolo_lines.append(line)
        
        yolo_path = YOLO_LABELS_DIR / f"{img_stem}.txt"
        with open(yolo_path, "w", encoding="utf-8") as f:
            f.write("\n".join(yolo_lines))
        
        stats["converted"] += 1
        label_str = ", ".join(sorted(labels)[:3])
        if len(labels) > 3:
            label_str += f" (+{len(labels)-3} more)"
        print(f"  ✅ {img_file}: {label_str}")
    
    # Summary
    print(f"\n{'='*50}")
    print("CONVERSION SUMMARY")
    print(f"{'='*50}")
    print(f"  ✅ Converted:        {stats['converted']}")
    print(f"     - Benign:         {stats['benign']}")
    print(f"     - Dark patterns:  {stats['dark_pattern']}")
    print(f"     - With bboxes:    {stats['with_bbox']}")
    print(f"  ⏭️  Skipped unusable: {stats['skipped_unusable']}")
    print(f"  ⚠️  Skipped no image: {stats['skipped_no_image']}")
    print(f"  ⚠️  Skipped no labels:{stats['skipped_no_labels']}")
    print(f"\n📁 Outputs:")
    print(f"   Annotations: {ANNOTATIONS_DIR}")
    print(f"   YOLO labels: {YOLO_LABELS_DIR}")


if __name__ == "__main__":
    main()
