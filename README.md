# CandorLens

**Regulatory Compliance Scanner for Digital Interfaces**

CandorLens detects **illegal language patterns** in websites — not just dark patterns, but text that violates federal consumer protection laws. Companies submit URLs, and CandorLens analyzes user flows, maps findings to FTC/ROSCA/CCPA violations, and generates compliance reports.

> 🔒 **Patent Status:** Provisional patent filed covering detection methodology and regulatory mapping framework.

---

## The Problem

Existing tools detect *dark patterns* (manipulative UI). CandorLens detects *illegal patterns* — language that exposes companies to regulatory enforcement.

| Dark Pattern (Annoying) | Illegal Pattern (Actionable) |
|-------------------------|------------------------------|
| Confirmshaming ("No thanks, I hate saving money") | Hiding that a free trial auto-converts to $99/month |
| Fake urgency countdown that resets | "Your account will be suspended" to coerce payment |
| Pre-checked newsletter signup | Failing to disclose recurring charges before purchase |

**The FTC has issued over $500M in fines for deceptive practices since 2021.** CandorLens helps companies find violations before regulators do.

---

## The 3 Illegal Pattern Classes

CandorLens detects three high-harm pattern classes, each tied to specific regulations:

### 1. Forced Continuity Language (FCL)
**Regulation:** ROSCA (Restore Online Shoppers' Confidence Act)

Language that obscures, buries, or fails to clearly disclose recurring charges, auto-renewal terms, or subscription conversions.

**Example violations:**
- "Start your free trial" (without mentioning auto-conversion)
- "Just $1 for first month" (without showing recurring rate)
- Subscription terms buried in fine print

**Enforcement precedent:** FTC v. ABCmouse ($10M), FTC v. Amazon Prime (ongoing)

---

### 2. False Urgency (FU)
**Regulation:** FTC Act Section 5 (unfair or deceptive practices)

Language creating artificial time pressure for offers, deals, or actions that have no legitimate deadline.

**Example violations:**
- "Offer expires in 10:00" (timer resets on refresh)
- "Only 2 left at this price!" (perpetually restocked)
- "Limited time offer" (always available)

**Enforcement precedent:** FTC warnings to travel booking sites, EU DSA enforcement actions

---

### 3. Fear-Based Account Threats (FAT)
**Regulation:** FTC Act Section 5 (unfair practices)

Language implying account suspension, security compromise, or service loss to coerce immediate action.

**Example violations:**
- "Your account will be suspended"
- "Verify now or lose access"
- "Security alert: Update payment immediately"

**Enforcement precedent:** FTC v. Publishers Clearing House ($18.5M)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER SUBMITS URL                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  FLOW CAPTURE (Playwright)                   │
│         Crawl checkout, signup, cancellation flows          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   TEXT EXTRACTION                            │
│              Pull visible language from each step            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  BERT CLASSIFIER                             │
│        Detect FCL, FU, FAT patterns (≥70% precision)        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   LEGAL MAPPER                               │
│      Pattern → Regulation → Citation → Remediation          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  REPORT GENERATOR                            │
│     PDF: Executive summary, findings, legal citations        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| NLP Classifier | BERT (HuggingFace Transformers) |
| Backend API | FastAPI (Python) |
| Demo Dashboard | React + TypeScript |
| Cloud Hosting | Azure Container Apps |
| Training Data | JSONL (LanguageEvent schema) |
| Report Generation | ReportLab / WeasyPrint |

---

## Repository Structure

```
candorlens/
├── README.md                    # This file
├── taxonomy/
│   ├── attack_classes.md        # Definition of FCL, FU, FAT
│   ├── legal_mapping.json       # Class → regulation → citation
│   └── language_event_schema.json  # Training data format
├── ml/
│   ├── training/                # BERT fine-tuning scripts
│   ├── models/                  # Saved model checkpoints
│   └── evaluation/              # Test scripts and metrics
├── backend/
│   ├── api/                     # FastAPI routes
│   ├── services/                # Legal mapper, report generator
│   └── models/                  # Pydantic schemas
├── MVP UI/                      # React frontend (current MVP dashboard)
├── data/
│   ├── raw/                     # Raw collected flows
│   ├── annotated/               # Labeled JSONL files
│   └── splits/                  # Train/val/test splits
├── docs/
│   ├── ONBOARDING.md            # Getting started guide
│   └── API.md                   # API documentation
└── scripts/                     # Utility scripts
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Azure account (for deployment)

### Setup

```bash
# Clone the repo
git clone https://github.com/pmcnamarapittler/candorlens.git
cd candorlens

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Fill in your API keys
```

### Run Locally

```bash
# Start the API
cd backend
uvicorn api.main:app --reload

# In another terminal, start the dashboard
cd "MVP UI"
npm install
npm run dev
```

---

## For Capstone Students

See [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for the complete getting-started guide.

### Key files to read first:
1. **`taxonomy/attack_classes.md`** — Understand the 3 classes you're detecting
2. **`taxonomy/legal_mapping.json`** — See how classes map to regulations
3. **`taxonomy/language_event_schema.json`** — Training data (LanguageEvent) format

### Deliverables by milestone:
| Date | Milestone | Deliverable |
|------|-----------|-------------|
| Feb 8 | D2 | Data pipeline working, JSONL loader validated, 50+ events ingested |
| Feb 22 | D3 | Classifier v1 trained, ≥60% precision |
| Mar 8 | D4 | FastAPI deployed to Azure, end-to-end working |
| Apr 5 | D5 | Full pipeline with PDF reports, ≥70% precision |
| Apr 19 | D6 | Feature complete, dashboard polished |
| May 3 | D7 | Final handoff, video demo, documentation |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze-text` | POST | Analyze raw text for illegal patterns |
| `/analyze-flow` | POST | Analyze a multi-step user flow |
| `/generate-report` | POST | Generate PDF compliance report |
| `/report` | POST/GET | Save/retrieve JSON report payload by URL |
| `/` | GET | Health check |

See [`docs/API.md`](docs/API.md) for full documentation.
Deployment runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

CI workflows:
- `.github/workflows/backend-ci.yml`
- `.github/workflows/frontend-ci.yml`
- `.github/workflows/deploy-azure.yml`

Handoff docs:
- `docs/MILESTONE_EVIDENCE.md`
- `docs/HANDOFF_CHECKLIST.md`
- `docs/DEMO_SCRIPT.md`

---

## Contact

**Stakeholder:** Paige McNamara-Pittler  
**Email:** pemcnama@usc.edu  


---

## License

Proprietary. All rights reserved.

---

*CandorLens: Scanning for illegal patterns before regulators do.*
