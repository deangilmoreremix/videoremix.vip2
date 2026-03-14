
/*
  # Fix RLS auth.uid() initialization plan performance

  ## Summary
  Replaces bare `auth.uid()` calls with `(select auth.uid())` in RLS policies
  to prevent per-row re-evaluation. This is a significant performance improvement
  at scale as auth functions are called once per query instead of once per row.

  ## Affected Tables & Policies
  - access_revocation_log: 2 SELECT policies
  - app_feature_links: DELETE, INSERT, UPDATE policies
  - user_profiles: SELECT (x2), INSERT, UPDATE policies
  - organizations: SELECT (x2), INSERT, UPDATE policies
  - organization_members: SELECT (x2), INSERT, UPDATE policies

  ## Notes
  Each policy is dropped and recreated with the corrected auth function syntax.
*/

-- ============================================================
-- access_revocation_log
-- ============================================================
DROP POLICY IF EXISTS "Super admins can read all revocation logs" ON public.access_revocation_log;
DROP POLICY IF EXISTS "Users can read own revocation logs" ON public.access_revocation_log;

CREATE POLICY "Super admins can read all revocation logs"
  ON public.access_revocation_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can read own revocation logs"
  ON public.access_revocation_log FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- app_feature_links
-- ============================================================
DROP POLICY IF EXISTS "Admins can delete feature links" ON public.app_feature_links;
DROP POLICY IF EXISTS "Admins can insert feature links" ON public.app_feature_links;
DROP POLICY IF EXISTS "Admins can update feature links" ON public.app_feature_links;

CREATE POLICY "Admins can delete feature links"
  ON public.app_feature_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin', 'super_admin'])
    )
  );

CREATE POLICY "Admins can insert feature links"
  ON public.app_feature_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin', 'super_admin'])
    )
  );

CREATE POLICY "Admins can update feature links"
  ON public.app_feature_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin', 'super_admin'])
    )
  );

-- ============================================================
-- user_profiles
-- ============================================================
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

CREATE POLICY "Super admins can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- organizations
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can view their organization" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Organization members can view their organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE organization_members.user_id = (SELECT auth.uid())
        AND organization_members.is_active = true
    )
  );

CREATE POLICY "Organization owners can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Organization owners can view their organization"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- ============================================================
-- organization_members
-- ============================================================
DROP POLICY IF EXISTS "Org owners can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can view all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;

CREATE POLICY "Org owners can add members"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE organizations.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Org owners can update members"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE organizations.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE organizations.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Org owners can view all memberships"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE organizations.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view own memberships"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
