/*
  # Add Entitlements and Sync Tracking

  ## Overview
  Extends the purchase management system to support Stripe Entitlements and track
  historical customer data synchronization.

  ## 1. New Tables

  ### stripe_entitlements
  Tracks Stripe entitlements for features/products
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References auth.users
  - `stripe_customer_id` (text) - Stripe customer ID
  - `feature_id` (text) - Stripe feature identifier
  - `lookup_key` (text) - Human-readable feature key
  - `entitlement_id` (text, unique) - Stripe entitlement ID
  - `is_active` (boolean)
  - `last_synced_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### sync_jobs
  Tracks bulk data synchronization jobs (like importing all Stripe customers)
  - `id` (uuid, primary key)
  - `job_type` (text) - 'stripe_customers', 'paykickstart_customers', etc.
  - `status` (text) - 'pending', 'running', 'completed', 'failed'
  - `total_records` (integer) - Total records to process
  - `processed_records` (integer) - Records processed so far
  - `successful_records` (integer) - Successfully imported
  - `failed_records` (integer) - Failed to import
  - `error_log` (jsonb) - Array of errors encountered
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `started_by` (uuid) - References auth.users (admin who started it)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Table Modifications

  ### purchases (add new columns)
  - `stripe_payment_intent_id` (text) - Link to Stripe Payment Intent
  - `stripe_invoice_id` (text) - Link to Stripe Invoice
  - `stripe_customer_id` (text) - Stripe customer ID
  - `synced_from_stripe` (boolean) - Whether this was imported vs webhook

  ## 3. Security
  - Enable RLS on new tables
  - Only super_admins can view sync jobs
  - Users can view their own entitlements

  ## 4. Indexes
  - Index on stripe_customer_id for faster lookups
  - Index on sync job status for admin dashboard
*/

-- Create stripe_entitlements table
CREATE TABLE IF NOT EXISTS stripe_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text NOT NULL,
  feature_id text NOT NULL,
  lookup_key text,
  entitlement_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sync_jobs table
CREATE TABLE IF NOT EXISTS sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('stripe_customers', 'stripe_entitlements', 'paykickstart_customers', 'zaxxa_customers', 'manual_import')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  total_records integer DEFAULT 0,
  processed_records integer DEFAULT 0,
  successful_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to purchases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN stripe_payment_intent_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'stripe_invoice_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN stripe_invoice_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'synced_from_stripe'
  ) THEN
    ALTER TABLE purchases ADD COLUMN synced_from_stripe boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_user_id ON stripe_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_customer_id ON stripe_entitlements(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_active ON stripe_entitlements(is_active);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_type ON sync_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_customer_id ON purchases(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE stripe_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_entitlements
CREATE POLICY "Users can read own entitlements"
  ON stripe_entitlements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all entitlements"
  ON stripe_entitlements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage entitlements"
  ON stripe_entitlements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- RLS Policies for sync_jobs
CREATE POLICY "Super admins can read all sync jobs"
  ON sync_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage sync jobs"
  ON sync_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create trigger for updated_at on stripe_entitlements
CREATE TRIGGER update_stripe_entitlements_updated_at
  BEFORE UPDATE ON stripe_entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on sync_jobs
CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON sync_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
