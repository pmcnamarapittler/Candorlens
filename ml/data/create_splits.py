#!/usr/bin/env python3
"""
CandorLens Dataset Splitter
Create stratified train/validation/test splits.

Usage:
    python create_splits.py <input.jsonl>
    python create_splits.py data/annotated/events.jsonl --output-dir data/splits
"""

import json
import argparse
from pathlib import Path
from typing import List, Tuple
from sklearn.model_selection import train_test_split
from collections import Counter


# --- Split Functions ---

def load_events(filepath: Path) -> List[dict]:
    """Load events from JSONL file."""
    events = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return events


def save_events(events: List[dict], filepath: Path):
    """Save events to JSONL file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        for event in events:
            f.write(json.dumps(event, ensure_ascii=False) + '\n')


def create_stratified_splits(
    events: List[dict],
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_seed: int = 42
) -> Tuple[List[dict], List[dict], List[dict]]:
    """
    Create stratified train/validation/test splits.
    
    Args:
        events: List of event dictionaries
        test_size: Fraction for test set (default: 0.15)
        val_size: Fraction for validation set (default: 0.15)
        random_seed: Random seed for reproducibility
    
    Returns:
        Tuple of (train_events, val_events, test_events)
    """
    if len(events) < 10:
        raise ValueError(f"Not enough events to split (need at least 10, got {len(events)})")
    
    # Extract labels for stratification
    labels = [e['attack_class'] for e in events]
    
    # Check if we have enough samples per class for stratification
    # train_test_split(..., stratify=...) requires at least 2 samples per class
    label_counts = Counter(labels)
    min_class_count = min(label_counts.values())
    use_stratify = min_class_count >= 2

    if min_class_count < 2:
        print(f"WARNING: Some classes have very few samples (min={min_class_count})")
        print(f"   Stratification requires at least 2 per class. Using unstratified splits.")
    elif min_class_count < 3:
        print(f"WARNING: Some classes have very few samples (min={min_class_count})")
        print(f"   Consider adding more data for better stratification.")

    # First split: separate test set
    train_val_events, test_events, train_val_labels, test_labels = train_test_split(
        events,
        labels,
        test_size=test_size,
        stratify=labels if use_stratify else None,
        random_state=random_seed
    )

    # Second split: separate validation from training
    val_size_adjusted = val_size / (1 - test_size)
    train_events, val_events, train_labels, val_labels = train_test_split(
        train_val_events,
        train_val_labels,
        test_size=val_size_adjusted,
        stratify=train_val_labels if use_stratify else None,
        random_state=random_seed
    )
    
    return train_events, val_events, test_events


def print_split_summary(train: List[dict], val: List[dict], test: List[dict]):
    """Print summary of the splits."""
    total = len(train) + len(val) + len(test)
    
    print("\n" + "="*70)
    print("DATASET SPLIT SUMMARY")
    print("="*70)
    print(f"\nTotal events: {total}")
    print(f"  Training:   {len(train):3d} events ({len(train)/total*100:.1f}%)")
    print(f"  Validation: {len(val):3d} events ({len(val)/total*100:.1f}%)")
    print(f"  Test:       {len(test):3d} events ({len(test)/total*100:.1f}%)")
    
    # Check class distribution in each split
    print("\n" + "─"*70)
    print("CLASS DISTRIBUTION PER SPLIT")
    print("─"*70)
    
    for split_name, split_data in [("Train", train), ("Val", val), ("Test", test)]:
        class_counts = Counter(e['attack_class'] for e in split_data)
        print(f"\n{split_name}:")
        for cls in sorted(class_counts.keys()):
            count = class_counts[cls]
            pct = (count / len(split_data)) * 100
            print(f"  {cls:25s} {count:3d} ({pct:5.1f}%)")
    
    print("\n" + "="*70)


def save_split_metadata(
    train: List[dict],
    val: List[dict],
    test: List[dict],
    output_dir: Path,
    random_seed: int
):
    """Save metadata about the split."""
    metadata = {
        'random_seed': random_seed,
        'total_events': len(train) + len(val) + len(test),
        'splits': {
            'train': {
                'count': len(train),
                'event_ids': [e['event_id'] for e in train],
                'class_distribution': dict(Counter(e['attack_class'] for e in train))
            },
            'val': {
                'count': len(val),
                'event_ids': [e['event_id'] for e in val],
                'class_distribution': dict(Counter(e['attack_class'] for e in val))
            },
            'test': {
                'count': len(test),
                'event_ids': [e['event_id'] for e in test],
                'class_distribution': dict(Counter(e['attack_class'] for e in test))
            }
        }
    }
    
    metadata_path = output_dir / 'split_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\nSAVED: Metadata saved to: {metadata_path}")


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Create train/val/test splits")
    parser.add_argument(
        'input_file',
        type=Path,
        help='Input JSONL file with all events'
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path('data/splits'),
        help='Output directory for splits (default: data/splits)'
    )
    parser.add_argument(
        '--test-size',
        type=float,
        default=0.15,
        help='Test set size (default: 0.15)'
    )
    parser.add_argument(
        '--val-size',
        type=float,
        default=0.15,
        help='Validation set size (default: 0.15)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )
    
    args = parser.parse_args()
    
    # Load events
    print(f"LOADING: Loading events from: {args.input_file}")
    events = load_events(args.input_file)
    
    if not events:
        print("ERROR: No events found in input file")
        exit(1)
    
    print(f"OK: Loaded {len(events)} events")
    
    # Create splits
    print(f"\nPROCESSING: Creating splits (seed={args.seed})...")
    train, val, test = create_stratified_splits(
        events,
        test_size=args.test_size,
        val_size=args.val_size,
        random_seed=args.seed
    )
    
    # Print summary
    print_split_summary(train, val, test)
    
    # Save splits
    print(f"\nSAVED: Saving splits to: {args.output_dir}")
    save_events(train, args.output_dir / 'train.jsonl')
    save_events(val, args.output_dir / 'val.jsonl')
    save_events(test, args.output_dir / 'test.jsonl')
    
    # Save metadata
    save_split_metadata(train, val, test, args.output_dir, args.seed)
    
    print("\nSUCCESS: Split creation complete!")
    print(f"\nDIR: Output files:")
    print(f"   {args.output_dir / 'train.jsonl'}")
    print(f"   {args.output_dir / 'val.jsonl'}")
    print(f"   {args.output_dir / 'test.jsonl'}")
    print(f"   {args.output_dir / 'split_metadata.json'}")


if __name__ == "__main__":
    main()
