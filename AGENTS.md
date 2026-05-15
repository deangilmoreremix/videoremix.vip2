# AGENTS.md

## Stripe CLI Setup

### Installation

The Stripe CLI is required for local webhook testing and development.

**Installed:** `~/.local/bin/stripe` (v1.40.9)

### Setup Commands

```bash
# Authenticate with your Stripe account
stripe login

# Listen for webhooks locally (requires dev server running on port 5173)
stripe listen --forward-to localhost:5173/webhook-stripe

# Run with test mode
stripe login --test-mode
```

### Environment Variables

Add to your `.env` file:

```bash
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_URL=https://your-project.supabase.co
```

### Pricing Structure

- **102 Apps**: $97 lifetime each
- **15 Premium Apps**: $197 lifetime each ($397 bundle offer available)
- **Subscription Tiers**:
  - Free: $0
  - Pro: $29/month / $290/year / $699 lifetime
  - Business: $79/month / $790/year / $1999 lifetime

### Quick Setup Script

Run `./setup-stripe-cli.sh` for guided setup.

### Sync Scripts

```bash
# Sync apps to Stripe Products
STRIPE_SECRET_KEY=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=... npx tsx scripts/sync-stripe-products.ts

# Sync pricing plans to Stripe
STRIPE_SECRET_KEY=... npx tsx scripts/sync-stripe-pricing.ts
```

### Useful Commands

- `stripe login` - Authenticate with Stripe
- `stripe listen` - Forward webhooks to localhost
- `stripe run` - Execute Stripe Sigma queries
- `stripe config` - View configuration

### Status

Run `stripe whoami` to verify authentication status.