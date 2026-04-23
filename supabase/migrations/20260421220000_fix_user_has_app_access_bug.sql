-- =============================================================================
-- FIX: Critical logical bug in user_has_app_access function
-- 
-- BUG: Line 168 had "AND app_slug = app_slug" which always returns true
-- This allowed ANY authenticated user to access ANY application
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_has_app_access(p_app_slug text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_app_access 
    WHERE user_id = auth.uid() 
    AND app_slug = p_app_slug 
    AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Fix the invite_user_to_app function that had a typo (user_is_app_access instead of user_is_app_admin)
CREATE OR REPLACE FUNCTION public.invite_user_to_app(
   p_app_id uuid,
   p_email text,
   p_role user_app_role DEFAULT 'viewer',
   pExpiresInDays int DEFAULT 7
)
RETURNS uuid AS $$
   DECLARE
     v_invitation_token text;
     v_invitation_id uuid;
     v_user_id uuid;
   BEGIN
     -- Only app admins can invite users
     IF NOT public.user_is_app_admin((SELECT slug FROM apps WHERE id = p_app_id LIMIT 1)) THEN
       RAISE EXCEPTION 'You do not have admin access to this application';
     END IF;
     
     -- Generate invitation token
     v_invitation_token := encode(gen_random_bytes(32), 'hex');
     
     -- Check if user exists
     SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
     
     -- Create invitation record
     INSERT INTO user_app_access (
       user_id, app_id, status, invited_by,
       invitation_token, invitation_expires_at,
       created_at, updated_at
     )
     VALUES (
       v_user_id, p_app_id, 'pending', auth.uid(),
       v_invitation_token, now() + (pExpiresInDays || ' days')::interval,
       now(), now()
     )
     RETURNING id INTO v_invitation_id;
     
     RETURN v_invitation_id;
   END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_has_app_access(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_user_to_app(uuid, text, user_app_role, int) TO authenticated;

-- Fix all RLS policies that use recursive user_roles queries
-- Replace them with the is_super_admin() function that was created earlier

-- Fix app_usage_analytics policy
DROP POLICY IF EXISTS "Admins can view app usage" ON app_usage_analytics;
CREATE POLICY "Admins can view app usage" ON app_usage_analytics FOR SELECT TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

-- Fix revenue_analytics policy
DROP POLICY IF EXISTS "Admins can view revenue" ON revenue_analytics;
CREATE POLICY "Admins can view revenue" ON revenue_analytics FOR SELECT TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

-- Fix app_features policy
DROP POLICY IF EXISTS "Admins can manage features" ON app_features;
CREATE POLICY "Admins can manage features" ON app_features FOR ALL TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

-- Fix user_feature_interactions policy
DROP POLICY IF EXISTS "Admins can view all interactions" ON user_feature_interactions;
CREATE POLICY "Admins can view all interactions" ON user_feature_interactions FOR SELECT TO authenticated 
USING (is_super_admin() OR EXISTS (
  SELECT 1 FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('owner', 'admin')
  AND is_active = true
));

SELECT 'Fixed critical user_has_app_access authorization bypass bug' as status;
