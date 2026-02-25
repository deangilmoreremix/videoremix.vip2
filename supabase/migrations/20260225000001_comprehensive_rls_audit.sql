-- ============================================================================
-- COMPREHENSIVE ROW LEVEL SECURITY AUDIT AND HARDENING
-- ============================================================================
-- This migration provides complete RLS coverage for all tables in the database.
-- It assumes attackers will manipulate API calls directly and prevents:
-- - IDOR (Insecure Direct Object Reference) attacks
-- - Ownership field manipulation
-- - Cross-user data access
-- - Unauthorized data modification
--
-- Run this migration in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================================================

-- Create a helper function to check if user is admin (avoids repetition)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('super_admin', 'admin')
  );
$$;

-- Create a helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'super_admin'
  );
$$;

-- Create a function to get current user ID (evaluates once per query)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- ============================================================================
-- SECTION 2: TABLE INVENTORY AND RLS STATUS
-- ============================================================================

-- Query to check RLS status on all tables (run this to verify)
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- SECTION 3: USER-OWNED TABLES (user_id column)
-- These tables have rows owned by individual users via user_id column
-- ============================================================================

-- ============================================================================
-- 3.1: user_roles - User role assignments
-- Ownership: user_id (the user whose role this is)
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON user_roles;

-- SELECT: Users can read their own role, admins can read all
CREATE POLICY "users_can_read_own_role" ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  );

-- INSERT: Only super admins can create roles
CREATE POLICY "super_admins_can_insert_roles" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- UPDATE: Only super admins can update roles
CREATE POLICY "super_admins_can_update_roles" ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- DELETE: Only super admins can delete roles
CREATE POLICY "super_admins_can_delete_roles" ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- 3.2: admin_profiles - Extended admin user profiles
-- Ownership: user_id
-- ============================================================================

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON admin_profiles;

-- SELECT: Users can read own profile, admins can read all
CREATE POLICY "users_can_read_own_profile" ON admin_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  );

-- INSERT: Users can create their own profile (triggered on signup)
CREATE POLICY "users_can_insert_own_profile" ON admin_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id());

-- UPDATE: Users can update own profile, admins can update all
CREATE POLICY "users_can_update_own_profile" ON admin_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  )
  WITH CHECK (
    user_id = current_user_id()
    OR is_admin()
  );

-- DELETE: Only admins can delete profiles
CREATE POLICY "admins_can_delete_profiles" ON admin_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 3.3: purchases - Purchase transactions
-- Ownership: user_id (the user who made the purchase)
-- CRITICAL: Users must NOT be able to modify purchases (financial data)
-- ============================================================================

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own purchases" ON purchases;
DROP POLICY IF EXISTS "Super admins can read all purchases" ON purchases;
DROP POLICY IF EXISTS "Super admins can manage purchases" ON purchases;
DROP POLICY IF EXISTS "Prevent purchase modification" ON purchases;
DROP POLICY IF EXISTS "Prevent purchase deletion" ON purchases;

-- SELECT: Users can read own purchases, admins can read all
CREATE POLICY "users_can_read_own_purchases" ON purchases
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  );

-- INSERT: Only service role (webhooks) can insert purchases
-- Regular users cannot create purchases directly
CREATE POLICY "service_role_can_insert_purchases" ON purchases
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE: Prevent all updates by users (financial integrity)
CREATE POLICY "prevent_purchase_updates" ON purchases
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Allow service role to update
CREATE POLICY "service_role_can_update_purchases" ON purchases
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: Prevent deletion by users
CREATE POLICY "prevent_purchase_deletion" ON purchases
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- 3.4: user_app_access - App access grants
-- Ownership: user_id
-- CRITICAL: Users must NOT be able to modify their own access
-- ============================================================================

ALTER TABLE user_app_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own app access" ON user_app_access;
DROP POLICY IF EXISTS "Super admins can read all app access" ON user_app_access;
DROP POLICY IF EXISTS "Super admins can manage app access" ON user_app_access;

-- SELECT: Users can read own access, admins can read all
CREATE POLICY "users_can_read_own_access" ON user_app_access
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  );

-- INSERT: Only admins and service role can grant access
CREATE POLICY "admins_can_grant_access" ON user_app_access
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "service_role_can_grant_access" ON user_app_access
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE: Only admins and service role can modify access
CREATE POLICY "admins_can_update_access" ON user_app_access
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "service_role_can_update_access" ON user_app_access
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: Only admins can revoke access
CREATE POLICY "admins_can_revoke_access" ON user_app_access
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 3.5: subscription_status - Subscription tracking
-- Ownership: user_id
-- CRITICAL: Users must NOT be able to modify subscription status
-- ============================================================================

