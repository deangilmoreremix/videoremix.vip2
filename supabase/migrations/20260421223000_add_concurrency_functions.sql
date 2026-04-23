-- =============================================================================
-- CONCURRENCY AND LOCKING FUNCTIONS
-- 
-- Add advisory lock functions for race condition prevention
-- Fix remaining RLS infinite recursion issues
-- =============================================================================

-- Grant access to advisory lock functions for authenticated users
GRANT EXECUTE ON FUNCTION pg_advisory_lock(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_advisory_unlock(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_try_advisory_lock(bigint) TO authenticated;

-- Create helper function for safe locking
CREATE OR REPLACE FUNCTION public.with_advisory_lock(
  p_lock_key bigint,
  p_function text
) RETURNS void AS $$
DECLARE
  v_lock_acquired boolean;
BEGIN
  SELECT pg_try_advisory_lock(p_lock_key) INTO v_lock_acquired;
  
  IF NOT v_lock_acquired THEN
    RAISE EXCEPTION 'Could not acquire lock for operation';
  END IF;
  
  BEGIN
    EXECUTE p_function;
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(p_lock_key);
    RAISE;
  END;
  
  PERFORM pg_advisory_unlock(p_lock_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Fix all remaining recursive RLS policies
-- Replace all instances of subqueries on user_roles with the safe is_super_admin() function

DROP POLICY IF EXISTS "System can manage app usage" ON app_usage_analytics;
CREATE POLICY "System can manage app usage" ON app_usage_analytics FOR ALL TO authenticated 
USING (is_super_admin());

DROP POLICY IF EXISTS "System can manage revenue" ON revenue_analytics;
CREATE POLICY "System can manage revenue" ON revenue_analytics FOR ALL TO authenticated 
USING (is_super_admin());

DROP POLICY IF EXISTS "Admins can manage benefits" ON feature_benefits;
CREATE POLICY "Admins can manage benefits" ON feature_benefits FOR ALL TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "Admins can manage steps" ON feature_steps;
CREATE POLICY "Admins can manage steps" ON feature_steps FOR ALL TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "Admins can manage use cases" ON feature_use_cases;
CREATE POLICY "Admins can manage use cases" ON feature_use_cases FOR ALL TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "Admins can manage FAQs" ON feature_faqs;
CREATE POLICY "Admins can manage FAQs" ON feature_faqs FOR ALL TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "Admins can manage relationships" ON feature_relationships;
CREATE POLICY "Admins can manage relationships" ON feature_relationships FOR ALL TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "Admins can view analytics events" ON admin_analytics_events;
CREATE POLICY "Admins can view analytics events" ON admin_analytics_events FOR SELECT TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "Admins can view daily snapshots" ON daily_analytics_snapshots;
CREATE POLICY "Admins can view daily snapshots" ON daily_analytics_snapshots FOR SELECT TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

DROP POLICY IF EXISTS "System can manage daily snapshots" ON daily_analytics_snapshots;
CREATE POLICY "System can manage daily snapshots" ON daily_analytics_snapshots FOR ALL TO authenticated 
USING (is_super_admin());

-- Fix function search paths for security
ALTER FUNCTION is_super_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_current_tenant_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_app_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_app_role(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_is_app_admin(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_tenant(text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_app(text, text, text, uuid, boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.accept_app_invitation(text) SET search_path = public, pg_temp;

SELECT 'Added concurrency functions and fixed remaining RLS recursion' as status;
