# Credit System Risk Mitigation

## Risk Matrix

| Risk | Impact | Likelihood | Risk Level | Status |
|------|--------|------------|------------|--------|
| OpenAI ToS violation | Critical | Low | High | Mitigated |
| Cost overruns (users spam API) | High | Medium | High | Mitigated |
| Stripe fraud | Medium | Low | Medium | Mitigated |
| Proxy downtime | High | Medium | High | Mitigated |
| API key compromise | Critical | Low | High | Mitigated |
| User confusion | Medium | Medium | Medium | Mitigated |
| Margin pressure | High | High | High | Monitored |

---

## 1. OpenAI ToS Violation

**Description:** Architecture changes or policy changes cause unintended ToS violation.

**Mitigation Strategy:**
- Platform-led architecture (single API key, platform pays)
- No BYOK resale (users bring own key forbidden)
- Periodic legal architecture review (annual)
- Platform value layer (application + security + UX)

**Monitoring/Alerting:**
- Monitor OpenAI policy announcements (monthly)
- Alert architecture changes to legal before merge
- Track partnership discussions

**Fallback Plan:**
- Maintain architecture memo documenting platform value
- Prepare alternative billing models (e.g., per-app subscription)
- Legal hold on partnership discussions if risk emerges

**Runbook:** `docs/credit-system-operations.md`

---

## 2. Cost Overruns (Users Spam API)

**Description:** User actions or technical issues cause unexpected high API costs.

**Mitigation Strategy:**
- Rate limit per user (token-based, not request-based)
- Token-level billing (users pay for tokens consumed)
- Daily per-user spending limits
- Circuit breaker for failed/aborted requests

**Monitoring/Alerting:**
- Track real-time token consumption per user
- Daily aggregated OpenAI cost report
- Alert if daily cost exceeds 80% of budget

**Fallback Plan:**
- Suspend user consumption if spending limit hit
- Refund tokens if failure was platform-side
- Implement cooldown period after spending limit

**Monitoring Query:**
```sql
SELECT
  user_id,
  SUM(token_cost_cents)::NUMERIC / 100 AS daily_usd,
  COUNT(*) AS requests
FROM api_usage_logs
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY user_id
HAVING SUM(token_cost_cents) > 5000 -- $50 limit
```

**Alert Thresholds:**
- User daily cost > $30: email alert
- User daily cost > $50: account hold
- Platform daily cost > $500: page engineering
- Platform monthly cost > $3000: page executive

---

## 3. Stripe Fraud

**Description:** Fraudulent charges, chargebacks, or stolen payment methods.

**Mitigation Strategy:**
- Stripe Radar enabled (if available)
- Webhook signature verification
- Idempotent purchase processing
- Delayed credit issuance (1 hour after payment)

**Monitoring/Alerting:**
- Track Stripe dispute rate
- Track refund rate
- Track failed payment rate

**Fallback Plan:**
- Refund credits if fraudulent charge reversed
- Suspension of user pending investigation
- Manual review of large purchases (>$500)

**Stripe Webhook Verification:**
```typescript
const isValid = stripe.webhooks.generateTestHeaderObject({
  payload,
  secret: STRIPE_WEBHOOK_SECRET,
});
```

---

## 4. Proxy Downtime

**Description:** Supabase Edge Function fails, causing credit consumption but no API response.

**Mitigation Strategy:**
- Retry with exponential backoff (3 retries, 1s/2s/4s delays)
- Idempotent credit deduction (revert if API fails)
- Circuit breaker for OpenAI API failures
- Fallback to cached responses when possible

**Monitoring/Alerting:**
- Track Edge Function error rate
- Track OpenAI API error rate
- Alert if proxy error rate > 5% in 5 minutes

**Fallback Plan:**
- Revert credits if proxy fails (automatic)
- Show user-friendly error message
- Offer "try again" without additional cost

**Edge Function Health Check:**
```bash
curl -X POST https://SUPABASE_PROJECT.supabase.co/functions/v1/proxy-openai \
  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"ping"}]}'
```

---

## 5. API Key Compromise

**Description:** OpenAI API key is exposed, causing unauthorized usage and billing.

**Mitigation Strategy:**
- Key stored in environment variables (never in code)
- Key in platform's OpenAI account (platform-locked)
- Key rotated quarterly (scheduled)
- Key revoked immediately if compromise detected

**Monitoring/Alerting:**
- Track OpenAI API usage (daily cost)
- Alert if cost increases unexpectedly (>50% day-over-day)