ALTER TABLE subscription_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription status" ON subscription_status;
DROP POLICY IF EXISTS "Super admins can read all subscription status" ON subscription_status;
DROP POLICY IF EXISTS "Super admins can manage subscription status" ON subscription_status;

-- SELECT: Users can read own subscriptions, admins can read all
CREATE POLICY "users_can_read_own_subscriptions" ON subscription_status
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  );

-- INSERT: Only admins and service role
CREATE POLICY "admins_can_create_subscriptions" ON subscription_status
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "service_role_can_create_subscriptions" ON subscription_status
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE: Only admins and service role
CREATE POLICY "admins_can_update_subscriptions" ON subscription_status
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "service_role_can_update_subscriptions" ON subscription_status
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: Only admins
CREATE POLICY "admins_can_delete_subscriptions" ON subscription_status
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 3.6: videos - User video content
-- Ownership: user_id
-- ============================================================================

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own videos" ON videos;
DROP POLICY IF EXISTS "Public videos are viewable" ON videos;
DROP POLICY IF EXISTS "Users can manage own videos" ON videos;
DROP POLICY IF EXISTS "Admins can manage all videos" ON videos;

-- SELECT: Users can view own videos, public videos, admins see all
CREATE POLICY "users_can_view_videos" ON videos
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_public = true
    OR is_admin()
  );

-- Anonymous users can only see public videos
CREATE POLICY "anon_can_view_public_videos" ON videos
  FOR SELECT
  TO anon
  USING (is_public = true);

-- INSERT: Users can create own videos
CREATE POLICY "users_can_create_videos" ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id());

-- UPDATE: Users can update own videos (with restrictions), admins can update all
CREATE POLICY "users_can_update_own_videos" ON videos
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id())
  WITH CHECK (
    user_id = current_user_id()
    -- Prevent users from changing ownership
    AND user_id = (SELECT user_id FROM videos WHERE id = videos.id)
  );

CREATE POLICY "admins_can_update_all_videos" ON videos
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Users can delete own videos, admins can delete all
CREATE POLICY "users_can_delete_own_videos" ON videos
  FOR DELETE
  TO authenticated
  USING (user_id = current_user_id());

CREATE POLICY "admins_can_delete_all_videos" ON videos
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- 3.7: user_dashboard_preferences - User preferences
-- Ownership: user_id
-- ============================================================================

ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read own preferences
CREATE POLICY "users_can_read_own_preferences" ON user_dashboard_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id());

-- INSERT: Users can create own preferences
CREATE POLICY "users_can_create_own_preferences" ON user_dashboard_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id());

-- UPDATE: Users can update own preferences
CREATE POLICY "users_can_update_own_preferences" ON user_dashboard_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- DELETE: Users can delete own preferences
CREATE POLICY "users_can_delete_own_preferences" ON user_dashboard_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = current_user_id());

-- ============================================================================
-- 3.8: user_achievements - User achievement tracking
-- Ownership: user_id
-- ============================================================================

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read own achievements, admins can read all
CREATE POLICY "users_can_read_own_achievements" ON user_achievements
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    OR is_admin()
  );

-- INSERT: Users can create own achievements
CREATE POLICY "users_can_create_own_achievements" ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id());

-- UPDATE: Users can update own achievements
CREATE POLICY "users_can_update_own_achievements" ON user_achievements
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- DELETE: Users can delete own achievements
CREATE POLICY "users_can_delete_own_achievements" ON user_achievements
  FOR DELETE
  TO authenticated
  USING (user_id = current_user_id());

-- ============================================================================
-- SECTION 4: ADMIN-ONLY TABLES
-- These tables are managed exclusively by admins
-- ============================================================================

-- ============================================================================
-- 4.1: products_catalog - Product definitions
-- Ownership: None (admin-managed reference data)
-- ============================================================================

ALTER TABLE products_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active products" ON products_catalog;
DROP POLICY IF EXISTS "Super admins can manage products" ON products_catalog;

-- SELECT: Anyone can read active products
CREATE POLICY "anyone_can_read_active_products" ON products_catalog
  FOR SELECT
  USING (is_active = true);

