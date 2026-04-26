#!/usr/bin/env python3
"""
CandorLens Flow Collector
Captures multi-step user flows for social engineering detection.

Usage:
    python flow_collector.py --interactive
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright not installed. Run:")
    print("   pip install playwright")
    print("   playwright install chromium")
    sys.exit(1)


OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
VIEWPORT = {"width": 1420, "height": 900}


class FlowCollector:
    def __init__(self, output_dir: Path = OUTPUT_DIR):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def _create_flow_folder(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        flow_id = f"flow_{timestamp}"
        flow_dir = self.output_dir / flow_id
        flow_dir.mkdir(parents=True, exist_ok=True)
        return flow_dir, flow_id
    
    def _extract_text(self, page):
        try:
            return page.evaluate("() => document.body.innerText")
        except Exception:
            return ""

    def _extract_cta_labels(self, page):
        try:
            return page.evaluate("""() => {
                const els = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
                return Array.from(els).map(el => el.innerText || el.value || '').filter(t => t.trim()).slice(0, 20);
            }""")
        except Exception:
            return []
    
    def interactive_capture(self):
        print("\n" + "="*60)
        print("FLOW CAPTURE MODE")
        print("="*60)
        print("Navigate in the browser window.")
        print("Press ENTER in terminal to capture each step.")
        print("Type 'done' when flow is complete.")
        print("Type 'cancel' to abort.")
        print("="*60 + "\n")
        
        flow_dir, flow_id = self._create_flow_folder()
        steps = []
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(viewport=VIEWPORT)
            page = context.new_page()
            
            page.goto("about:blank")
            print("Navigate to starting URL in the browser...\n")
            
            step_index = 0
            
            while True:
                cmd = input(f"ENTER to capture step {step_index} (or 'done'/'cancel'): ").strip().lower()
                
                if cmd == 'cancel':
                    print("Cancelled.")
                    import shutil
                    shutil.rmtree(flow_dir)
                    browser.close()
                    return None
                
                if cmd == 'done':
                    break
                
                current_url = page.url
                if current_url == "about:blank":
                    print("   Navigate somewhere first.")
                    continue
                
                screenshot_file = f"step_{step_index:02d}.png"
                page.screenshot(path=str(flow_dir / screenshot_file))
                
                step_data = {
                    "step_index": step_index,
                    "screenshot_file": screenshot_file,
                    "url": current_url,
                    "page_title": page.title(),
                    "extracted_text": self._extract_text(page)[:5000],
                    "cta_labels": self._extract_cta_labels(page)
                }
                steps.append(step_data)
                
                print(f"   Captured step {step_index}: {page.title()[:50]}")
                step_index += 1
            
            browser.close()
        
        if not steps:
            print("No steps captured.")
            import shutil
            shutil.rmtree(flow_dir)
            return None
        
        metadata = {
            "flow_id": flow_id,
            "url": steps[0]["url"],
            "captured_at": datetime.now().isoformat(),
            "num_steps": len(steps),
            "steps": steps
        }
        
        with open(flow_dir / "flow_metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\nFlow saved: {flow_dir}")
        print(f"   Steps: {len(steps)}")
        print(f"   Annotate via: python scripts/annotate.py --output data/annotated/events.jsonl")
        
        return flow_dir


def main():
    parser = argparse.ArgumentParser(description="CandorLens Flow Collector")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    parser.add_argument("--output", "-o", default=str(Path(__file__).resolve().parent.parent / "data" / "raw"), help="Output directory for flows (default: data/raw)")
    args = parser.parse_args()
    
    collector = FlowCollector(output_dir=Path(args.output))
    
    if args.interactive:
        collector.interactive_capture()
    else:
        print("Use: python flow_collector.py --interactive")


if __name__ == "__main__":
    main()
