/*
  # Security and Performance Optimization

  This migration fixes critical security and performance issues:

  ## 1. Foreign Key Indexes
  - Add indexes for all foreign keys to improve query performance
  - Tables: purchases, subscription_status, sync_jobs, user_app_access

  ## 2. RLS Policy Performance
  - Update all RLS policies to use (select auth.uid()) pattern
  - This prevents re-evaluation of auth functions for each row
  - Significantly improves query performance at scale

  ## 3. Remove Unused Indexes
  - Drop indexes that are not being used to reduce storage and maintenance overhead

  ## 4. Fix Multiple Permissive Policies
  - Consolidate overlapping policies into single efficient policies

  ## 5. Fix Function Search Paths
  - Set immutable search paths for trigger functions
*/

-- ==========================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ==========================================

-- Index for purchases.product_id foreign key
CREATE INDEX IF NOT EXISTS idx_purchases_product_id_fkey 
ON public.purchases(product_id);

-- Index for subscription_status.purchase_id foreign key
CREATE INDEX IF NOT EXISTS idx_subscription_status_purchase_id_fkey 
ON public.subscription_status(purchase_id);

-- Index for sync_jobs.started_by foreign key
CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_by_fkey 
ON public.sync_jobs(started_by);

-- Index for user_app_access.purchase_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_app_access_purchase_id_fkey 
ON public.user_app_access(purchase_id);


-- ==========================================
-- 2. DROP UNUSED INDEXES
-- ==========================================

DROP INDEX IF EXISTS public.idx_stripe_entitlements_user_id;
DROP INDEX IF EXISTS public.idx_stripe_entitlements_customer_id;
DROP INDEX IF EXISTS public.idx_stripe_entitlements_active;
DROP INDEX IF EXISTS public.idx_sync_jobs_status;
DROP INDEX IF EXISTS public.idx_sync_jobs_type;
DROP INDEX IF EXISTS public.idx_purchases_stripe_customer_id;
DROP INDEX IF EXISTS public.idx_purchases_stripe_payment_intent_id;
DROP INDEX IF EXISTS public.idx_purchases_user_id;
DROP INDEX IF EXISTS public.idx_purchases_email;
DROP INDEX IF EXISTS public.idx_purchases_platform;
DROP INDEX IF EXISTS public.idx_purchases_processed;
DROP INDEX IF EXISTS public.idx_user_app_access_user_id;
DROP INDEX IF EXISTS public.idx_user_app_access_app_slug;
DROP INDEX IF EXISTS public.idx_subscription_status_user_id;
DROP INDEX IF EXISTS public.idx_webhook_logs_platform;
DROP INDEX IF EXISTS public.idx_webhook_logs_status;
DROP INDEX IF EXISTS public.idx_platform_mappings_product_id;
DROP INDEX IF EXISTS public.idx_apps_slug;
DROP INDEX IF EXISTS public.idx_apps_category;
DROP INDEX IF EXISTS public.idx_apps_active;
DROP INDEX IF EXISTS public.idx_apps_featured;
DROP INDEX IF EXISTS public.idx_apps_sort_order;
DROP INDEX IF EXISTS public.idx_videos_user_id;
DROP INDEX IF EXISTS public.idx_videos_status;
DROP INDEX IF EXISTS public.idx_videos_created_at;


-- ==========================================
-- 3. FIX RLS POLICIES - USER_ROLES TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- Consolidated SELECT policy
CREATE POLICY "Users can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- Super admin management policies
CREATE POLICY "Super admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 4. FIX RLS POLICIES - ADMIN_PROFILES TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.admin_profiles;

-- Consolidated SELECT policy
CREATE POLICY "Users can read admin profiles"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- INSERT policy
CREATE POLICY "Users can insert own profile"
  ON public.admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- UPDATE policy
CREATE POLICY "Users can update profiles"
  ON public.admin_profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- DELETE policy
CREATE POLICY "Super admins can delete profiles"
  ON public.admin_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 5. FIX RLS POLICIES - PRODUCTS_CATALOG TABLE
-- ==========================================

DROP POLICY IF EXISTS "Super admins can manage products" ON public.products_catalog;
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products_catalog;

-- Consolidated SELECT policy
CREATE POLICY "Users can read products"
  ON public.products_catalog FOR SELECT
  TO authenticated
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- Management policy
CREATE POLICY "Super admins manage products"
  ON public.products_catalog FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 6. FIX RLS POLICIES - PLATFORM_PRODUCT_MAPPINGS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Super admins can read all mappings" ON public.platform_product_mappings;
