# OpenAI Credits & Terms of Service Compliance

## Overview

This document explains how the VideoRemix VIP credit system interacts with OpenAI's Terms of Service (ToS) and what we do and do not do with respect to OpenAI's policies.

**IMPORTANT:** This is not legal advice. Consult qualified legal counsel before launch and when ToS changes occur.

---

## What We Do NOT Do (Critical)

| Activity | Why This Violates ToS | Our Status |
|----------|----------------------|------------|
| Resell OpenAI API credits/tokens directly | OpenAI ToS prohibits transfer or resale of API access | NEVER DO THIS |
| Allow users to bring their own key (BYOK) and then resell usage | Creates a resale and liability chain | OUT OF SCOPE |
| Act as a pass-through for OpenAI credits without platform value | No platform layer of service | NOT APPLICABLE |
| Offer "OpenAI credits" as a purchasable product | Implies transfer of OpenAI rights | FORBIDDEN |
| Use OpenAI API for prohibited use cases (e.g., regulated finance advice, medical diagnosis) | OpenAI acceptable use policy restrictions | GOVERNED BY AUP |

---

## What We DO (Compliant Model)

The credit system is a **platform usage billing system**, not an OpenAI credit resale system.

### Compliant Characteristics

1. **Platform-Led Architecture**
   - Platform holds the single OpenAI API key
   - Users never interact with OpenAI directly
   - OpenAI charges go to platform payment methods

2. **Pay-Per-Use Platform Credits**
   - Users purchase platform usage credits
   - Credits are consumed when platform uses OpenAI on user's behalf
   - OpenAI costs are borne by platform

3. **Value-Added Service Layer**
   - Platform provides application layer
   - Platform handles security, rate limiting, cost control
   - Platform manages error handling and retries
   - Platform provides UI/UX

4. **Unit of Measurement**
   - Billing unit: **"AI token"** or **"platform usage"**
   - NOT: "OpenAI credit"
   - NOT: "API call"

### Model Mapping

```
User completes AI task
    → Platform receives request
    → Platform consumes platform credits
    → Platform proxies to OpenAI API (single key)
    → OpenAI returns response
    → Platform returns result to user
    → Platform records usage and deducts credits
```

---

## Required UI Language

### DO Use

| Term | Context |
|------|---------|
| "AI tokens" | Usage credits |
| "Pay per AI token" | Pricing explanation |
| "Platform usage credits" | Credit system |
| "Credits" | Generic reference |
| "Premium AI usage" | Billing explanation |
| "Usage-based billing" | Pricing model |

### DO NOT Use

| Term | Context |
|------|---------|
| "OpenAI credits" | Forbidden |
| "Buy OpenAI usage" | Forbidden |
| "GPT tokens" | Borderline |
| "API calls" | Borderline |
| "Reselling OpenAI" | Forbidden |
| "Credit resale" | Forbidden |

### OpenAImple Credit Purchase Page

```tsx
// RECOMMENDED
<h2>AI Token Packages</h2>
<p>Pay only for the AI tokens you use.</p>

// FORBIDDEN
<h2>OpenAI Credits</h2>
<p>Buy OpenAI API credits.</p>
```

---

## OpenAI Partnership Considerations

### If You Seek an OpenAI Partnership

| Path | Notes |
|------|-------|
| OpenAI Startup Fund | Consider if company is pre-revenue or early |
| OpenAI ChatGPT Plugin | Applies if apps integrate with ChatGPT directly |
| OpenAI Enterprise | For corporate accounts with high volume |
| OpenAI Cloud Provider | If building on Azure/AWS/GCP with OpenAI models |

### Commercial Account

- Register for an OpenAI commercial account
- Accept commercial terms
- Platform is the account holder, not end users
- Ensure usage stays within commercial volume limits

### Reviewable Architecture

- Architecture should be explainable to OpenAI partnership team
- Resale risk should be clearly addressable
- Platform layer of service should be demonstrable

---

## Acceptable Use Policy (AUP) Compliance

### Prohibited Use Cases (OpenAI AUP)

- Generating CSAM or exploitative content
- Disinformation campaigns
- Political manipulation
- Malware or exploits
- Fraudulent financial advice
- Medical advice without qualified professional involvement
- Legal advice without qualified professional involvement
- Weapons or dangerous weapons

### Enforcement

1. **Pre-System Checks**
   - Rate limit per user to prevent abuse
   - Content filters on input/output
   - User verification for high-risk features

2. **Post-System Audits**
   - Log all requests for AUP compliance
   - Human review of flagged content
   - Suspension of AUP-violating accounts

3. **App-Specific Restrictions**
   - Legal/finance apps display disclaimers
   - Medical apps have qualified professional checks
   - Research apps have disclaimers

---

## Monitoring OpenAI Terms

### ToS Change Detection

| Source | Check Cadence | Action |
|--------|--------------|--------|
| OpenAI Terms of Service page | Monthly | Update this document |
| OpenAI Developer Policy | Monthly | Update this document |
| OpenAI Acceptable Use Policy | Monthly | Review apps |
| OpenAI Partnership communications | Ongoing | Escalate to legal |

### Change Response Process

1. OpenAI announces ToS/AUP change
2. Legal team reviews change
3. Engineering assesses technical impact
4. Product assesses user impact
5. Legal approves revised architecture
6. Engineering implements required changes
7. Support prepares user communications
8. Platform updated within 30 days

---

## Legal Review Recommendations

| Review Item | Cadence | Owner |
|-------------|---------|-------|
| ToS compliance architecture | Annually | Legal |
| AUP enforcement effectiveness | Quarterly | Legal + Engineering |
| Platform value justification | Annually | Legal |
| Partnership eligibility | Ongoing | Business Development |
| Resale risk assessment | Annually | Legal |
| Commercial account terms | As needed | Finance + Legal |

### Required Legal Documentation

- [ ] Attorney-client privileged architecture memo
- [ ] Platform value analysis memo
- [ ] Terms of Service review memo
- [ ] Acceptable Use Policy enforcement memo

---

## Summary

| Principle | Implementation |
|-----------|----------------|
| Platform holds API key | Single key, platform account |
| Users never contact OpenAI | Proxy architecture |
| Platform pays OpenAI costs | Platform invoices |
| Unit of sale is platform credits | "AI tokens" |
| Platform provides value layer | Application + security + UX |
| No OpenAI credit resale | Forbidden |

**Open Questions:** See [docs/credit-system-open-questions.md](credit-system-open-questions.md)

**In Scope:** See [docs/credit-system-not-doing.md](credit-system-not-doing.md)
