# CandorLens Illegal Pattern Taxonomy v2.0

## Overview

CandorLens detects **illegal patterns** - dark patterns that violate specific federal regulations. Unlike generic dark pattern detection (bad UX), we focus on patterns that create **quantifiable legal risk** with dollar-value exposure.

## The Three Illegal Pattern Classes

### 1. FCL - Forced Continuity Language
**Regulatory Basis:** ROSCA (Restore Online Shoppers' Confidence Act), 16 CFR 425

**Definition:** Language that obscures, omits, or misrepresents automatic renewal terms, billing frequency, or cancellation procedures.

**Detection Signals:**
- Vague renewal terms ("subscription continues")
- Hidden billing frequency
- Unclear cancellation procedures
- "Until you cancel" without clear instructions
- Automatic upgrade language without consent

**Example Violations:**
- "Your subscription will automatically renew" (without clear price/date)
- "Cancel anytime" (without explaining how)
- Fine print billing terms contradicting header claims

**Legal Exposure:** $50,000+ per violation (FTC Act Section 5)

---

### 2. FU - False Urgency
**Regulatory Basis:** FTC Act Section 5 (Unfair or Deceptive Acts), state consumer protection laws

**Definition:** Fabricated time pressure, fake scarcity claims, or manufactured countdown timers not tied to genuine inventory or deadline constraints.

**Detection Signals:**
- Countdown timers that reset on page refresh
- "Only X left!" claims without inventory verification
- "Sale ends soon!" without specific end date
- "Limited time offer" on perpetual promotions
- Fake "live" viewer/buyer counts

**Example Violations:**
- Timer showing "2:34:56 remaining" that resets to same time
- "Only 3 left in stock!" for digital products
- "47 people viewing this right now" (fabricated)

**Legal Exposure:** $10,000-$50,000 per violation, class action exposure

---

### 3. FAT - Fear-Based Account Threats
**Regulatory Basis:** FTC Act Section 5, CCPA (California Consumer Privacy Act), state unfair practices laws

**Definition:** Language designed to frighten users into maintaining subscriptions or avoiding cancellation through threats of data loss, service degradation, or irreversible consequences.

**Detection Signals:**
- "You will lose all your data"
- "Your account will be permanently deleted"
- "You won't be able to recover your [content/history/progress]"
- Threatening language during cancellation flows
- Exaggerated consequences of account changes

**Example Violations:**
- "Cancel now and lose 3 years of purchase history forever"
- "Your saved preferences will be permanently erased"
- "You'll lose access to exclusive member benefits you've earned"

**Legal Exposure:** $2,500-$7,500 per violation under CCPA, higher under FTC

---

## Pattern Severity Levels

| Level | Description | Typical Fine Range |
|-------|-------------|-------------------|
| **Critical** | Clear ROSCA/FTC violation, active harm | $50,000+ per instance |
| **High** | Likely violation, requires immediate remediation | $10,000-$50,000 |
| **Medium** | Potential violation, context-dependent | $5,000-$10,000 |
| **Low** | Borderline practice, recommended fix | Warning/guidance |

---

## What We Don't Detect (Out of Scope)

These are "dark patterns" but not necessarily **illegal**:
- Confirm-shaming ("No thanks, I don't want to save money")
- Visual hierarchy manipulation
- Pre-selected checkboxes (legal in most contexts)
- Difficult navigation (annoying but not illegal)
- Guilt-tripping language (unless tied to cancellation threats)

We focus on patterns with **clear regulatory mapping** and **enforcement precedent**.

---

## Annotation Guidelines

When annotating screenshots for training:

1. **Identify the pattern class** (FCL, FU, or FAT)
2. **Extract the exact text** that constitutes the violation
3. **Note the UI context** (modal, checkout, cancellation flow, etc.)
4. **Rate severity** based on clarity of violation
5. **Document regulatory citation** (which law it violates)

See `annotation_schema.json` for the structured format.
