# Credit System — Operations Guide

## Table of Contents

1. [Monitor Credit System Health](#monitor-credit-system-health)
2. [Handle User Disputes](#handle-user-disputes)
3. [Refund Credits](#refund-credits)
4. [Adjust Pricing](#adjust-pricing)
5. [Rotate OpenAI API Key](#rotate-openai-api-key)
6. [Handle Abuse and Fraud](#handle-abuse-and-fraud)

---

## Monitor Credit System Health

### Health Check Dashboard

**Metrics to monitor:**

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Daily OpenAI costs | `openai_daily_costs` | > $500 |
| Daily credit purchases | `purchases` | > $10k |
| Daily active users | `user_app_access` | < 10 (drop) |
| Daily credit consumption | `credit_transactions` | < 100k tokens |
| Daily revenue | `purchases` | < $1k (drop) |
| Daily refunds | `purchases` | > 5% refund rate |
| Daily disputes | `stripe_disputes` | > 2 dispute rate |
| OpenAI API error rate | `api_usage_logs` | > 5% error rate |
| Edge Function error rate | `api_usage_logs` | > 5% error rate |
| User-reported billing issues | `support_tickets` | > 5 per day |

### Health Check Queries

**Daily OpenAI costs:**
```sql
SELECT
  DATE(created_at) AS date,
  SUM(cost_cents)::NUMERIC / 100 AS daily_usd
FROM api_usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Daily credit purchases:**
```sql
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS purchases,
  SUM(amount)::NUMERIC / 100 AS daily_usd
FROM purchases
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Daily active users:**
```sql
SELECT
  DATE(created_at) AS date,
  COUNT(DISTINCT user_id) AS active_users
FROM api_usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Daily credit consumption:**
```sql
SELECT
  DATE(created_at) AS date,
  SUM(tokens_used) AS tokens_consumed
FROM api_usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Dashboard (Supabase)

```sql
-- Create a materialized view for the dashboard
CREATE MATERIALIZED VIEW credit_system_daily AS
SELECT
  CURRENT_DATE AS date,
  COUNT(DISTINCT lu.user_id) FILTER (WHERE lu.application = 'openai_proxy') AS active_ai_users,
  COALESCE(SUM(lu.tokens_used)::BIGINT, 0) AS tokens_consumed,
  COALESCE(SUM(lu.cost_cents)::INTEGER, 0) AS openai_costs_cents,
  COALESCE(SUM(p.amount)::INTEGER, 0) AS credit_purchases_cents,
  COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= CURRENT_DATE) AS purchases
FROM (
  SELECT CURRENT_DATE::DATE AS date
) d
LEFT JOIN api_usage_logs lu ON DATE(lu.created_at) = d.date
LEFT JOIN purchases p ON DATE(p.created_at) = d.date;
```

**Query the dashboard:**
```sql
SELECT
  date,
  active_ai_users,
  tokens_consumed,
  openai_costs_cents::NUMERIC / 100 AS openai_costs_usd,
  credit_purchases_cents::NUMERIC / 100 AS credit_purchases_usd,
  purchases
FROM credit_system_daily
ORDER BY date DESC
LIMIT 30;
```

---

## Handle User Disputes

### Dispute Process

**Step 1: Receive dispute**

User opens support ticket or Stripe dispute is filed.

**Step 2: Gather information**

```sql
-- Get user information
SELECT * FROM auth.users WHERE email = $USER_EMAIL;

-- Get user credits
SELECT * FROM credits WHERE user_id = $USER_ID;

-- Get user transactions
SELECT * FROM credit_transactions WHERE user_id = $USER_ID ORDER BY created_at DESC;

-- Get user OpenAI usage
SELECT
  id,
  application,
  endpoint,
  tokens_used,
  cost_cents,
  created_at
FROM api_usage_logs
WHERE user_id = $USER_ID
ORDER BY created_at DESC
LIMIT 100;
```

**Step 3: Determine validity**

| Dispute Type | Resolution |
|--------------|-----------|
| Billing error | Refund |
| User error | No refund |
| Platform error | Refund |
| OpenAI error | Refund |

**Step 4: Resolve dispute**

```sql
-- Issue refund
UPDATE credits
SET balance = balance + $REFUND_AMOUNT
WHERE user_id = $USER_ID;

-- Record refund
INSERT INTO credit_transactions (user_id, type, amount, description)
VALUES ($USER_ID, 'refund', $REFUND_AMOUNT, 'Dispute resolution');

-- Update Stripe (if applicable)
stripe.refunds.create({
  charge: $CHARGE_ID,
  amount: $REFUND_AMOUNT,
  reason: 'requested_by_customer',
});
```

**Step 5: Notify user**

```markdown
Subject: Re: Your Dispute Request

Thank you for your dispute request.

We have reviewed your account and usage history. [Reason for decision].

[Resolution details: refund amount, credit balance, next steps].

If you have further questions, please reply to this email.
```

**Step 6: Document resolution**

```sql
INSERT INTO dispute_resolutions (user_id, dispute_type, resolution, refund_amount, notes)
VALUES ($USER_ID, $DISPUTE_TYPE, $RESOLUTION, $REFUND_AMOUNT, $NOTES);
```

### Common Dispute Types

| Type | OpenAImple | Resolution |
|------|---------|-----------|
| Too many tokens | User thinks they used too many | Refund if platform error |
| Unexpected charge | User didn't know they would be charged | Refund if platform error |
| OpenAI error | OpenAI returned error but credits consumed | Refund if platform error |
| User error | User ran AI feature too many times | No refund |

---

## Refund Credits

### Refund Policy

**Refundable:**
- Unused credits (full refund)
- Platform error (full refund + tokens restored)
- OpenAI error (full refund + tokens restored)

**Non-refundable:**
- Used credits (full credit consumed)
- User error (full credit consumed)
- Abusive usage (full credit consumed)

### Refund Process

**Step 1: Verify refund eligibility**

```sql
-- Check if credits are refundable
SELECT
  balance,
  (SELECT SUM(amount) FROM credit_transactions WHERE user_id = $USER_ID AND type IN ('purchase', 'refund')) AS total_purchased,
  (SELECT SUM(amount) FROM credit_transactions WHERE user_id = $USER_ID AND type = 'consumption') AS total_consumed
FROM credits
WHERE user_id = $USER_ID;
```

**Step 2: Issue refund**

```sql
-- Refund credits
UPDATE credits
SET balance = balance + $REFUND_AMOUNT
WHERE user_id = $USER_ID;

-- Record refund
INSERT INTO credit_transactions (user_id, type, amount, description)
VALUES ($USER_ID, 'refund', $REFUND_AMOUNT, $REASON);
```

**Step 3: Issue Stripe refund (if applicable)**

```typescript
const refund = await stripe.refunds.create({
  payment_intent: $PAYMENT_INTENT_ID,
  amount: $REFUND_AMOUNT,
  reason: 'requested_by_customer',
});
```

**Step 4: Notify user**

```markdown
Subject: Your Credit Refund Has Been Processed

We have processed your refund of $REFUND_AMOUNT.

Your new credit balance is $CURRENT_BALANCE.

If you have any questions, please reply to this email.
```

### Refund Limits

| Limit | Value |
|-------|-------|
| Maximum refund per request | $500 |
| Maximum refund per user per month | $5000 |
| Maximum refunds per day | 10 |

---

## Adjust Pricing

### Pricing Adjustment Process

**When to adjust pricing:**
- OpenAI price changes
- Margin pressure
- Market conditions
- User feedback

**Pricing Adjustment Process:**

**Step 1: Legal review**

- [ ] Review pricing change impact
- [ ] Review existing contracts
- [ ] Review ToS implications

**Step 2: Engineering review**

- [ ] Review technical impact
- [ ] Review system changes
- [ ] Review migration plan

**Step 3: Finance review**

- [ ] Review margin impact
- [ ] Review revenue impact
- [ ] Review customer impact

**Step 4: Communication plan**

- [ ] Draft user communication
- [ ] Draft support documentation
- [ ] Prepare for support tickets

**Step 5: Implementation**

```sql
-- Update pricing in database
UPDATE pricing_tiers
SET cost_per_token = $NEW_COST
WHERE id = $TIER_ID;
```

**Step 6: Communication**

- [ ] Send email to users (30-day notice)
- [ ] Update website pricing
- [ ] Update documentation

**Step 7: Monitoring**

- [ ] Monitor credit purchases
- [ ] Monitor user churn
- [ ] Monitor support tickets

### Pricing Structure

| Model | Input Price per 1M | Output Price per 1M | Margin |
|-------|-------------------|---------------------|--------|
| gpt-4o | $2.50 | $10.00 | 30% |
| gpt-4o-mini | $0.15 | $0.60 | 25% |
| o1 | $15.00 | $60.00 | 25% |

---

## Rotate OpenAI API Key

### Key Rotation Process

**Frequency:** Quarterly

**Process:**

**Step 1: Generate new key**

```bash
# OpenAI dashboard → API keys → Create new secret key
# Or programmatically (if available)
```

**Step 2: Store new key**

```bash
# Store in Supabase secrets
supabase secrets set OPENAI_API_KEY=$NEW_API_KEY

# Store in Netlify (if applicable)
netlify env:set OPENAI_API_KEY $NEW_API_KEY
```

**Step 3: Test new key**

```bash
# Test API call
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $NEW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"ping"}]}'
```

**Step 4: Verify rotation**

```bash
# Verify both keys work (should fail for old, succeed for new)
curl -X POST https://YOUR_DOMAIN.com/api/ai/generate \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "ping"}'
```

**Step 5: Revoke old key**

```bash
# OpenAI dashboard → API keys → Revoke old key
```

**Step 6: Document rotation**

```sql
INSERT INTO api_key_rotations (provider, old_key_last_four, new_key_last_four, rotated_by, notes)
VALUES ('openai', 'old_last4', 'new_last4', 'engineering', 'Quarterly rotation');
```

### Emergency Rotation

**If key is compromised:**

1. **Immediately revoke** compromised key
2. **Generate new key**
3. **Store new key** in secrets
4. **Update platform**
5. **Notify stakeholders**
6. **Review logs** for unauthorized usage

---

## Handle Abuse and Fraud

### Abuse Types

| Type | OpenAImple | Response |
|------|---------|---------|
| Token spamming | 1000 requests/minute | Suspend account |
| Scripting | Automated abuse | Suspend account |
| Fraudulent payments | Stolen credit card | Reverse credits, suspend account |
| Billing fraud | Repeated disputes | Restrict account |
| OpenAI abuse | Harassment of OpenAI | Legal review |

### Abuse Detection

**Automated Detection:**

```sql
-- Detect token spamming
SELECT
  user_id,
  COUNT(*) AS requests,
  SUM(tokens_used) AS tokens_consumed,
  SUM(cost_cents)::NUMERIC / 100 AS daily_usd
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 1000
   OR SUM(tokens_used) > 1000000
   OR SUM(cost_cents) > 10000;
```

**Rule-Based Detection:**

```typescript
const ABUSE_THRESHOLDS = {
  requests_per_minute: 100,
  requests_per_hour: 1000,
  tokens_per_minute: 10000,
  tokens_per_hour: 100000,
  daily_cost: 500,  // $500
};

function detectAbuse(userId: string): boolean {
  // Check rate limits
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const requests = await db.apiUsageLogs.findMany({
    where: {
      userId,
      createdAt: { gte: oneMinuteAgo },
    },
  });
  if (requests.length > ABUSE_THRESHOLDS.requests_per_minute) {
    return true;
  }

  // Check token usage
  const tokensUsed = requests.reduce((sum, r) => sum + r.tokensUsed, 0);
  if (tokensUsed > ABUSE_THRESHOLDS.tokens_per_minute) {
    return true;
  }

  return false;
}
```

### Fraud Detection

**Automated Detection:**

```sql
-- Detect stolen credit card payments
SELECT
  user_id,
  COUNT(*) AS purchase_count,
  SUM(amount)::INTEGER AS total_usd,
  MAX(created_at) AS last_purchase
FROM purchases
WHERE status = 'succeeded'
GROUP BY user_id
HAVING COUNT(*) > 5
   AND SUM(amount) > 5000; -- $500
```

### Abuse Response

**Step 1: Detect abuse**

- Automated system triggers alert
- OR support team identifies abuse

**Step 2: Suspend account**

```sql
UPDATE auth.users
SET account_status = 'suspended'
WHERE id = $USER_ID;
```

**Step 3: Review activity**

```sql
SELECT *
FROM api_usage_logs
WHERE user_id = $USER_ID
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Step 4: Reverse credits (if fraudulent)**

```sql
-- Reverse consumed credits
UPDATE credits
SET balance = balance + $ABUSED_AMOUNT
WHERE user_id = $USER_ID;

-- Record reversal
INSERT INTO credit_transactions (user_id, type, amount, description)
VALUES ($USER_ID, 'abuse_reversal', $ABUSED_AMOUNT, 'Abuse reversal');
```

**Step 5: Notify user**

```markdown
Subject: Account Suspension Notice

Your account has been suspended due to [reason].

[Details of violation].

If you believe this is an error, please reply to this email.
```

**Step 6: Document resolution**

```sql
INSERT INTO abuse_resolutions (user_id, abuse_type, resolution, credits_reversed, notes)
VALUES ($USER_ID, $ABUSE_TYPE, $RESOLUTION, $CREDITS_REVERSED, $NOTES);
```

---

## Common Operational Tasks

### Task: Check Credit System Health

```sql
-- Daily health check
SELECT
  NOW() AS check_time,
  COUNT(DISTINCT user_id) FILTER (WHERE application = 'openai_proxy') AS active_ai_users,
  SUM(tokens_used) FILTER (WHERE application = 'openai_proxy') AS tokens_consumed,
  SUM(cost_cents) FILTER (WHERE application = 'openai_proxy')::NUMERIC / 100 AS openai_costs_usd,
  (SELECT SUM(amount)::INTEGER FROM credit_transactions WHERE type = 'purchase' AND created_at >= CURRENT_DATE) AS credit_purchases_usd
FROM api_usage_logs
WHERE created_at >= CURRENT_DATE;
```

### Task: Find Top Consumers

```sql
-- Top 10 consumers today
SELECT
  user_id,
  COUNT(*) AS requests,
  SUM(tokens_used) AS tokens_consumed,
  SUM(cost_cents)::NUMERIC / 100 AS daily_usd
FROM api_usage_logs
WHERE created_at >= CURRENT_DATE
GROUP BY user_id
ORDER BY daily_usd DESC
LIMIT 10;
```

### Task: Find Users with Insufficient Credits

```sql
-- Users who tried to use AI but have insufficient credits
SELECT
  user_id,
  balance,
  COUNT(*) AS failed_requests
FROM credits
JOIN api_usage_logs ON credits.user_id = api_usage_logs.user_id
WHERE api_usage_logs.status_code = 402  -- Payment required
GROUP BY user_id, balance
ORDER BY failed_requests DESC;
```

### Task: Check Stripe Webhook Health

```bash
# Verify Stripe webhook
curl -X POST https://YOUR_DOMAIN.com/webhook-stripe \
  -H "Stripe-Signature: $STRIPE_WEBHOOK_SECRET \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Task: Check Edge Function Health

```bash
# Verify Edge Function
curl -X POST https://SUPABASE_PROJECT.supabase.co/functions/v1/proxy-openai/health \
  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY"
```

### Task: Rotate OpenAI API Key

```bash
# Follow rotation process (see above)
```

---

## On-Call

**On-Call Engineer:** @on-call-rotation
**Slack:** #engineering-alerts
**PagerDuty:** pd-credit-system

---

## Related Documents

- [docs/credit-system-risk-mitigation.md](credit-system-risk-mitigation.md)
- [docs/credit-system-deployment-runbook.md](credit-system-deployment-runbook.md)
- [docs/credit-system-open-questions.md](credit-system-open-questions.md)
