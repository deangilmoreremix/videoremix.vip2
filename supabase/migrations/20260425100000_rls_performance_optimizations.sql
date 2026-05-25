-- =============================================================================
-- RLS Performance Optimizations
-- Apply these indexes and optimizations to improve query performance
-- =============================================================================

-- Add missing indexes for commonly queried columns in RLS policies
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_active ON user_app_access(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_app_access_app_active ON user_app_access(app_slug, is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user ON user_dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- Optimize RLS policy functions to reduce evaluation overhead
-- Replace expensive subqueries with direct lookups where possible

-- Create a more efficient version of the user access check function
CREATE OR REPLACE FUNCTION public.user_has_app_access_fast(app_slug_param text)
RETURNS boolean AS $$
BEGIN
  -- Direct lookup instead of subquery for better performance
  RETURN EXISTS (
    SELECT 1 FROM user_app_access uaa
    WHERE uaa.user_id = auth.uid()
    AND uaa.app_slug = app_slug_param
    AND uaa.is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Optimize the is_super_admin function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_super_admin_fast(check_user_id uuid DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  target_user_id uuid := COALESCE(check_user_id, auth.uid());
BEGIN
  -- Direct lookup with early exit for better performance
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = target_user_id
    AND ur.role = 'super_admin'
    AND ur.is_active = true
    AND ur.tenant_id = '00000000-0000-0000-0000-000000000001'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Add composite indexes for multi-column RLS queries
CREATE INDEX IF NOT EXISTS idx_user_app_access_combined ON user_app_access(user_id, app_slug, is_active, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_combined ON user_roles(user_id, role, is_active, tenant_id);

-- Optimize frequently accessed tables with covering indexes
CREATE INDEX IF NOT EXISTS idx_apps_active_slug ON apps(is_active, slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_catalog_active ON products_catalog(is_active) WHERE is_active = true;

-- Add partial indexes for active records only (reduces index size and improves performance)
CREATE INDEX IF NOT EXISTS idx_user_app_access_active_only ON user_app_access(user_id, app_slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_active_only ON user_roles(user_id, role) WHERE is_active = true;

-- Optimize the videos table indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_videos_user_active ON videos(user_id, status, created_at DESC) WHERE status IN ('completed', 'uploaded');
CREATE INDEX IF NOT EXISTS idx_videos_public_featured ON videos(is_public, is_featured, status, created_at DESC) WHERE is_public = true AND status = 'completed';

-- Add query performance hints
COMMENT ON INDEX idx_user_app_access_user_active IS 'Optimizes user app access queries in RLS policies';
COMMENT ON INDEX idx_user_roles_user_role IS 'Optimizes user role checks in RLS policies';
COMMENT ON FUNCTION user_has_app_access_fast(text) IS 'Faster version of user_has_app_access with direct lookup';
COMMENT ON FUNCTION is_super_admin_fast(uuid) IS 'Faster version of is_super_admin without recursion';

-- Analyze the database to update statistics for the query planner
ANALYZE user_app_access;
ANALYZE user_roles;
ANALYZE user_dashboard_preferences;
ANALYZE user_achievements;
ANALYZE apps;
ANALYZE videos;</content>
<parameter name="filePath">supabase/migrations/20260425100000_rls_performance_optimizations.sql