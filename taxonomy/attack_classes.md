# CandorLens Attack Classes

## Overview

CandorLens detects three high-harm social engineering patterns in digital flows.
These classes are **locked for MVP** — do not add new classes.

---

## 1. forced_continuity

**Definition:** Language that obscures recurring charges or auto-conversion to paid status.

**Indicators:**
- "Free trial" with credit card required
- "$0 today" with buried subscription terms
- "Cancel anytime" minimizing commitment
- Early termination fees hidden in flow

**Risk Outcome:** `recurring_charge`, `early_termination_fee`

**Jurisdiction:** FTC_Act_Section_5, ROSCA

---

## 2. false_urgency

**Definition:** Artificial time pressure without legitimate basis.

**Indicators:**
- Countdown timers (especially if they reset)
- "Offer expires in X hours" without real deadline
- "Only X left" for unlimited digital goods
- "Act now" / "Limited time" for always-available items

**Risk Outcome:** `pressure_decision`

**Jurisdiction:** FTC_Act_Section_5

---

## 3. fear_based_threat

**Definition:** Language implying imminent suspension, loss, or security failure to coerce action.

**Indicators:**
- "Your account will be suspended"
- "Verify immediately or lose access"
- "Security alert" without specific threat
- "Unusual activity detected" (vague)

**Risk Outcome:** `credential_disclosure`, `panic_action`

**Jurisdiction:** FTC_Act_Section_5
