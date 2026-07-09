-- Clerk + Supabase alignment: make Clerk the single source of identity.
-- Re-key user_roles to Clerk user IDs and update is_super_admin() to read
-- the current user from the Clerk JWT's `sub` claim.

-- 1. Drop the foreign key from user_roles.user_id to auth.users (Clerk IDs
--    are not in auth.users).
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 1b. Drop the is_super_admin() functions and EVERY public RLS policy.
--     PostgreSQL refuses ALTER TYPE on a column referenced by a policy
--     definition (directly or transitively via the admin policies that
--     subquery user_roles). Phase 2 recreates the policies for the 24
--     tracked tables using the Clerk JWT `sub`. **Any policy on a public
--     table NOT covered by Phase 2 will need to be re-applied manually
--     after this migration completes.** (If you have such policies, run
--     `supabase db pull` BEFORE this migration to save them.)
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

DO $$
DECLARE r record; dropped_count int := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
    dropped_count := dropped_count + 1;
  END LOOP;
  RAISE NOTICE 'Dropped % public RLS policies (Phase 2 will recreate the tracked ones).', dropped_count;
END $$;

-- 2. Change user_id from uuid to text to hold Clerk user IDs (e.g. user_xxx).
ALTER TABLE public.user_roles
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3. Re-key the super_admin row for dean: remove the old Supabase-auth row
--    and insert one keyed by his Clerk user ID.
DELETE FROM public.user_roles
WHERE user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';

INSERT INTO public.user_roles (user_id, role, tenant_id)
VALUES ('user_3GCYhAM45YR25BIO7SHu2M1NGmZ', 'super_admin', NULL)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 4. Update is_super_admin() (no-arg) to read the current user from the
--    Clerk JWT's `sub` claim instead of Supabase's auth.uid().
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = (SELECT auth.jwt() ->> 'sub')
      AND role = 'super_admin'
  );
$$;

-- 5. Update the uuid variant to cast (legacy: still used in a few policies
--    that pass a Supabase auth uuid). After the type change, user_id is
--    text, so compare against the text representation.
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id::text
      AND role = 'super_admin'
  );
$$;

-- 6. Update the "Users can read own role" policy to use the Clerk JWT sub
--    so a signed-in Clerk user can read their own role row.
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.jwt() ->> 'sub'));

-- Grant execute on the updated functions to the relevant roles.
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, anon;