-- Admins can see all products (including inactive)
CREATE POLICY "admins_can_read_all_products" ON products_catalog
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify products
CREATE POLICY "admins_can_manage_products" ON products_catalog
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.2: platform_product_mappings - Payment platform mappings
-- Ownership: None (admin-managed)
-- ============================================================================

ALTER TABLE platform_product_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read all mappings" ON platform_product_mappings;
DROP POLICY IF EXISTS "Super admins can manage mappings" ON platform_product_mappings;

-- SELECT: Only admins can read
CREATE POLICY "admins_can_read_mappings" ON platform_product_mappings
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify
CREATE POLICY "admins_can_manage_mappings" ON platform_product_mappings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.3: webhook_logs - Webhook event logs
-- Ownership: None (system-managed)
-- ============================================================================

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read all webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "Super admins can manage webhook logs" ON webhook_logs;

-- SELECT: Only admins can read
CREATE POLICY "admins_can_read_webhook_logs" ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- INSERT: Only service role can insert (from webhooks)
CREATE POLICY "service_role_can_insert_webhook_logs" ON webhook_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE/DELETE: Only admins
CREATE POLICY "admins_can_manage_webhook_logs" ON webhook_logs
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.4: csv_imports - CSV import tracking
-- Ownership: None (admin-managed)
-- ============================================================================

ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;

-- SELECT: Only admins
CREATE POLICY "admins_can_read_csv_imports" ON csv_imports
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify
CREATE POLICY "admins_can_manage_csv_imports" ON csv_imports
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.5: import_products - Imported product records
-- Ownership: None (admin-managed)
-- ============================================================================

ALTER TABLE import_products ENABLE ROW LEVEL SECURITY;

-- SELECT: Only admins
CREATE POLICY "admins_can_read_import_products" ON import_products
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify
CREATE POLICY "admins_can_manage_import_products" ON import_products
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.6: access_tiers - Access tier definitions
-- Ownership: None (admin-managed reference data)
-- ============================================================================

ALTER TABLE access_tiers ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can read active tiers
CREATE POLICY "anyone_can_read_active_tiers" ON access_tiers
  FOR SELECT
  USING (is_active = true);

-- Admins can see all
CREATE POLICY "admins_can_read_all_tiers" ON access_tiers
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify
CREATE POLICY "admins_can_manage_tiers" ON access_tiers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.7: product_app_mappings - Product to app mappings
-- Ownership: None (admin-managed)
-- ============================================================================

ALTER TABLE product_app_mappings ENABLE ROW LEVEL SECURITY;

-- SELECT: Only admins
CREATE POLICY "admins_can_read_product_app_mappings" ON product_app_mappings
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify
CREATE POLICY "admins_can_manage_product_app_mappings" ON product_app_mappings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4.8: import_user_records - Imported user records
-- Ownership: None (admin-managed)
-- ============================================================================

ALTER TABLE import_user_records ENABLE ROW LEVEL SECURITY;

-- SELECT: Only admins
CREATE POLICY "admins_can_read_import_users" ON import_user_records
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ALL: Only admins can modify
CREATE POLICY "admins_can_manage_import_users" ON import_user_records
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- SECTION 5: PUBLIC CONTENT TABLES
-- These tables contain public-facing content (read-only for non-admins)
-- ============================================================================

-- Helper function to create public content policies
CREATE OR REPLACE FUNCTION create_public_content_policy(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format('
    ALTER TABLE %I ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public content is viewable" ON %I;
    DROP POLICY IF EXISTS "Admins can manage content" ON %I;
    
    CREATE POLICY "Public content is viewable" ON %I
      FOR SELECT
      TO anon, authenticated
      USING (enabled = true OR is_active = true);
    
    CREATE POLICY "Admins can manage content" ON %I
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  ', table_name, table_name, table_name, table_name, table_name);
END;
$$;

-- Apply to content tables
SELECT create_public_content_policy('hero_content');
SELECT create_public_content_policy('benefits_features');
SELECT create_public_content_policy('testimonials');
SELECT create_public_content_policy('faqs');
SELECT create_public_content_policy('pricing_plans');

-- ============================================================================
-- SECTION 6: APPS TABLE - Special handling
-- Apps can be user-owned or system-managed
-- ============================================================================

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public apps are viewable by everyone" ON apps;
DROP POLICY IF EXISTS "Users can view own apps" ON apps;
DROP POLICY IF EXISTS "Users can insert own apps" ON apps;
DROP POLICY IF EXISTS "Users can update own apps" ON apps;
DROP POLICY IF EXISTS "Admins can manage apps" ON apps;

-- SELECT: Public apps visible to all, users see own apps, admins see all
CREATE POLICY "apps_select_policy" ON apps
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Public approved apps
    (status = 'approved' AND is_public = true)
    -- User's own apps
    OR (user_id = current_user_id())
    -- Admins see all
    OR is_admin()
  );

-- INSERT: Users can create apps (assigned to themselves), admins can create any
CREATE POLICY "apps_insert_policy" ON apps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = current_user_id()
    OR is_admin()
  );