DROP POLICY IF EXISTS "Super admins can manage mappings" ON public.platform_product_mappings;

-- Consolidated policy
CREATE POLICY "Super admins manage mappings"
  ON public.platform_product_mappings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 7. FIX RLS POLICIES - PURCHASES TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Super admins can read all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Super admins can manage purchases" ON public.purchases;

-- Consolidated SELECT policy
CREATE POLICY "Users can read purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- Management policy
CREATE POLICY "Super admins manage purchases"
  ON public.purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 8. FIX RLS POLICIES - USER_APP_ACCESS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own app access" ON public.user_app_access;
DROP POLICY IF EXISTS "Super admins can read all app access" ON public.user_app_access;
DROP POLICY IF EXISTS "Super admins can manage app access" ON public.user_app_access;

-- Consolidated SELECT policy
CREATE POLICY "Users can read app access"
  ON public.user_app_access FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- Management policy
CREATE POLICY "Super admins manage app access"
  ON public.user_app_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 9. FIX RLS POLICIES - SUBSCRIPTION_STATUS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own subscription status" ON public.subscription_status;
DROP POLICY IF EXISTS "Super admins can read all subscription status" ON public.subscription_status;
DROP POLICY IF EXISTS "Super admins can manage subscription status" ON public.subscription_status;

-- Consolidated SELECT policy
CREATE POLICY "Users can read subscription status"
  ON public.subscription_status FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- Management policy
CREATE POLICY "Super admins manage subscription status"
  ON public.subscription_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 10. FIX RLS POLICIES - WEBHOOK_LOGS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Super admins can read all webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Super admins can manage webhook logs" ON public.webhook_logs;

-- Consolidated policy
CREATE POLICY "Super admins manage webhook logs"
  ON public.webhook_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 11. FIX RLS POLICIES - STRIPE_ENTITLEMENTS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own entitlements" ON public.stripe_entitlements;
DROP POLICY IF EXISTS "Super admins can read all entitlements" ON public.stripe_entitlements;
DROP POLICY IF EXISTS "Super admins can manage entitlements" ON public.stripe_entitlements;

-- Consolidated SELECT policy
CREATE POLICY "Users can read entitlements"
  ON public.stripe_entitlements FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- Management policy
CREATE POLICY "Super admins manage entitlements"
  ON public.stripe_entitlements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 12. FIX RLS POLICIES - SYNC_JOBS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Super admins can read all sync jobs" ON public.sync_jobs;
DROP POLICY IF EXISTS "Super admins can manage sync jobs" ON public.sync_jobs;

-- Consolidated policy
CREATE POLICY "Super admins manage sync jobs"
  ON public.sync_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 13. FIX RLS POLICIES - APPS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Admins can insert apps" ON public.apps;
DROP POLICY IF EXISTS "Admins can update apps" ON public.apps;
DROP POLICY IF EXISTS "Admins can delete apps" ON public.apps;
DROP POLICY IF EXISTS "Anyone can view active apps" ON public.apps;
DROP POLICY IF EXISTS "Authenticated users can view all apps" ON public.apps;

-- SELECT policy
CREATE POLICY "Users can view apps"
  ON public.apps FOR SELECT
  TO authenticated
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- Management policy
CREATE POLICY "Admins manage apps"
  ON public.apps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );


-- ==========================================
-- 14. FIX RLS POLICIES - VIDEOS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can read own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Super admins can read all videos" ON public.videos;
DROP POLICY IF EXISTS "Super admins can manage all videos" ON public.videos;

-- SELECT policy
CREATE POLICY "Users can read videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- INSERT policy
CREATE POLICY "Users can insert videos"
  ON public.videos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete videos"
  ON public.videos FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'super_admin'
    )
  );


-- ==========================================
-- 15. FIX FUNCTION SEARCH PATHS
-- ==========================================

-- Fix update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_apps_updated_at function
DROP FUNCTION IF EXISTS public.update_apps_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_apps_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_catalog_updated_at
  BEFORE UPDATE ON public.products_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_product_mappings_updated_at
  BEFORE UPDATE ON public.platform_product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_app_access_updated_at
  BEFORE UPDATE ON public.user_app_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_status_updated_at
  BEFORE UPDATE ON public.subscription_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_entitlements_updated_at
  BEFORE UPDATE ON public.stripe_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_apps_updated_at();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();