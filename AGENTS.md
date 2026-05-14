# AGENTS.md

## Stripe CLI Setup

### Installation

The Stripe CLI is required for local webhook testing and development.

**Already installed:** `~/.local/bin/stripe` (v1.40.9)

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
```

### Quick Setup Script

Run `./setup-stripe-cli.sh` for guided setup.

### Useful Commands

- `stripe login` - Authenticate with Stripe
- `stripe listen` - Forward webhooks to localhost
- `stripe run` - Execute Stripe Sigma queries
- `stripe config` - View configuration