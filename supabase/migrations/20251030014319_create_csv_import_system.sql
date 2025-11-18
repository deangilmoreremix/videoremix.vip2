/*
  # CSV Import and Product-to-App Access Management System

  ## Overview
  This migration creates a comprehensive system for importing CSV files containing user purchase data
  and manually mapping products to apps with tiered access levels.

  ## New Tables Created
  
  1. **csv_imports**
     - Tracks all CSV file imports with metadata
     - Stores import results, statistics, and error logs
     - Enables import history and audit trail
  
  2. **import_products**
     - Stores unique products discovered from CSV imports
     - Tracks which CSV import introduced each product
     - Links to campaigns and maintains product metadata
  
  3. **access_tiers**
     - Defines access levels (Basic, Standard, Premium, Ultimate, etc.)
     - Configurable tier hierarchy and feature definitions
     - Reusable across different product-app mappings
  
  4. **product_app_mappings**
     - Manual mapping between products and apps with access tiers
     - Many-to-many relationship (one product can grant access to multiple apps)
     - Tracks mapping verification status and confidence scores
  
  5. **import_user_records**
     - Individual user records from CSV imports
     - Links users to their purchases from specific imports
     - Enables tracking which CSV introduced which user
  
  ## Security
  - RLS enabled on all tables
  - Admin-only access for management operations
  - Authenticated user read access where appropriate
*/

-- CSV Imports table: Track all CSV uploads
CREATE TABLE IF NOT EXISTS csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_name text NOT NULL,
  filename text NOT NULL,
  file_size bigint DEFAULT 0,
  import_source text DEFAULT 'manual',
  
  -- Import status and progress
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_rows integer DEFAULT 0,
  processed_rows integer DEFAULT 0,
  successful_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  
  -- Statistics
  unique_products_found integer DEFAULT 0,
  new_products_added integer DEFAULT 0,
  new_users_created integer DEFAULT 0,
  existing_users_updated integer DEFAULT 0,
  
  -- Metadata and logs
  csv_headers jsonb DEFAULT '[]'::jsonb,
  column_mappings jsonb DEFAULT '{}'::jsonb,
  error_log jsonb DEFAULT '[]'::jsonb,
  import_summary jsonb DEFAULT '{}'::jsonb,
  
  -- Tracking
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Import Products table: Unique products from CSV files
CREATE TABLE IF NOT EXISTS import_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  normalized_name text NOT NULL,
  campaign_name text,
  
  -- Discovery and tracking
  first_seen_in_import_id uuid REFERENCES csv_imports(id) ON DELETE SET NULL,
  total_occurrences integer DEFAULT 1,
  unique_user_count integer DEFAULT 0,
  
  -- Mapping status
  is_mapped boolean DEFAULT false,
  mapping_status text DEFAULT 'unmapped' CHECK (mapping_status IN ('unmapped', 'pending_review', 'mapped', 'ignored')),
  
  -- Product metadata
  product_type text DEFAULT 'unknown' CHECK (product_type IN ('subscription', 'one_time', 'bundle', 'upgrade', 'unknown')),
  inferred_billing_cycle text CHECK (inferred_billing_cycle IN ('monthly', 'yearly', 'lifetime', 'one_time', null)),
  
  -- Additional context
  similar_products jsonb DEFAULT '[]'::jsonb,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(normalized_name)
);

-- Access Tiers table: Define access levels
CREATE TABLE IF NOT EXISTS access_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL UNIQUE,
  tier_level integer NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text DEFAULT '',
  
  -- Tier features and limits
  features_included jsonb DEFAULT '[]'::jsonb,
  usage_limits jsonb DEFAULT '{}'::jsonb,
  
  -- Styling and display
  badge_color text DEFAULT '#3B82F6',
  icon_name text DEFAULT 'star',
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product-App Mappings table: Manual mapping with tiers
CREATE TABLE IF NOT EXISTS product_app_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_product_id uuid NOT NULL REFERENCES import_products(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  access_tier_id uuid NOT NULL REFERENCES access_tiers(id) ON DELETE RESTRICT,
  
  -- Mapping metadata
  mapping_confidence numeric DEFAULT 1.0 CHECK (mapping_confidence >= 0 AND mapping_confidence <= 1),
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  
  -- Configuration
  is_active boolean DEFAULT true,
  auto_grant_access boolean DEFAULT true,
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(import_product_id, app_id)
);

