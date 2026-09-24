-- Credit system namespace: dedicated credits schema
-- This keeps shared Supabase projects from colliding with other apps.

BEGIN;

-- 1. Dedicated schema for credit system
CREATE SCHEMA IF NOT EXISTS credits;

-- 2. Credit products table - defines packages for sale
CREATE TABLE IF NOT EXISTS credits.credit_products (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  price_usd INTEGER NOT NULL CHECK (price_usd > 0), -- in cents
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Credit balances table - tracks current balance per user per app
CREATE TABLE IF NOT EXISTS credits.credit_balances (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  app_id TEXT NOT NULL,
  balance_credits INTEGER NOT NULL DEFAULT 0 CHECK (balance_credits >= 0),
  total_purchased_credits INTEGER NOT NULL DEFAULT 0 CHECK (total_purchased_credits >= 0),
  total_spent_credits INTEGER NOT NULL DEFAULT 0 CHECK (total_spent_credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, app_id)
);

-- 4. Credit transactions table - logs all credit movements
CREATE TABLE IF NOT EXISTS credits.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  app_id TEXT NOT NULL,
  amount_credits INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after_credits INTEGER NOT NULL CHECK (balance_after_credits >= 0),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'api_usage', 'refund', 'bonus', 'adjustment')),
  source TEXT, -- 'stripe', 'api_proxy', 'admin', etc.
  source_id TEXT, -- Stripe session ID, transaction ID, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_credit_balances_user_app
  ON credits.credit_balances(user_id, app_id);

CREATE INDEX IF NOT EXISTS idx_credits_credit_transactions_user_app
  ON credits.credit_transactions(user_id, app_id);

CREATE INDEX IF NOT EXISTS idx_credits_credit_transactions_created_at
  ON credits.credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credits_credit_transactions_type
  ON credits.credit_transactions(type);

CREATE INDEX IF NOT EXISTS idx_credits_credit_products_app
  ON credits.credit_products(app_id);

-- 6. Seed default credit products for this app
INSERT INTO credits.credit_products (id, app_id, name, slug, description, credits_amount, price_usd, sort_order)
VALUES
  ('starter', 'videoremixvip', 'Starter', 'starter', '500K AI credits - perfect for trying out the platform', 500000, 500, 1),
  ('pro', 'videoremixvip', 'Pro', 'pro', '2.5M AI credits - for regular users and small projects', 2500000, 2000, 2),
  ('business', 'videoremixvip', 'Business', 'business', '8M AI credits - for power users and teams', 8000000, 5000, 3),
  ('enterprise', 'videoremixvip', 'Enterprise', 'enterprise', '35M AI credits - for heavy usage and enterprises', 35000000, 20000, 4)
ON CONFLICT (id) DO NOTHING;

COMMIT;
