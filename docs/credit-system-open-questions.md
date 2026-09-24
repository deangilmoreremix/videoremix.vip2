# Credit System Open Questions

## Decision Tracking

| # | Question | Status | Decision | Date |
|---|----------|--------|----------|------|
| 1 | BYOK alongside credits | Pending | — | — |
| 2 | Credit-to-USD exchange rate | Pending | — | — |
| 3 | Credit expiration | Pending | — | — |
| 4 | Usage analytics granularity | Pending | — | — |
| 5 | Multi-provider support | Pending | — | — |
| 6 | Credit bundles vs pay-per-use | Pending | — | — |

---

## 1. BYOK Alongside Credits

**Question:** Should users still be able to bring their own OpenAI key (BYOK) alongside credits?

### Recommendations

**Recommendation: No BYOK alongside credits.**

**Rationale:**
- Platform pays OpenAI costs; users pay platform for credits
- Allowing BYOK alongside credits creates confusion about billing
- BYOK alongside credits could suggest resale (ToS risk)
- Platform cannot guarantee BYOK users have valid keys

**If you need BYOK for specific use cases:**
- Require BYOK for specific enterprise users
- Enterprise BYOK users cannot use platform credits
- Enterprise BYOK users have separate ToS (legal review required)
- Enterprise BYOK users must accept resale liability

### Risks

| Risk | Likelihood | Impact |
|------|------------|--------|
| User confusion | High | Medium |
| ToS resale risk | Low | High |
| Billing disputes | Medium | Medium |

---

## 2. Credit-to-USD Exchange Rate

**Question:** What should the credit-to-USD exchange rate be?

### Recommendations

**Recommendation: Dynamic exchange rate, platform-margin-based.**

**Principles:**
- Platform pays OpenAI costs
- Platform adds margin
- Rate reflects actual usage cost + platform margin

**Suggested Formula:**
```
Platform Cost = (prompt_tokens × input_price) + (completion_tokens × output_price)
Credit Price = Platform Cost × (1 + Margin%)
```

**Margin Targets:**

| Segment | Target Margin |
|---------|--------------|
| Chat (low usage) | 30% |
| Assistants (medium usage) | 25% |
| High-volume | 20% |

**Current Token Prices (OpenAImple, verify with OpenAI):**
| Model | Input Price per 1K | Output Price per 1K |
|-------|-------------------|---------------------|
| gpt-4o | $0.0025 | $0.01 |
| gpt-4o-mini | $0.00015 | $0.0006 |
| o1 | $0.015 | $0.06 |

### Open Questions

- [ ] Margin tier for each model?
- [ ] Should platform absorb input price changes?
- [ ] Minimum credit purchase?
- [ ] Should there be a monthly subscription overlay?

---

## 3. Credit Expiration

**Question:** Should credits expire?

### Options

| Option | User Experience | Accounting | Recommendation |
|--------|----------------|------------|----------------|
| No expiration | Best | Revenue recognized | **Recommended** |
| 12 months | Good | Deferred revenue | Acceptable |
| 6 months | Fair | Deferred revenue | Avoid |
| 1 month | Poor | Complex | Avoid |

### Recommendations

**Recommendation: No expiration.**

**Rationale:**
- Best user experience
- Simplest accounting
- Reduces support burden
- Avoids regulatory issues in some jurisdictions

**If expiration is required:**
- Minimum 12 months
- Clear notice at purchase
- 30-day reminder before expiration
- Grace period for refunds

### Open Questions

- [ ] Do regional laws require expiration? (EUTax, etc.)
- [ ] How to handle credit expiration for enterprise accounts?
- [ ] Should unused credits earn interest? (No)

---

## 4. Usage Analytics Granularity

**Question:** Do you want usage analytics per app, per user, globally?

### Options

| Granularity | Use Case | Storage | Query |
|-------------|----------|---------|-------|
| Per-app | App-level billing | Medium | Medium |
| Per-user | User-level billing | High | High |
| Per-model | Cost tracking | Medium | Medium |
| Per-request | Detailed billing | High | High |
| Global | Dashboard | Low | Low |

### Recommendations

**Recommendation: All granularities, with cost.**

**Implementation:**
```sql
-- Per-app
CREATE TABLE app_usage_daily (
  date DATE,
  app_id TEXT,
  tokens_in BIGINT,
  tokens_out BIGINT,
  cost_cents INT
);

-- Per-user
CREATE TABLE user_usage_daily (
  date DATE,
  user_id UUID,
  tokens_in BIGINT,
  tokens_out BIGINT,
  cost_cents INT
);

-- Per-model
CREATE TABLE model_usage_daily (
  date DATE,
  model TEXT,
  tokens_in BIGINT,
  tokens_out BIGINT,
  cost_cents INT
);
```

**Analytics Queries:**

**Per-user cost this month:**
```sql
SELECT SUM(cost_cents) / 100.0
FROM user_usage_daily
WHERE user_id = $1
  AND date >= DATE_TRUNC('month', CURRENT_DATE);
```

