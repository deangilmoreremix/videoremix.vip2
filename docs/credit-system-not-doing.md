# Credit System — Not Doing

## Purpose

This document defines the explicit boundaries of the credit system. Items listed here are out of scope, even if they seem related or are commonly requested.

---

## What We Are Explicitly Not Doing

| # | Item | Why Out of Scope |
|---|------|-----------------|
| 1 | OpenAI credit resale | Violates OpenAI ToS. Not a credit reseller. |
| 2 | User BYOK (bring your own key) | Creates resale risk and ToS violation. |
| 3 | Proxy for third-party APIs (other than OpenAI) | Not in Phase 1. Platform-led architecture. |
| 4 | Multiple providers in Phase 1 | Complexity. Prove concept first. |
| 5 | Enterprise self-hosted deployment | Phase 2+ only. |
| 6 | Subscription-only model | Pay-per-use in Phase 1. |
| 7 | Credit resale marketplace | Legal liability. Forbidden. |
| 8 | Shared credit pools (team credits) | Phase 2+ only. |
| 9 | Credit lending or credit accounts | Legal complexity. Forbidden. |
| 10 | Advanced fraud prevention (AI-powered) | Platform-level fraud prevention is sufficient in Phase 1. |
| 11 | Credit gifting | Phase 2+ only. |
| 12 | Credit transfer | Forbidden. |
| 13 | Credit refunding after expiration | No expiration in Phase 1. |
| 14 | Credit pausing or freezing | Phase 2+ only. |
| 15 | Credit inheritance (user passes credits to next of kin) | Forbidden. |
| 16 | Credit use for non-AI purposes | AI token only. |
| 17 | Credit use for physical products or services | AI token only. |
| 18 | Credit use for partner services | Phase 2+ only. |
| 19 | Credit use for third-party API calls | Phase 2+ only. |
| 20 | Credit use for training models | Not allowed. Forbidden. |
| 21 | Credit use for fine-tuning | Not allowed. Forbidden. |
| 22 | Credit use for embedding generation at scale | Allowed in Phase 1, with limits. |
| 23 | Credit use for Whisper transcription | Allowed in Phase 1, with limits. |
| 24 | Credit use for DALL-E image generation | Allowed in Phase 1, with limits. |
| 25 | Credit use for embeddings generation | Allowed in Phase 1, with limits. |

---

## Detailed Item Explanations

### 1. OpenAI Credit Resale

**What it looks like:** Platform accepts payment and transfers OpenAI credits to user.

**Why we don't do it:** Violates OpenAI ToS Section 2.3 (Transfer).

**What we do instead:** Platform uses OpenAI credits and charges users platform usage credits.

**Decision:** Never. This is the cardinal sin of our architecture.

---

### 2. User BYOK (Bring Your Own Key)

**What it looks like:** User enters their own OpenAI API key in our platform.

**Why we don't do it:** Creates resale liability and confusion about billing.

**What we do instead:** Platform holds the key. Users pay platform for platform credits.

**When we might reconsider:** Enterprise BYOK with separate ToS review. Never alongside platform credits.

**Decision:** No BYOK in Phase 1. Enterprise BYOK in Phase 2 with legal review.

---

### 3. Proxy for Third-Party APIs (Phase 1)

**What it looks like:** Platform proxies to OpenAI, Google, OpenAI, etc.

**Why we don't do it in Phase 1:** Complexity, cost, support burden.

**What we do instead:** OpenAI only in Phase 1.

**When we might reconsider:** Phase 2 after credit system is proven.

**Decision:** Phase 1: OpenAI only. Phase 2: OpenAI + Google if demand warrants.

---

### 4. Multiple Providers in Phase 1

**What it looks like:** User can choose between OpenAI, OpenAI, and Google models.

**Why we don't do it in Phase 1:** Complexity. Provenance of cost becomes harder.

**What we do instead:** OpenAI only. Single provider cost structure is simpler.

**When we might reconsider:** Phase 2.

**Decision:** Phase 1: OpenAI only.

---

### 5. Enterprise Self-Hosted Deployment

**What it looks like:** Customer deploys credit system on their own infrastructure.

**Why we don't do it in Phase 1:** Infrastructure complexity, support burden, security risk.

