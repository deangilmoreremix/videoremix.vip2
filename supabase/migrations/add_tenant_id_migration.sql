-- =============================================================================
-- Multi-Tenant Migration: Add tenant_id to all tables
-- =============================================================================
-- This migration adds tenant_id column to all tables for multi-tenancy support
-- and updates RLS policies accordingly

-- =============================================================================
-- STEP 1: Create tenants table (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text DEFAULT '',
  is_active boolean DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add default tenant
INSERT INTO tenants (id, name, slug, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default', true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- STEP 2: Add tenant_id to existing tables
-- =============================================================================

-- Core tables - add tenant_id
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;

-- Multi-tenant app tables
ALTER TABLE apps ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE access_tiers ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE user_app_access ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;

-- Subscriptions & Purchases
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;

-- Content tables
ALTER TABLE videos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;

-- Landing page content
ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE benefits_features ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 3: Set default tenant_id for existing records (where NULL)
-- =============================================================================

UPDATE user_roles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE admin_profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE apps SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE access_tiers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE user_app_access SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE subscriptions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE purchases SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE videos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hero_content SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE benefits_features SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- =============================================================================
-- STEP 4: Add NOT NULL constraint after setting defaults
-- =============================================================================

ALTER TABLE user_roles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE admin_profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE apps ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE access_tiers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_app_access ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE purchases ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE videos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE hero_content ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE benefits_features ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================================================
-- STEP 5: Create indexes for tenant_id
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_tenant ON admin_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apps_tenant ON apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_tiers_tenant ON access_tiers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_tenant ON user_app_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tenant ON purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_videos_tenant ON videos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hero_content_tenant ON hero_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_benefits_features_tenant ON benefits_features(tenant_id);

-- =============================================================================
-- STEP 6: Enable RLS and create tenant-based policies
-- =============================================================================

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenants table
DROP POLICY IF EXISTS "Users can view their tenant" ON tenants;
CREATE POLICY "Users can view their tenant" ON tenants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage tenants" ON tenants;
CREATE POLICY "Service role can manage tenants" ON tenants
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on all user tables and add tenant policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits_features ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 7: Create tenant isolation functions
-- =============================================================================

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION auth.has_tenant_access(p_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND tenant_id = p_tenant_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- STEP 8: Create tenant-scoped RLS policies
-- =============================================================================

-- Policy: Users can only see data from their tenant
DROP POLICY IF EXISTS "Tenant isolation - user_roles" ON user_roles;
CREATE POLICY "Tenant isolation - user_roles" ON user_roles
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - admin_profiles" ON admin_profiles;
CREATE POLICY "Tenant isolation - admin_profiles" ON admin_profiles
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - profiles" ON profiles;
CREATE POLICY "Tenant isolation - profiles" ON profiles
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - apps" ON apps;
CREATE POLICY "Tenant isolation - apps" ON apps
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - access_tiers" ON access_tiers;
CREATE POLICY "Tenant isolation - access_tiers" ON access_tiers
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - user_app_access" ON user_app_access;
CREATE POLICY "Tenant isolation - user_app_access" ON user_app_access
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - subscriptions" ON subscriptions;
CREATE POLICY "Tenant isolation - subscriptions" ON subscriptions
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - purchases" ON purchases;
CREATE POLICY "Tenant isolation - purchases" ON purchases
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - videos" ON videos;
CREATE POLICY "Tenant isolation - videos" ON videos
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - hero_content" ON hero_content;
CREATE POLICY "Tenant isolation - hero_content" ON hero_content
  FOR ALL USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation - benefits_features" ON benefits_features;
CREATE POLICY "Tenant isolation - benefits_features" ON benefits_features
  FOR ALL USING (tenant_id = auth.user_tenant_id());

-- Service role bypass for all tables
DROP POLICY IF EXISTS "Service role bypass - user_roles" ON user_roles;
CREATE POLICY "Service role bypass - user_roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - admin_profiles" ON admin_profiles;
CREATE POLICY "Service role bypass - admin_profiles" ON admin_profiles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - profiles" ON profiles;
CREATE POLICY "Service role bypass - profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - apps" ON apps;
CREATE POLICY "Service role bypass - apps" ON apps
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - access_tiers" ON access_tiers;
CREATE POLICY "Service role bypass - access_tiers" ON access_tiers
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - user_app_access" ON user_app_access;
CREATE POLICY "Service role bypass - user_app_access" ON user_app_access
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - subscriptions" ON subscriptions;
CREATE POLICY "Service role bypass - subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - purchases" ON purchases;
CREATE POLICY "Service role bypass - purchases" ON purchases
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - videos" ON videos;
CREATE POLICY "Service role bypass - videos" ON videos
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - hero_content" ON hero_content;
CREATE POLICY "Service role bypass - hero_content" ON hero_content
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass - benefits_features" ON benefits_features;
CREATE POLICY "Service role bypass - benefits_features" ON benefits_features
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- DONE!
-- =============================================================================