-- UPDATE: Users can update own pending/rejected apps, admins can update all
CREATE POLICY "apps_update_policy" ON apps
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update own non-approved apps
    (user_id = current_user_id() AND status IN ('pending', 'rejected'))
    -- Admins can update all
    OR is_admin()
  )
  WITH CHECK (
    -- Users cannot change ownership
    (user_id = current_user_id() AND user_id = (SELECT user_id FROM apps WHERE id = apps.id))
    OR is_admin()
  );

-- DELETE: Users can delete own pending apps, admins can delete all
CREATE POLICY "apps_delete_policy" ON apps
  FOR DELETE
  TO authenticated
  USING (
    (user_id = current_user_id() AND status = 'pending')
    OR is_admin()
  );

-- ============================================================================
-- SECTION 7: FEATURE TABLES
-- ============================================================================

-- app_features
ALTER TABLE app_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "features_select_policy" ON app_features
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "admins_manage_features" ON app_features
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- feature_benefits
ALTER TABLE feature_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "benefits_select_policy" ON feature_benefits
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "admins_manage_benefits" ON feature_benefits
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- feature_steps
ALTER TABLE feature_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "steps_select_policy" ON feature_steps
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "admins_manage_steps" ON feature_steps
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- app_feature_links
ALTER TABLE app_feature_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_links_select" ON app_feature_links
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_manage_feature_links" ON app_feature_links
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- SECTION 8: ANALYTICS TABLES
-- ============================================================================

-- admin_analytics_events
ALTER TABLE admin_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_analytics_events" ON admin_analytics_events
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_insert_analytics_events" ON admin_analytics_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- daily_analytics_snapshots
ALTER TABLE daily_analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_daily_snapshots" ON daily_analytics_snapshots
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_manage_daily_snapshots" ON daily_analytics_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- app_usage_analytics
ALTER TABLE app_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_usage" ON app_usage_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id() OR is_admin());

CREATE POLICY "service_insert_usage" ON app_usage_analytics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- revenue_analytics
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_revenue" ON revenue_analytics
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_manage_revenue" ON revenue_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SECTION 9: AUDIT AND LOG TABLES
-- ============================================================================

-- audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_audit_log" ON audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_insert_audit_log" ON audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- apps_audit_log
ALTER TABLE apps_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_apps_audit" ON apps_audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_insert_apps_audit" ON apps_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- access_revocation_log
ALTER TABLE access_revocation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_revocation_log" ON access_revocation_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_insert_revocation_log" ON access_revocation_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- user_management_audit
ALTER TABLE user_management_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_user_audit" ON user_management_audit
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_insert_user_audit" ON user_management_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- SECTION 10: SYNC AND ENTITLEMENT TABLES
-- ============================================================================

-- stripe_entitlements
ALTER TABLE stripe_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_entitlements" ON stripe_entitlements
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id() OR is_admin());

CREATE POLICY "service_manage_entitlements" ON stripe_entitlements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- sync_jobs
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_sync_jobs" ON sync_jobs
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "service_manage_sync_jobs" ON sync_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SECTION 11: USER INTERACTION TABLES
-- ============================================================================

-- user_feature_interactions
ALTER TABLE user_feature_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_interactions" ON user_feature_interactions
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id() OR is_admin());

CREATE POLICY "users_create_interactions" ON user_feature_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id());

CREATE POLICY "users_update_own_interactions" ON user_feature_interactions
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- feature_ratings
ALTER TABLE feature_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_ratings" ON feature_ratings
  FOR SELECT
  TO authenticated
  USING (true); -- Ratings are public

CREATE POLICY "users_create_ratings" ON feature_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id());

CREATE POLICY "users_update_own_ratings" ON feature_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

