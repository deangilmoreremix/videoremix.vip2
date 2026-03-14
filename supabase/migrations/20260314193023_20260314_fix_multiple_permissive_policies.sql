
/*
  # Consolidate multiple permissive SELECT policies

  ## Summary
  Multiple permissive policies for the same role and action are evaluated with
  OR logic by Postgres, but each policy is planned independently, causing
  repeated auth function evaluations. This migration consolidates duplicate
  SELECT (and UPDATE) policies into single policies with combined conditions.

  ## Affected Tables
  - access_revocation_log: merged super_admin + own SELECT
  - access_tiers: merged admin + active SELECT
  - apps: merged admin + active SELECT
  - import_products: merged admin + mapped SELECT
  - import_user_records: merged admin + own SELECT
  - organization_members: merged owner + own SELECT
  - organizations: merged member + owner SELECT
  - product_app_mappings: merged admin + active SELECT
  - products_catalog: merged super_admin + active SELECT
  - purchases: merged super_admin + own SELECT
  - stripe_entitlements: merged super_admin + own SELECT
  - subscription_status: merged super_admin + own SELECT
  - user_app_access: merged super_admin + own SELECT
  - user_profiles: merged super_admin + own SELECT
  - user_roles: merged super_admin + own SELECT
  - videos: merged public + own + admin SELECT; merged user + admin UPDATE
*/

-- ============================================================
-- access_revocation_log
-- ============================================================
DROP POLICY IF EXISTS "Super admins can read all revocation logs" ON public.access_revocation_log;
DROP POLICY IF EXISTS "Users can read own revocation logs" ON public.access_revocation_log;
DROP POLICY IF EXISTS "Users can read revocation logs" ON public.access_revocation_log;

CREATE POLICY "Users can read revocation logs"
  ON public.access_revocation_log FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

-- ============================================================
-- access_tiers
-- ============================================================
DROP POLICY IF EXISTS "Users can view active tiers" ON public.access_tiers;

CREATE POLICY "Users can view active tiers"
  ON public.access_tiers FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin', 'super_admin'])
    )
  );

-- ============================================================
-- apps
-- ============================================================
DROP POLICY IF EXISTS "Users can view apps" ON public.apps;

CREATE POLICY "Users can view apps"
  ON public.apps FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin', 'super_admin'])
    )
  );

-- ============================================================
-- import_products
-- ============================================================
DROP POLICY IF EXISTS "Users can view mapped products" ON public.import_products;

CREATE POLICY "Users can view mapped products"
  ON public.import_products FOR SELECT
  TO authenticated
  USING (
    is_mapped = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  );

-- ============================================================
-- import_user_records
-- ============================================================
DROP POLICY IF EXISTS "Users can view own import records" ON public.import_user_records;

CREATE POLICY "Users can view own import records"
  ON public.import_user_records FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  );

-- ============================================================
-- organization_members
-- ============================================================
DROP POLICY IF EXISTS "Org owners can view all memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view memberships" ON public.organization_members;

CREATE POLICY "Users can view memberships"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR organization_id IN (
      SELECT id FROM organizations
      WHERE organizations.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- organizations
-- ============================================================
DROP POLICY IF EXISTS "Organization members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR id IN (
      SELECT organization_id FROM organization_members
      WHERE organization_members.user_id = (SELECT auth.uid())
        AND organization_members.is_active = true
    )
  );

-- ============================================================
-- product_app_mappings
-- ============================================================
DROP POLICY IF EXISTS "Users can view active mappings" ON public.product_app_mappings;

CREATE POLICY "Users can view active mappings"
  ON public.product_app_mappings FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  );

-- ============================================================
-- products_catalog
-- ============================================================
DROP POLICY IF EXISTS "Users can read products" ON public.products_catalog;

CREATE POLICY "Users can read products"
  ON public.products_catalog FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

-- ============================================================
-- purchases
-- ============================================================
DROP POLICY IF EXISTS "Users can read purchases" ON public.purchases;

CREATE POLICY "Users can read purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

-- ============================================================
-- stripe_entitlements
-- ============================================================
DROP POLICY IF EXISTS "Users can read entitlements" ON public.stripe_entitlements;

CREATE POLICY "Users can read entitlements"
  ON public.stripe_entitlements FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

-- ============================================================
-- subscription_status
-- ============================================================
DROP POLICY IF EXISTS "Users can read subscription status" ON public.subscription_status;

CREATE POLICY "Users can read subscription status"
  ON public.subscription_status FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

-- ============================================================
-- user_app_access
-- ============================================================
DROP POLICY IF EXISTS "Users can read app access" ON public.user_app_access;

CREATE POLICY "Users can read app access"
  ON public.user_app_access FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

-- ============================================================
-- user_profiles
-- ============================================================
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;

CREATE POLICY "Users can view profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  );

-- ============================================================
-- user_roles
-- ============================================================
DROP POLICY IF EXISTS "Super admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;

CREATE POLICY "Users can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles ur2
      WHERE ur2.user_id = (SELECT auth.uid())
        AND ur2.role = 'super_admin'
    )
  );

-- ============================================================
-- videos — merge two SELECT policies and two UPDATE policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read public videos" ON public.videos;
DROP POLICY IF EXISTS "Users can read videos" ON public.videos;

CREATE POLICY "Users can read videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (is_public = true AND status = 'completed')
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage homepage display settings" ON public.videos;
DROP POLICY IF EXISTS "Users can update videos" ON public.videos;

CREATE POLICY "Users can update videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['super_admin', 'admin'])
    )
  );
