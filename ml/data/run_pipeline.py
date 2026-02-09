#!/usr/bin/env python3
"""
CandorLens Data Pipeline Runner
Runs the complete data pipeline: validate → preprocess → analyze → split

Usage:
    python run_pipeline.py
    python run_pipeline.py --input data/annotated/events.jsonl --output-dir data/splits
"""

import argparse
from pathlib import Path
import sys

# Import pipeline modules (relative when run as package, else direct for script-from-ml/data)
try:
    from .validate_jsonl import load_and_validate_jsonl, print_validation_report
    from .preprocess import preprocess_jsonl
    from .analyze_dataset import load_events, generate_report
    from .create_splits import create_stratified_splits, print_split_summary, save_events, save_split_metadata
except ImportError:
    from validate_jsonl import load_and_validate_jsonl, print_validation_report
    from preprocess import preprocess_jsonl
    from analyze_dataset import load_events, generate_report
    from create_splits import create_stratified_splits, print_split_summary, save_events, save_split_metadata


def run_full_pipeline(
    input_file: Path,
    output_dir: Path,
    skip_validation: bool = False,
    skip_preprocessing: bool = False,
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_seed: int = 42
):
    """Run the complete data pipeline."""
    
    print("\n" + "="*70)
    print("CANDORLENS DATA PIPELINE")
    print("="*70)
    print(f"\nLOADING: Input:  {input_file}")
    print(f"DIR: Output: {output_dir}")
    print()
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Validation
    if not skip_validation:
        print("\n" + "─"*70)
        print("STEP 1: VALIDATION")
        print("─"*70)
        
        valid_events, errors = load_and_validate_jsonl(input_file, strict=False)
        print_validation_report(valid_events, errors)
        
        if errors:
            print("\nWARNING: Found validation errors. Fix these before proceeding to training.")
            response = input("\nContinue anyway? [y/N]: ").strip().lower()
            if response not in ['y', 'yes']:
                print("Pipeline aborted.")
                sys.exit(1)
        
        # Save validated events
        validated_file = output_dir / 'validated.jsonl'
        with open(validated_file, 'w') as f:
            for event in valid_events:
                f.write(event.model_dump_json() + '\n')
        print(f"SAVED: Validated events saved to: {validated_file}")
        
        working_file = validated_file
    else:
        print("\nSKIPPED: Skipping validation")
        working_file = input_file
    
    # Step 2: Preprocessing
    if not skip_preprocessing:
        print("\n" + "─"*70)
        print("STEP 2: PREPROCESSING")
        print("─"*70)
        
        preprocessed_file = output_dir / 'preprocessed.jsonl'
        preprocess_jsonl(
            input_path=working_file,
            output_path=preprocessed_file,
            preserve_case=True,
            add_normalized_field=True
        )
        
        working_file = preprocessed_file
    else:
        print("\nSKIPPED: Skipping preprocessing")
    
    # Step 3: Analysis
    print("\n" + "─"*70)
    print("STEP 3: DATASET ANALYSIS")
    print("─"*70)
    
    events = load_events(working_file)
    report = generate_report(events)
    print(report)
    
    # Save report
    report_file = output_dir / 'analysis_report.txt'
    with open(report_file, 'w') as f:
        f.write(report)
    print(f"\nSAVED: Analysis report saved to: {report_file}")
    
    # Step 4: Create splits
    print("\n" + "─"*70)
    print("STEP 4: CREATE TRAIN/VAL/TEST SPLITS")
    print("─"*70)
    
    if len(events) < 10:
        print(f"ERROR: Not enough events to split (need at least 10, got {len(events)})")
        print("   Add more annotations and re-run the pipeline.")
        sys.exit(1)
    
    train, val, test = create_stratified_splits(
        events,
        test_size=test_size,
        val_size=val_size,
        random_seed=random_seed
    )
    
    print_split_summary(train, val, test)
    
    # Save splits
    save_events(train, output_dir / 'train.jsonl')
    save_events(val, output_dir / 'val.jsonl')
    save_events(test, output_dir / 'test.jsonl')
    save_split_metadata(train, val, test, output_dir, random_seed)
    
    # Final summary
    print("\n" + "="*70)
    print("PIPELINE COMPLETE")
    print("="*70)
    print(f"\nDIR: Output directory: {output_dir}")
    print(f"\nFILE: Generated files:")
    print(f"   OK: {output_dir / 'validated.jsonl'} (validated events)")
    print(f"   OK: {output_dir / 'preprocessed.jsonl'} (cleaned text)")
    print(f"   OK: {output_dir / 'analysis_report.txt'} (quality report)")
    print(f"   OK: {output_dir / 'train.jsonl'} ({len(train)} events)")
    print(f"   OK: {output_dir / 'val.jsonl'} ({len(val)} events)")
    print(f"   OK: {output_dir / 'test.jsonl'} ({len(test)} events)")
    print(f"   OK: {output_dir / 'split_metadata.json'} (split info)")
    
    print(f"\n Next step: Train BERT classifier using train.jsonl")
    print("="*70 + "\n")


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Run complete CandorLens data pipeline")
    parser.add_argument(
        '--input',
        type=Path,
        default=Path('data/annotated/events.jsonl'),
        help='Input JSONL file (default: data/annotated/events.jsonl)'
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path('data/splits'),
        help='Output directory (default: data/splits)'
    )
    parser.add_argument(
        '--skip-validation',
        action='store_true',
        help='Skip validation step'
    )
    parser.add_argument(
        '--skip-preprocessing',
        action='store_true',
        help='Skip preprocessing step'
    )
    parser.add_argument(
        '--test-size',
        type=float,
        default=0.15,
        help='Test set fraction (default: 0.15)'
    )
    parser.add_argument(
        '--val-size',
        type=float,
        default=0.15,
        help='Validation set fraction (default: 0.15)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed (default: 42)'
    )
    
    args = parser.parse_args()
    
    run_full_pipeline(
        input_file=args.input,
        output_dir=args.output_dir,
        skip_validation=args.skip_validation,
        skip_preprocessing=args.skip_preprocessing,
        test_size=args.test_size,
        val_size=args.val_size,
        random_seed=args.seed
    )


if __name__ == "__main__":
    main()
