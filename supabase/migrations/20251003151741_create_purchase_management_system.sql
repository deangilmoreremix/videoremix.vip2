/*
  # Purchase Management System

  ## Overview
  This migration creates a comprehensive system for managing purchases from multiple payment platforms
  (PayKickstart, Stripe, Zaxxa) and mapping them to app access for users.

  ## 1. New Tables

  ### products_catalog
  Master catalog of all products/apps available for purchase
  - `id` (uuid, primary key)
  - `name` (text) - Product display name
  - `slug` (text, unique) - URL-friendly identifier matching apps
  - `sku` (text, unique, nullable) - Stock Keeping Unit
  - `description` (text)
  - `product_type` (text) - 'subscription' or 'one_time'
  - `apps_granted` (jsonb) - Array of app slugs this product grants access to
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### platform_product_mappings
  Links payment platform product IDs to our products catalog
  - `id` (uuid, primary key)
  - `product_id` (uuid) - References products_catalog
  - `platform` (text) - 'paykickstart', 'stripe', or 'zaxxa'
  - `platform_product_id` (text) - Product ID in the payment platform
  - `platform_product_name` (text) - Product name in the payment platform
  - `match_confidence` (numeric) - Confidence score for automatic matches (0-1)
  - `manually_verified` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### purchases
  All purchase transactions from all platforms
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable) - References auth.users (null if user not found)
  - `email` (text) - Customer email from purchase
  - `platform` (text) - 'paykickstart', 'stripe', or 'zaxxa'
  - `platform_transaction_id` (text, unique) - Transaction ID from platform
  - `platform_customer_id` (text) - Customer ID in payment platform
  - `product_id` (uuid, nullable) - References products_catalog
  - `product_name` (text) - Product name from platform
  - `product_sku` (text, nullable) - SKU from platform
  - `amount` (numeric)
  - `currency` (text)
  - `status` (text) - 'completed', 'pending', 'refunded', 'failed'
  - `subscription_id` (text, nullable) - For recurring subscriptions
  - `is_subscription` (boolean)
  - `purchase_date` (timestamptz)
  - `webhook_data` (jsonb) - Full webhook payload for debugging
  - `processed` (boolean) - Whether access has been granted
  - `processed_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### user_app_access
  Tracks which apps each user can access
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References auth.users
  - `app_slug` (text) - Matches app slug from products_catalog
  - `purchase_id` (uuid, nullable) - References purchases
  - `access_type` (text) - 'subscription', 'lifetime', 'trial'
  - `granted_at` (timestamptz)
  - `expires_at` (timestamptz, nullable) - For subscriptions and trials
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### subscription_status
  Tracks subscription lifecycle for recurring purchases
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References auth.users
  - `purchase_id` (uuid) - References purchases
  - `platform` (text)
  - `platform_subscription_id` (text, unique)
  - `status` (text) - 'active', 'cancelled', 'expired', 'payment_failed'
  - `current_period_start` (timestamptz)
  - `current_period_end` (timestamptz)
  - `cancel_at_period_end` (boolean)
  - `cancelled_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### webhook_logs
  Logs all incoming webhooks for debugging and replay
  - `id` (uuid, primary key)
  - `platform` (text)
  - `event_type` (text)
  - `webhook_payload` (jsonb)
  - `processing_status` (text) - 'pending', 'processed', 'failed', 'retry'
  - `error_message` (text, nullable)
  - `retry_count` (integer)
  - `processed_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can read their own access data
  - Only super_admins can manage products and mappings
  - Webhook logs accessible only to super_admins

  ## 3. Important Notes
  - All timestamps use timestamptz for timezone awareness
  - JSON fields store complete webhook data for audit trail
  - Unique constraints prevent duplicate purchases
  - Foreign keys cascade on user deletion for GDPR compliance
*/

-- Create products_catalog table
CREATE TABLE IF NOT EXISTS products_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sku text UNIQUE,
  description text DEFAULT '',
  product_type text NOT NULL DEFAULT 'one_time' CHECK (product_type IN ('subscription', 'one_time')),
  apps_granted jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platform_product_mappings table
CREATE TABLE IF NOT EXISTS platform_product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products_catalog(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('paykickstart', 'stripe', 'zaxxa')),
  platform_product_id text NOT NULL,
  platform_product_name text NOT NULL,
  match_confidence numeric DEFAULT 1.0 CHECK (match_confidence >= 0 AND match_confidence <= 1),
  manually_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, platform_product_id)
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('paykickstart', 'stripe', 'zaxxa')),
  platform_transaction_id text NOT NULL,
  platform_customer_id text,
  product_id uuid REFERENCES products_catalog(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'refunded', 'failed')),
  subscription_id text,
  is_subscription boolean DEFAULT false,
  purchase_date timestamptz DEFAULT now(),
  webhook_data jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, platform_transaction_id)
);

-- Create user_app_access table
CREATE TABLE IF NOT EXISTS user_app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_slug text NOT NULL,
  purchase_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  access_type text NOT NULL DEFAULT 'lifetime' CHECK (access_type IN ('subscription', 'lifetime', 'trial')),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, app_slug)
);

-- Create subscription_status table
CREATE TABLE IF NOT EXISTS subscription_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('paykickstart', 'stripe', 'zaxxa')),
  platform_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'payment_failed')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('paykickstart', 'stripe', 'zaxxa')),
  event_type text NOT NULL,
  webhook_payload jsonb NOT NULL,
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'retry')),
  error_message text,
  retry_count integer DEFAULT 0,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_platform ON purchases(platform);
CREATE INDEX IF NOT EXISTS idx_purchases_processed ON purchases(processed);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id ON user_app_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_app_slug ON user_app_access(app_slug);
CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id ON subscription_status(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_platform_mappings_product_id ON platform_product_mappings(product_id);

-- Enable RLS
ALTER TABLE products_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products_catalog
CREATE POLICY "Anyone can read active products"
  ON products_catalog FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage products"
  ON products_catalog FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- RLS Policies for platform_product_mappings
CREATE POLICY "Super admins can read all mappings"
  ON platform_product_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage mappings"
  ON platform_product_mappings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- RLS Policies for purchases
CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage purchases"
  ON purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- RLS Policies for user_app_access
CREATE POLICY "Users can read own app access"
  ON user_app_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all app access"
  ON user_app_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage app access"
  ON user_app_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- RLS Policies for subscription_status
CREATE POLICY "Users can read own subscription status"
  ON subscription_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all subscription status"
  ON subscription_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage subscription status"
  ON subscription_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- RLS Policies for webhook_logs
CREATE POLICY "Super admins can read all webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage webhook logs"
  ON webhook_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_catalog_updated_at
  BEFORE UPDATE ON products_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_product_mappings_updated_at
  BEFORE UPDATE ON platform_product_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_app_access_updated_at
  BEFORE UPDATE ON user_app_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_status_updated_at
  BEFORE UPDATE ON subscription_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
