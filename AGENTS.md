# AGENTS.md

## AgentMemory Setup

Persistent memory for all coding agents — remembers your stack, patterns, and decisions across sessions.

**Repository:** https://github.com/rohitg00/agentmemory

### Installation

```bash
# Install globally (recommended)
npm install -g @agentmemory/agentmemory
```

### Start Memory Server

In a separate terminal, run:

```bash
agentmemory
```

This starts the memory server on `http://localhost:3111`. The real-time viewer is at `http://localhost:3113`.

### MCP Server (for all agents)

Add to your environment or `.env` file:

```bash
AGENTMEMORY_URL=http://localhost:3111
AGENTMEMORY_SECRET=  # auto-generated on first start
```

All agents connect to the same memory server via MCP or REST, sharing memory across sessions.

### Verify Setup

```bash
curl http://localhost:3111/agentmemory/health
```

### Key Features

- **95.2% retrieval accuracy** on LongMemEval-S benchmark
- **12 auto-capture hooks** — captures agent actions silently
- **BM25 + vector + graph search** with RRF fusion
- **~170K tokens/year** vs 19.5M+ for full context paste
- **Real-time viewer** at port 3113
- **Multi-agent** — all agents share the same memory server

### Commands

- `agentmemory demo` — seed sample sessions and test recall
- `agentmemory connect <agent>` — wire a specific agent
- `agentmemory stop` — stop the server
- `agentmemory upgrade` — update to latest version

---

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