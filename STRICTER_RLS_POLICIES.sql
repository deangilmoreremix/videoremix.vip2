-- ============================================================================
-- STRICTER RLS POLICIES FOR SUPABASE
-- ============================================================================
-- Run these policies in Supabase Dashboard → SQL Editor
-- These add additional security layers on top of existing RLS
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES (if not already enabled)
-- ============================================================================

ALTER TABLE IF EXISTS apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS benefits_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pricing_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. APPS TABLE - Stricter Policies
-- ============================================================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Public apps are viewable by everyone" ON apps;
DROP POLICY IF EXISTS "Users can insert their own apps" ON apps;
DROP POLICY IF EXISTS "Users can update their own apps" ON apps;
DROP POLICY IF EXISTS "Admins can do everything" ON apps;

-- Public apps (approved) - view only
CREATE POLICY "Public apps are viewable by everyone"
ON apps FOR SELECT
TO anon, authenticated
USING (
  status = 'approved'
  AND (published IS TRUE OR auth.uid() = user_id)
);

-- Users can view their own apps
CREATE POLICY "Users can view own apps"
ON apps FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own apps (limited)
CREATE POLICY "Users can insert own apps"
ON apps FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own apps (status must remain pending or rejected)
CREATE POLICY "Users can update own apps"
ON apps FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('pending', 'rejected')
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'rejected')
);

-- Admin role can do everything
CREATE POLICY "Admins can manage apps"
ON apps FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- 3. VIDEOS TABLE - Stricter Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own videos" ON videos;
DROP POLICY IF EXISTS "Public videos are viewable" ON videos;
DROP POLICY IF EXISTS "Users can manage own videos" ON videos;

-- Users can view own videos
CREATE POLICY "Users can view own videos"
ON videos FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_public = true
  OR user_id IN (
    SELECT user_id FROM apps WHERE user_id = auth.uid()
  )
);

-- Users can insert own videos
CREATE POLICY "Users can insert own videos"
ON videos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own videos (except status)
CREATE POLICY "Users can update own videos"
ON videos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status NOT IN ('processing', 'completed')
);

-- Admin can manage all videos
CREATE POLICY "Admins can manage all videos"
ON videos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- 4. PURCHASES TABLE - Stricter Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON purchases;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
ON purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role (via webhook) can insert purchases
CREATE POLICY "Service can insert purchases"
ON purchases FOR INSERT
TO service_role
WITH CHECK (true);

-- Admin can view all purchases
CREATE POLICY "Admins can view all purchases"
ON purchases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

-- Users cannot update or delete purchases (prevent tampering)
CREATE POLICY "Prevent purchase modification"
ON purchases FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent purchase deletion"
ON purchases FOR DELETE
TO authenticated
USING (false);

-- ============================================================================
-- 5. SUBSCRIPTIONS TABLE - Stricter Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

-- Users can view own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

-- Prevent users from modifying subscriptions
CREATE POLICY "Prevent subscription modification"
ON subscriptions FOR UPDATE
TO authenticated
USING (false);

-- ============================================================================
-- 6. RATE LIMITING (Basic)
-- ============================================================================

-- Create a function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id uuid,
  table_name text,
  max_requests int,
  time_window interval
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  request_count bigint;
BEGIN
  EXECUTE format(
    'SELECT COUNT(*) FROM %I WHERE user_id = $1 AND created_at > now() - $2',
    table_name
  ) INTO request_count USING user_id, time_window;
  
  RETURN request_count < max_requests;
END;
$$;

-- ============================================================================
-- 7. CONTENT TABLES - Public Read, Admin Write Only
-- ============================================================================

DROP POLICY IF EXISTS "Public content is viewable" ON hero_content;
DROP POLICY IF EXISTS "Public content is viewable" ON benefits_features;
DROP POLICY IF EXISTS "Public content is viewable" ON testimonials;
DROP POLICY IF EXISTS "Public content is viewable" ON faqs;
DROP POLICY IF EXISTS "Public content is viewable" ON pricing_plans;

-- Enable read for anon/authenticated on content tables
CREATE POLICY "Public content is viewable" ON hero_content FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Public content is viewable" ON benefits_features FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Public content is viewable" ON testimonials FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Public content is viewable" ON faqs FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Public content is viewable" ON pricing_plans FOR SELECT TO anon, authenticated USING (enabled = true);

-- Only admins can modify content
CREATE POLICY "Admins can manage content" ON hero_content FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage content" ON benefits_features FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage content" ON testimonials FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage content" ON faqs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage content" ON pricing_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
);

-- ============================================================================
-- 8. AUDIT LOGGING (Track all changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Everyone can view audit logs (for transparency)
CREATE POLICY "Audit logs are viewable by admins" ON audit_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
);

-- Only service role can insert (via triggers)
CREATE POLICY "Service can insert audit logs" ON audit_log FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================================
-- 9. TRIGGER FOR AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, user_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to sensitive tables
DROP TRIGGER IF EXISTS audit_apps ON apps;
DROP TRIGGER IF EXISTS audit_purchases ON purchases;
DROP TRIGGER IF EXISTS audit_subscriptions ON subscriptions;

CREATE TRIGGER audit_apps
AFTER INSERT OR UPDATE OR DELETE ON apps
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_purchases
AFTER INSERT OR UPDATE OR DELETE ON purchases
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_subscriptions
AFTER INSERT OR UPDATE OR DELETE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- 10. SECURITY: PREVENT ID ENUMERATION
-- ============================================================================

-- Add a random UUID prefix to records to prevent ID enumeration
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS public_id uuid DEFAULT gen_random_uuid();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS public_id uuid DEFAULT gen_random_uuid();

-- Create unique indexes on public_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_public_id ON purchases(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_public_id ON subscriptions(public_id);

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Run this query to verify all policies:
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Check audit log:
-- SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;
