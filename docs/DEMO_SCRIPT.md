# CandorLens Demo Script

## Goal
Demonstrate end-to-end compliance workflow:
input -> analysis -> findings -> PDF report.

## Prep (before meeting)
1. Start backend:
   ```bash
   uvicorn backend.api.main:app --reload
   ```
2. Start frontend:
   ```bash
   cd "MVP UI"
   npm run dev
   ```
3. Confirm backend health:
   ```bash
   curl -s http://localhost:8000/
   ```

## Live Demo Steps (10-12 minutes)

### Step 1 - Explain product framing (1-2 min)
- CandorLens detects illegal language patterns:
  - Forced Continuity
  - False Urgency
  - Fear-Based Account Threats
- Findings are mapped to legal context and remediation.

### Step 2 - Run scan from UI (3-4 min)
1. Complete onboarding fields.
2. In Overview, enter a URL/text sample and click **Scan**.
3. Show that findings populate from backend responses.

### Step 3 - Review findings (2-3 min)
1. Open Findings tab.
2. Walk through severity, regulation mapping, and rationale.
3. Update one finding status to show remediation workflow intent.

### Step 4 - Generate PDF report (2 min)
1. Click **Download Report** in Overview or Report tab.
2. Open generated PDF and point out:
   - Executive summary
   - Findings list
   - Regulation/remediation details

### Step 5 - Technical credibility close (1 min)
- Mention tests and CI coverage.
- Mention deployment runbook and Azure workflow automation.

## Backup API-only demo (if frontend fails)
```bash
curl -s -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text":"Start your free trial now"}'

curl -s -X POST http://localhost:8000/generate-report \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com","company_name":"Example Inc","findings":[{"id":"evt_001","title":"Forced Continuity Language","severity":"HIGH","regulation":"ROSCA","confidence":0.9}]}' \
  --output candorlens_demo_report.pdf
```

