# CandorLens

**Flow-aware social engineering detection for digital experiences.**

CandorLens identifies manipulative language in multi-step user flows and flags risk before irreversible commitment occurs.

## Attack Classes (MVP)

| Class | Description |
|-------|-------------|
| `forced_continuity` | Language obscuring recurring charges or auto-conversion |
| `false_urgency` | Artificial time pressure without legitimate basis |
| `fear_based_threat` | Implied suspension or security failure to coerce action |

## Quick Start
```bash
# Install
pip install playwright
playwright install chromium

# Capture a flow
python scripts/flow_collector.py --interactive
```

## Project Structure
```
candorlens/
├── backend/          # FastAPI application (students build)
├── ml/data/          # Flows and annotations
├── scripts/          # Data collection tools
├── taxonomy/         # Attack classes and schemas
└── docs/             # Documentation
```

## Privacy

CandorLens is privacy-respecting by design:
- Zero retention of page content
- No content logging
- PII scrubbing before processing
- Stateless API (no user tracking)