**Fallback Plan:**
- Revoke compromised key immediately
- Rotate new key in
- Review usage logs for unauthorized access
- Notify OpenAI support if needed

**Key Rotation Procedure:** See [docs/credit-system-operations.md](credit-system-operations.md)

---

## 6. User Confusion

**Description:** Users don't understand credit system, expect BYOK, or misunderstand billing.

**Mitigation Strategy:**
- Clear UI language ("AI tokens" not "OpenAI credits")
- Billing transparency (show token consumption per request)
- Help center article explaining credit system
- In-app tooltips for credit consumption
- Email receipt after each purchase and consumption

**Monitoring/Alerting:**
- Track support tickets mentioning "credits"
- Track billing disputes

**Fallback Plan:**
- Quick resolution by support team
- Credit refunds if billing was platform error
- Help center updates based on common questions

**Help Center Article:**
```markdown
## How AI Tokens Work

### What are AI Tokens?
AI tokens are platform usage credits. You use tokens when you run AI features
in apps.

### What are AI Tokens Not?
AI tokens are not OpenAI credits. You cannot use them with your own
OpenAI key.

### How Do I Use Tokens?
Tokens are automatically consumed when you use AI features.
```

---

## 7. Margin Pressure

**Description:** OpenAI costs rise faster than credit prices, eroding margins.

**Mitigation Strategy:**
- Monitor OpenAI price changes (subscribe to OpenAI announcements)
- Model tiering (different prices for different models)
- Caching (reduce redundant API calls)
- Prompt optimization (reduce token count per request)

**Monitoring/Alerting:**
- Track actual margin per credit sold
- Alert if margin drops below 20%
- Monthly margin report to executive team

**Fallback Plan:**
- Price adjustment process (30-day notice to users)
- Model downgrade process (use cheaper models)
- Credit system re-pricing

**Margin Calculation:**
```
Margin = (Credit Revenue - OpenAI Costs) / Credit Revenue
```

**Alert Thresholds:**
- Margin > 40%: Healthy
- Margin 20-40%: Watch
- Margin < 20%: Action

---

## Common Failure Modes

### Mode 1: User Spams API

**Symptom:** User makes 1000 API calls in 1 minute

**Response:**
1. Rate limiter detects abuse (token-based)
2. User account limited for 1 hour
3. Refund tokens for aborted requests
4. Alert engineering team
5. Review user account

### Mode 2: OpenAI Price Change

**Symptom:** GPT-4o price increases 50%

**Response:**
1. Engineering team updates cost calculation
2. Finance team reviews pricing
3. Product team decides if price changes needed
4. Legal team reviews contract implications
5. Support team preps user communications

### Mode 3: User Asks for Refund

**Symptom:** User wants refund of unused credits

**Response:**
1. Verify purchase is within refund window
2. Verify credits are unused
3. Process refund via Stripe
4. Void credits in system
5. Notify user

### Mode 4: Proxy Down During Use

**Symptom:** User runs AI feature, proxy fails

**Response:**
1. Platform detects failure (Edge Function error)
2. Platform reverts credits automatically
3. Platform shows user-friendly error
4. Platform alerts engineering team
5. User can retry without additional charge

---

## Operational Runbooks

### Runbook: Resolve Billing Dispute

1. Pull user account information
2. Pull usage logs for period in question
3. Verify token count and charge
4. If platform error: issue refund
5. If user error: explain billing
6. Document resolution

### Runbook: Handle Stripe Chargeback

1. Pull Stripe dispute details
2. Pull user purchase details
3. Verify service delivery (usage logs)
4. Submit evidence to Stripe
5. If evidence wins: notify user
6. If evidence loses: void credits, update account

### Runbook: Revoke and Rotate API Key

1. Generate new OpenAI API key
2. Store in secure secret manager
3. Update platform environment
4. Verify rotation successful
5. Revoke old key in OpenAI dashboard
6. Document rotation date

---

## Risk Review Cadence

| Review | Cadence | Participants |
|--------|---------|--------------|
| Risk register review | Monthly | Engineering + Product + Legal |
| Margin review | Monthly | Finance + Engineering |
| Fraud pattern review | Weekly | Engineering + Support |
| ToS compliance review | Annual | Legal |
| Disaster recovery drill | Quarterly | Engineering |

---

## Open Questions

**See:** [docs/credit-system-open-questions.md](credit-system-open-questions.md)