**What we do instead:** Platform-hosted credit system.

**When we might reconsider:** Phase 3 if enterprise demand justifies.

**Decision:** Phase 1: Platform-hosted. Phase 2+: Consider self-hosted for enterprise.

---

### 6. Subscription-Only Model

**What it looks like:** Users pay fixed monthly fee for unlimited AI usage.

**Why we don't do it in Phase 1:** No credit consumption model. Financial risk.

**What we do instead:** Pay-per-use. Users only pay for tokens consumed.

**When we might reconsider:** Phase 2 for power users.

**Decision:** Phase 1: Pay-per-use.

---

### 7. Credit Resale Marketplace

**What it looks like:** Users sell unused credits to other users.

**Why we don't do it:** Legal liability, ToS risk, accounting nightmare.

**What we do instead:** Non-transferable credits.

**Decision:** Never. Forbidden.

---

### 8. Shared Credit Pools (Team Credits)

**What it looks like:** Team shares a credit pool. Members consume from team pool.

**Why we don't do it in Phase 1:** Complexity in allocation and billing.

**What we do instead:** Individual credits in Phase 1.

**When we might reconsider:** Phase 2.

**Decision:** Phase 1: Individual credits. Phase 2: Team credits.

---

### 9. Credit Lending or Credit Accounts

**What it looks like:** Users borrow credits against future revenue. Platform extends credit.

**Why we don't do it:** Legal complexity, financial liability, regulatory risk.

**What we do instead:** Pre-paid credits only.

**Decision:** Never. Forbidden.

---

### 10. Advanced Fraud Prevention (AI-Powered)

**What it looks like:** AI system detects fraud in credit consumption.

**Why we don't do it in Phase 1:** Platform-level fraud prevention is sufficient.

**What we do instead:** Rule-based fraud prevention.

**When we might reconsider:** Phase 2 if fraud becomes significant.

**Decision:** Phase 1: Rule-based. Phase 2: Consider AI-powered.

---

### 11. Credit Gifting

**What it looks like:** User gives credits to another user.

**Why we don't do it in Phase 1:** Accounting complexity, ToS risk.

**What we do instead:** Non-transferable credits.

**When we might reconsider:** Phase 2.

**Decision:** Phase 1: No gifting.

---

### 12. Credit Transfer

**What it looks like:** User transfers credits from one account to another.

**Why we don't do it:** Accounting nightmare, resale risk, ToS risk.

**What we do instead:** Non-transferable credits.

**Decision:** Never. Forbidden.

---

### 13. Credit Refunding After Expiration

**What it looks like:** User requests refund of expired credits.

**Why we don't do it in Phase 1:** No expiration in Phase 1.

**What we do instead:** No expiration. Refunds before expiration are handled normally.

**Decision:** Phase 1: No expiration. If expiration is added, refund policy must be defined.

---

### 14. Credit Pausing or Freezing

**What it looks like:** User requests credits be frozen for later use.

**Why we don't do it in Phase 1:** Accounting complexity, reserve risk.

**What we do instead:** Use it or lose it (no expiration = use it whenever).

**Decision:** Phase 1: No pausing.

---

### 15. Credit Inheritance

**What it looks like:** User passes credits to next of kin.

**Why we don't do it:** Legal complexity, regulatory risk.

**What we do instead:** Non-transferable. Credits expire or are returned on account termination.

**Decision:** Never. Forbidden.

---

### 16. Credit Use for Non-AI Purposes

**What it looks like:** Platform uses credits for storage, computing, etc.

**Why we don't do it:** Credits are for AI token usage.

**What we do instead:** Credits only for AI token consumption.

**Decision:** AI token only.

---

### 17. Credit Use for Physical Products or Services

**What it looks like:** Platform uses credits for fulfillment, shipping, etc.

**Why we don't do it:** Credits are for AI token usage.

**What we do instead:** Credits only for AI token consumption.

**Decision:** AI token only.

---

### 18. Credit Use for Partner Services

**What it looks like:** Platform uses credits to pay partner APIs.

**Why we don't do it in Phase 1:** Partner integration not in scope.

**What we do instead:** Credits only for OpenAI.

**When we might reconsider:** Phase 3.

**Decision:** Phase 1: OpenAI only.

---

