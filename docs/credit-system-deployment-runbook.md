# Credit System — Deployment Runbook

## Pre-Deployment Checklist

- [ ] **Architecture approved** by legal team
- [ ] **Platform value documented** (platform layer of service)
- [ ] **ToS compliance reviewed** by legal
- [ ] **No BYOK** endpoint in deployment
- [ ] **No credit resale** code in deployment
- [ ] **OpenAI API key** stored in environment variables
- [ ] **OpenAI API key** not in code or git history
- [ ] **Supabase Edge Function** deployed
- [ ] **Edge Function URL** tested and reachable
- [ ] **Webhook URL** configured in Stripe
- [ ] **Stripe secret** stored securely
- [ ] **Rate limit** configured in code
- [ ] **Cost tracking** configured in database
- [ ] **Monitoring alerts** configured
- [ ] **Alert recipients** identified
- [ ] **Rollback procedure** documented
- [ ] **Post-deployment verification** procedure defined
- [ ] **Disaster recovery plan** defined
- [ ] **Documentation updated** (this document)

---

## Deployment Steps

### Step 1: Database Migration

```sql
-- Run migrations
psql -h $SUPABASE_HOST -d postgres -U postgres -f migrations/001_credit_system.sql
psql -h $SUPABASE_HOST -d postgres -U postgres -f migrations/002_usage_tracking.sql
psql -h $SUPABASE_HOST -d postgres -U postgres -f migrations/003_monitoring.sql
```

**Verification:**
```sql
-- Verify tables created
\d credits;
\d credit_transactions;
\d api_usage_logs;
```

---

### Step 2: Deploy Supabase Edge Function

```bash
# Deploy function
supabase functions deploy proxy-openai --file functions/proxy-openai/index.ts
```

**Verification:**
```bash
# Test health
curl -X POST https://SUPABASE_PROJECT.supabase.co/functions/v1/proxy-openai/health \
  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY"
```

---

### Step 3: Update Environment Variables

**Supabase Secrets:**
```bash
supabase secrets set \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
  STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
```

**Netlify (if applicable):**
```bash
netlify env:set OPENAI_API_KEY $OPENAI_API_KEY
netlify env:set STRIPE_SECRET_KEY $STRIPE_SECRET_KEY
```

---

### Step 4: Deploy Application Code

```bash
# Build
npm run build

# Deploy
netlify deploy --prod
# or
supabase functions deploy credit-system
```

---

### Step 5: Verify Deployment

```bash
# Verify Edge Function
curl -X POST https://SUPABASE_PROJECT.supabase.co/functions/v1/proxy-openai/health \
  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY"

# Verify webhook endpoint
curl -X POST https://YOUR_DOMAIN.com/webhook-stripe \
  -H "Stripe-Signature: $STRIPE_WEBHOOK_SECRET \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

---

### Step 6: Post-Deployment Verification

**Credit Purchase Test:**
```bash
# Purchase credits
stripe test:customers create \
  --description "Test credit purchase" \
  --email test@OpenAImple.com

# Verify credits in database
psql -h $SUPABASE_HOST -c "SELECT * FROM credits WHERE user_id = $USER_ID;"
```

**Credit Consumption Test:**
```bash
# Run AI feature
curl -X POST https://YOUR_APP.com/api/ai/generate \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, world!"}'

# Verify credits consumed
psql -h $SUPABASE_HOST -c "SELECT * FROM credit_transactions WHERE user_id = $USER_ID ORDER BY created_at DESC LIMIT 1;"
```

**OpenAI API Call Test:**
```bash
# Verify OpenAI API key works
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"ping"}]}'
```

---

## Rollback Procedures

### Complete Rollback

```bash
# 1. Stop new deployments
git revert HEAD
git push origin main

# 2. Redeploy previous version
supabase functions deploy proxy-openai --file functions/proxy-openai/index.ts.bak

# 3. Verify rollback
curl -X POST https://SUPABASE_PROJECT.supabase.co/functions/v1/proxy-openai/health \
  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY"
```

### Partial Rollback (Credit System Only)

```bash
# 1. Revert credit migration
supabase db reset

# 2. Revert Edge Function
supabase functions deploy proxy-openai --file functions/proxy-openai/index.ts.bak
```

---

## Monitoring Setup

### Daily Checks

| Check | Frequency | Alert Threshold |
|-------|-----------|-----------------|
| Daily OpenAI costs | Daily | > $500 |
| Daily credit purchases | Daily | > $10k |
| Daily active AI users | Daily | < 10 (drop) |
| Daily credit consumption | Daily | < 100k tokens |

### Weekly Checks

| Check | Frequency | Alert Threshold |
|-------|-----------|-----------------|
| Weekly OpenAI costs | Weekly | > $3000 |
| Weekly credit purchases | Weekly | > $50k |
| Weekly active users | Weekly | < 100 (drop) |
| Weekly credit consumption | Weekly | < 1M tokens |

### Monthly Checks

| Check | Frequency | Alert Threshold |
|-------|-----------|-----------------|
| Monthly OpenAI costs | Monthly | > $10k |
| Monthly credit purchases | Monthly | > $200k |
| Monthly active users | Monthly | < 500 (drop) |
| Monthly credit consumption | Monthly | < 10M tokens |

---

## Deployment Verification

### Success Criteria

| Criterion | Pass |
|-----------|------|
| Database tables created | |
| Edge Function healthy | |
| Webhook URL reachable | |
| Credit purchase works | |
| Credit consumption works | |
| OpenAI API calls work | |
| Monitoring alerts configured | |
| Documentation updated | |

---

## Post-Deployment Actions

1. **Send notification** to stakeholders
2. **Update status page**
3. **Monitor for 24 hours** intensively
4. **Schedule retroactive review** (1 week)
5. **Update internal runbook** with lessons learned

---

## Contact

**Deployment Team:** @engineering
**On-Call:** @on-call-rotation
**Slack:** #engineering-alerts

---

## Change History

| Date | Version | Author | Notes |
|------|---------|--------|-------|
| 2026-09-24 | 1.0 | Engineering | Initial deployment runbook |

---

**Related:**
- [docs/credit-system-operations.md](credit-system-operations.md)
- [docs/credit-system-risk-mitigation.md](credit-system-risk-mitigation.md)
