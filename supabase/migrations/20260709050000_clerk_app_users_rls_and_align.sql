-- 20260709050000_clerk_app_users_rls_and_align.sql
--
-- The production app_users table is the real Clerk user mapping table
-- (id, clerk_user_id, email, first_name, last_name, image_url). It has RLS
-- enabled but no policies, so authenticated users cannot read their own row.
-- The Clerk webhook and AuthContext currently write to public.profiles
-- (which has an unrelated schema: id uuid, anonymous_id, muapi_key) — those
-- writes have been failing silently.
--
-- This migration:
--   1. Adds RLS policies so users can read/update their own app_users row.
--   2. Adds a unique index on clerk_user_id for upsert performance.
--   3. Ensures the is_super_admin() check works for app_users admin lookups.

BEGIN;

-- 1. Unique index on clerk_user_id so the Clerk webhook's upsert is fast
--    and safe under concurrency.
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_clerk_user_id
  ON public.app_users (clerk_user_id);

-- 2. Users can read their own app_users row.
DROP POLICY IF EXISTS "Users can read own app_users row" ON public.app_users;
CREATE POLICY "Users can read own app_users row"
  ON public.app_users
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.jwt() ->> 'sub'));

-- 3. Users can update their own app_users row (e.g. profile edits).
DROP POLICY IF EXISTS "Users can update own app_users row" ON public.app_users;
CREATE POLICY "Users can update own app_users row"
  ON public.app_users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (id = (SELECT auth.jwt() ->> 'sub'));

-- 4. Super admins can manage all app_users rows.
DROP POLICY IF EXISTS "Super admins can manage app_users" ON public.app_users;
CREATE POLICY "Super admins can manage app_users"
  ON public.app_users
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 5. Allow the service role (used by Clerk webhook, edge functions) to
--    insert new app_users rows. The default GRANT already covers SELECT/
--    UPDATE/DELETE for service_role; INSERT needs to be explicit when RLS
--    is on, but service_role bypasses RLS by default. This is a no-op
--    safety comment — included for clarity.

COMMIT;