-- Import User Records table: Track users from CSV imports
CREATE TABLE IF NOT EXISTS import_user_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_import_id uuid NOT NULL REFERENCES csv_imports(id) ON DELETE CASCADE,
  
  -- User information from CSV
  customer_name text,
  customer_email text NOT NULL,
  campaign text,
  product_name text NOT NULL,
  
  -- Linked entities
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  import_product_id uuid REFERENCES import_products(id) ON DELETE SET NULL,
  
  -- Processing status
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
  error_message text,
  
  -- CSV row data
  row_number integer,
  raw_data jsonb DEFAULT '{}'::jsonb,
  
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_csv_imports_status ON csv_imports(status);
CREATE INDEX IF NOT EXISTS idx_csv_imports_imported_by ON csv_imports(imported_by);
CREATE INDEX IF NOT EXISTS idx_csv_imports_created_at ON csv_imports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_products_mapping_status ON import_products(mapping_status);
CREATE INDEX IF NOT EXISTS idx_import_products_is_mapped ON import_products(is_mapped);
CREATE INDEX IF NOT EXISTS idx_import_products_normalized_name ON import_products(normalized_name);
CREATE INDEX IF NOT EXISTS idx_import_products_campaign_name ON import_products(campaign_name);

CREATE INDEX IF NOT EXISTS idx_access_tiers_tier_level ON access_tiers(tier_level);
CREATE INDEX IF NOT EXISTS idx_access_tiers_is_active ON access_tiers(is_active);

CREATE INDEX IF NOT EXISTS idx_product_app_mappings_product ON product_app_mappings(import_product_id);
CREATE INDEX IF NOT EXISTS idx_product_app_mappings_app ON product_app_mappings(app_id);
CREATE INDEX IF NOT EXISTS idx_product_app_mappings_tier ON product_app_mappings(access_tier_id);
CREATE INDEX IF NOT EXISTS idx_product_app_mappings_active ON product_app_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_import_user_records_csv_import ON import_user_records(csv_import_id);
CREATE INDEX IF NOT EXISTS idx_import_user_records_email ON import_user_records(customer_email);
CREATE INDEX IF NOT EXISTS idx_import_user_records_user_id ON import_user_records(user_id);
CREATE INDEX IF NOT EXISTS idx_import_user_records_status ON import_user_records(processing_status);

-- Insert default access tiers
INSERT INTO access_tiers (tier_name, tier_level, display_name, description, badge_color, icon_name)
VALUES
  ('basic', 1, 'Basic', 'Essential features for getting started', '#6B7280', 'shield'),
  ('standard', 2, 'Standard', 'Enhanced features for regular users', '#3B82F6', 'star'),
  ('premium', 3, 'Premium', 'Advanced features with priority support', '#8B5CF6', 'crown'),
  ('ultimate', 4, 'Ultimate', 'Full access to all features and benefits', '#F59E0B', 'sparkles')
ON CONFLICT (tier_name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_app_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_user_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for csv_imports
CREATE POLICY "Admins can manage CSV imports"
  ON csv_imports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for import_products
CREATE POLICY "Admins can manage import products"
  ON import_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can view mapped products"
  ON import_products FOR SELECT
  TO authenticated
  USING (is_mapped = true);

-- RLS Policies for access_tiers
CREATE POLICY "Admins can manage access tiers"
  ON access_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can view active tiers"
  ON access_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for product_app_mappings
CREATE POLICY "Admins can manage product app mappings"
  ON product_app_mappings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can view active mappings"
  ON product_app_mappings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for import_user_records
CREATE POLICY "Admins can manage import user records"
  ON import_user_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can view own import records"
  ON import_user_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