### 19. Credit Use for Third-Party API Calls

**What it looks like:** Platform uses credits to call third-party APIs (a web scraping service, OpenAI, etc.).

**Why we don't do it in Phase 1:** Platform absorbs these costs. Not passed to user.

**What we do instead:** Platform pays third-party API costs. Credits only for OpenAI.

**Decision:** Phase 1: Third-party API costs borne by platform.

---

### 20. Credit Use for Training Models

**What it looks like:** Platform uses credits to fine-tune OpenAI models.

**Why we don't do it:** Not allowed by OpenAI. Also, credit is for inference.

**What we do instead:** Credits only for inference (chat/completions).

**Decision:** Forbidden.

---

### 21. Credit Use for Fine-Tuning

**What it looks like:** Platform uses credits to create fine-tuned models.

**Why we don't do it:** Not allowed by OpenAI. Also, credit is for inference.

**What we do instead:** Credits only for inference (chat/completions).

**Decision:** Forbidden.

---

### 22. Credit Use for Embedding Generation

**What it looks like:** Platform uses credits to generate embeddings for RAG apps.

**Why we do it in Phase 1:** Part of standard AI token usage.

**What we do:** Track embedding token usage. Deduct credits.

**Decision:** Allowed in Phase 1.

---

### 23. Credit Use for Whisper Transcription

**What it looks like:** Platform uses credits to transcribe audio.

**Why we do it in Phase 1:** Part of standard AI token usage.

**What we do:** Track transcription token usage. Deduct credits.

**Decision:** Allowed in Phase 1.

---

### 24. Credit Use for DALL-E Image Generation

**What it looks like:** Platform uses credits to generate images.

**Why we do it in Phase 1:** Part of standard AI token usage.

**What we do:** Track image generation token usage. Deduct credits.

**Decision:** Allowed in Phase 1.

---

### 25. Credit Use for Embeddings Generation

**What it looks like:** Platform uses credits to generate embeddings for RAG.

**Why we do it in Phase 1:** Part of standard AI token usage.

**What we do:** Track embedding token usage. Deduct credits.

**Decision:** Allowed in Phase 1.

---

## Boundary Enforcement

**Code Review Checklist:**
- [ ] No OpenAI API key exposed to users
- [ ] No BYOK endpoint
- [ ] No credit transfer endpoint
- [ ] No credit resale endpoint
- [ ] No credit expiration (Phase 1)

**Legal Review Checklist:**
- [ ] Architecture documented
- [ ] Platform value documented
- [ ] ToS compliance reviewed
- [ ] Billing model reviewed

**Product Review Checklist:**
- [ ] No "OpenAI credits" UI language
- [ ] No "buy GPT credits" UI language
- [ ] Billing explanation clear
- [ ] Platform value clear

---

## Enforcement Process

**If a developer requests a feature that is out of scope:**
1. Product owner reviews request
2. Legal reviews if ToS risk
3. Engineering reviews if architecture risk
4. Decision documented
5. If approved: update this document
6. If denied: communicate to requester

---

## Out-of-Scope Process

**When a feature is identified as out of scope:**
1. Product owner files issue
2. Legal signs off on ToS impact
3. Engineering signs off on architecture impact
4. Decision documented
5. This document updated

---

## Future Expansion Policy

**Expansion policy:**
- Phase 1: Prove concept
- Phase 2: Expand to OpenAI + Google
- Phase 3: Enterprise self-hosted
- Phase 4: Partner integrations

**Feature freeze policy:**
- No new providers after Phase 1 starts
- No credit transfer or resale ever
- No credit expiration in Phase 1

---

## Summary

| Principle | Status | Phase |
|-----------|--------|-------|
| No OpenAI credit resale | Forbidden | All |
| No BYOK alongside credits | Forbidden | Phase 1 |
| OpenAI only | Phase 1 | Phase 1 |
| No credit transfer | Forbidden | All |
| No credit expiration | Phase 1 | Phase 1 |
| No credit gifting | Phase 2+ | Phase 2+ |
| No team credit pools | Phase 2+ | Phase 2+ |

**Decision Log:** See [docs/credit-system-open-questions.md](credit-system-open-questions.md)

**Operations:** See [docs/credit-system-operations.md](credit-system-operations.md)