CREATE POLICY "users_delete_own_ratings" ON feature_ratings
  FOR DELETE
  TO authenticated
  USING (user_id = current_user_id());

-- ============================================================================
-- SECTION 12: PERFORMANCE INDEXES FOR RLS
-- ============================================================================

-- These indexes improve RLS policy performance by supporting common query patterns

-- User-owned tables: index on user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id ON user_app_access(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id ON subscription_status(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_prefs_user_id ON user_dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_user_id ON user_feature_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_ratings_user_id ON feature_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_user_id ON stripe_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_app_usage_analytics_user_id ON app_usage_analytics(user_id);

-- Apps table: composite index for common queries
CREATE INDEX IF NOT EXISTS idx_apps_status_public ON apps(status, is_public);
CREATE INDEX IF NOT EXISTS idx_apps_user_status ON apps(user_id, status);

-- Content tables: index on enabled/is_active
CREATE INDEX IF NOT EXISTS idx_hero_content_enabled ON hero_content(enabled);
CREATE INDEX IF NOT EXISTS idx_benefits_features_enabled ON benefits_features(enabled);
CREATE INDEX IF NOT EXISTS idx_testimonials_enabled ON testimonials(enabled);
CREATE INDEX IF NOT EXISTS idx_faqs_enabled ON faqs(enabled);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_enabled ON pricing_plans(enabled);
CREATE INDEX IF NOT EXISTS idx_access_tiers_active ON access_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_products_catalog_active ON products_catalog(is_active);

-- Feature tables
CREATE INDEX IF NOT EXISTS idx_app_features_active ON app_features(is_active);
CREATE INDEX IF NOT EXISTS idx_feature_benefits_active ON feature_benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_feature_steps_active ON feature_steps(is_active);

-- Purchases: index for lookup queries
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_platform ON purchases(platform);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Webhook logs: index for processing
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);

-- Audit logs: index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);

-- ============================================================================
-- SECTION 13: PREVENT IDOR WITH PUBLIC IDs
-- ============================================================================

-- Add public IDs to sensitive tables to prevent ID enumeration attacks
-- These can be used in URLs instead of internal UUIDs

-- Add public_id to purchases if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'public_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN public_id uuid DEFAULT gen_random_uuid();
    CREATE UNIQUE INDEX idx_purchases_public_id ON purchases(public_id);
  END IF;
END $$;

-- Add public_id to subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_status' AND column_name = 'public_id'
  ) THEN
    ALTER TABLE subscription_status ADD COLUMN public_id uuid DEFAULT gen_random_uuid();
    CREATE UNIQUE INDEX idx_subscription_status_public_id ON subscription_status(public_id);
  END IF;
END $$;

-- Add public_id to user_app_access if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_app_access' AND column_name = 'public_id'
  ) THEN
    ALTER TABLE user_app_access ADD COLUMN public_id uuid DEFAULT gen_random_uuid();
    CREATE UNIQUE INDEX idx_user_app_access_public_id ON user_app_access(public_id);
  END IF;
END $$;

-- ============================================================================
-- SECTION 14: TRIGGER TO PREVENT OWNERSHIP MODIFICATION
-- ============================================================================

-- Create a trigger function that prevents users from changing ownership fields
CREATE OR REPLACE FUNCTION prevent_ownership_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id is being changed and the user is not an admin, reject
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    IF NOT is_admin() THEN
      RAISE EXCEPTION 'Cannot modify ownership field (user_id)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to critical tables
DROP TRIGGER IF EXISTS prevent_purchase_ownership_change ON purchases;
CREATE TRIGGER prevent_purchase_ownership_change
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ownership_change();

DROP TRIGGER IF EXISTS prevent_access_ownership_change ON user_app_access;
CREATE TRIGGER prevent_access_ownership_change
  BEFORE UPDATE ON user_app_access
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ownership_change();

DROP TRIGGER IF EXISTS prevent_subscription_ownership_change ON subscription_status;
CREATE TRIGGER prevent_subscription_ownership_change
  BEFORE UPDATE ON subscription_status
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ownership_change();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify RLS is properly configured:

-- 1. Check all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = false;

-- 2. List all policies:
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- 3. Check for tables without policies:
-- SELECT tablename 
-- FROM pg_tables t
-- WHERE t.schemaname = 'public' 
-- AND t.rowsecurity = true
-- AND NOT EXISTS (
--   SELECT 1 FROM pg_policies p 
--   WHERE p.tablename = t.tablename
-- );

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