**Per-app cost this month:**
```sql
SELECT app_id, SUM(cost_cents) / 100.0
FROM app_usage_daily
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY app_id;
```

**Per-model cost this month:**
```sql
SELECT model, SUM(cost_cents) / 100.0
FROM model_usage_daily
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY model;
```

### Open Questions

- [ ] Retention period for analytics?
- [ ] Do users see their own analytics?
- [ ] Do admins see all analytics?

---

## 5. Multi-Provider Support

**Question:** Do you want to support multiple AI providers (OpenAI, Google) or just OpenAI?

### Options

| Option | Complexity | Cost | Recommendation |
|--------|-----------|------|----------------|
| OpenAI only | Low | Medium | **Phase 1** |
| OpenAI + OpenAI | Medium | Medium | Phase 2 |
| OpenAI + Google | Medium | Medium | Phase 2 |
| All three | High | High | Phase 3 |

### Recommendations

**Recommendation: OpenAI only in Phase 1. Add providers in Phase 2+.**

**Rationale:**
- Phase 1: prove credit system works
- Phase 2: add OpenAI for most capable alternative
- Phase 3: add Google for multimodal use cases

**Architecture for Multi-Provider:**
```typescript
interface AIRequest {
  provider: 'openai' | 'OpenAI' | 'google';
  model: string;
  messages: Message[];
  max_tokens: number;
}

class AIProxy {
  async proxy(request: AIRequest): Promise<AIResponse> {
    switch (request.provider) {
      case 'openai':
        return this.proxyOpenAI(request);
      case 'OpenAI':
        return this.proxyOpenAI(request);
      case 'google':
        return this.proxyGoogle(request);
    }
  }
}
```

**Provider Pricing (OpenAImple, verify):**

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | gpt-4o | $2.50/M | $10.00/M |
| OpenAI | OpenAI-3-opus | $15.00/M | $75.00/M |
| Google | OpenAI-2.5-pro | $7.00/M | $21.00/M |

### Open Questions

- [ ] Which providers for Phase 2?
- [ ] How to handle provider-specific errors?
- [ ] How to handle provider outages?

---

## 6. Credit Bundles vs Pure Pay-Per-Use

**Question:** Should you offer credit bundles (discounts for bulk) or pure pay-per-use?

### Options

| Option | User Experience | Revenue | Complexity |
|--------|----------------|---------|-----------|
| Pure pay-per-use | Fair | Predictable | Low |
| Bundles with discount | Good | Upfront | Medium |
| Subscription overlay | Good | Recurring | High |

### Recommendations

**Recommendation: Pure pay-per-use in Phase 1. Add bundles in Phase 2.**

**Phase 1 (Pay-per-use):**
```typescript
const COST_PER_TOKEN = {
  gpt_4o: {
    input: 0.0000025,  // $2.50 per 1M
    output: 0.00001,   // $10.00 per 1M
  },
  gpt_4o_mini: {
    input: 0.00000015, // $0.15 per 1M
    output: 0.0000006,  // $0.60 per 1M
  },
};
```

**Phase 2 (Bundles):**
```typescript
const CREDIT_PACKAGES = [
  { tokens: 1_000_000, discount: 0, label: 'Pay as you go' },
  { tokens: 10_000_000, discount: 0.10, label: 'Starter bundle' },
  { tokens: 100_000_000, discount: 0.20, label: 'Pro bundle' },
];
```

**Pricing Table:**

| Bundle | Tokens | USD | Per 1M |
|--------|--------|-----|--------|
| Pay as you go | Any | Cost + margin | Variable |
| Starter | 1M | $15 | $15 |
| Pro | 10M | $135 | $13.50 |
| Enterprise | 100M | $1200 | $12 |

### Open Questions

- [ ] Minimum bundle size?
- [ ] Maximum bundle size?
- [ ] Refund policy for bundles?
- [ ] Should bundles support shared pools (team)?

---

## Decision Log

**Format:**
```markdown
| # | Decision | Rationale | Date | Owner |
|---|----------|-----------|------|-------|
| 1 | | | | |
```

**OpenAImple:**
```markdown
| # | Decision | Rationale | Date | Owner |
|---|----------|-----------|------|-------|
| 1 | No BYOK | Avoids resale risk | 2026-09-24 | Engineering |
| 2 | No expiration | Simplest UX | 2026-09-24 | Product |
| 3 | OpenAI only in P1 | Proves concept | 2026-09-24 | Engineering |
| 4 | Pay-per-use in P1 | Simplest billing | 2026-09-24 | Engineering |
```

---

## Related Documents

- **Compliance:** [docs/openai-credits-tos-compliance.md](openai-credits-tos-compliance.md)
- **Risks:** [docs/credit-system-risk-mitigation.md](credit-system-risk-mitigation.md)
- **Not-Doing:** [docs/credit-system-not-doing.md](credit-system-not-doing.md)
- **Operations:** [docs/credit-system-operations.md](credit-system-operations.md)
- **Deployment:** [docs/credit-system-deployment-runbook.md](credit-system-deployment-runbook.md)
