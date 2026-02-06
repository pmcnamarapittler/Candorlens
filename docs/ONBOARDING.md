# Onboarding

Getting started with CandorLens development.

---

## D2: Data pipeline, JSONL loader, 50+ events

### 1. Data pipeline (flow capture → annotation → JSONL)

**Capture flows (Playwright)**

- From repo root:
  ```bash
  pip install playwright
  playwright install chromium
  python scripts/flow_collector.py --interactive
  ```
- Flows are saved under `data/raw/<flow_id>/` (screenshots + `flow_metadata.json`).
- Use `--output <dir>` to override the output directory.

**Annotate events**

- Add LanguageEvent records to the annotated JSONL:
  ```bash
  python scripts/annotate.py --output data/annotated/events.jsonl
  ```
- Interactive prompts walk you through required fields (attack_class, confidence, coercion_vector, etc.).
- Schema: `taxonomy/language_event_schema.json`.

**JSONL loader**

- Load and validate events from the annotated file:
  ```bash
  python scripts/load_events.py [path]           # default: data/annotated/events.jsonl
  python scripts/load_events.py --validate-only  # exit 1 if any line invalid
  ```
- In code:
  ```python
  from scripts.load_events import load_events
  events = load_events("data/annotated/events.jsonl")
  ```
- Invalid lines are skipped (and reported on stderr) when `validate=True`.

### 2. Event count (50+)

- `data/annotated/events.jsonl` contains **51** events (manual_label + ftc_complaint–sourced).
- To add more: run `python scripts/annotate.py` or append valid JSONL lines to `data/annotated/events.jsonl`.

### 3. Key files

| File | Purpose |
|------|--------|
| `taxonomy/attack_classes.md` | Definitions of FCL, FU, FAT |
| `taxonomy/legal_mapping.json` | Class → regulation → citation |
| `taxonomy/language_event_schema.json` | Training data (LanguageEvent) schema |
| `data/raw/` | Raw captured flows (screenshots + metadata) |
| `data/annotated/events.jsonl` | Labeled events for training |
| `scripts/flow_collector.py` | Capture flows interactively |
| `scripts/annotate.py` | Create events interactively |
| `scripts/load_events.py` | Load and validate JSONL events |
