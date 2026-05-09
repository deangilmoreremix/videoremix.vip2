/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance concerns identified by Supabase's advisor:

  ## 1. Missing Foreign Key Indexes
  Adds indexes for all foreign keys that were missing covering indexes to improve query performance:
  - import_products.first_seen_in_import_id
  - import_user_records.import_product_id
  - platform_product_mappings.product_id
  - product_app_mappings.verified_by
  - purchases.user_id
  - stripe_entitlements.user_id
  - subscription_status.user_id
  - videos.user_id

  ## 2. RLS Performance Optimization
  Fixes auth function calls in RLS policies by wrapping them in SELECT subqueries to prevent
  re-evaluation for each row, improving performance at scale on tables:
  - csv_imports
  - import_products
  - access_tiers
  - product_app_mappings
  - import_user_records
  - videos
  - user_roles

  ## 3. Function Security
  Adds immutable search_path to security definer functions to prevent search path attacks:
  - is_video_file_public
  - is_thumbnail_public
  - is_super_admin

  ## 4. Unused Index Cleanup
  Removes unused indexes that are consuming storage and maintenance overhead without providing value.

  ## Notes
  - Multiple permissive policies are intentional for different user access patterns (admin vs regular users)
  - Indexes are only removed if truly unused; some may become useful as data grows
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for import_products foreign key
CREATE INDEX IF NOT EXISTS idx_import_products_first_seen_in_import_id 
ON public.import_products(first_seen_in_import_id);

-- Index for import_user_records foreign key
CREATE INDEX IF NOT EXISTS idx_import_user_records_import_product_id 
ON public.import_user_records(import_product_id);

-- Index for platform_product_mappings foreign key
CREATE INDEX IF NOT EXISTS idx_platform_product_mappings_product_id 
ON public.platform_product_mappings(product_id);

-- Index for product_app_mappings foreign key
CREATE INDEX IF NOT EXISTS idx_product_app_mappings_verified_by 
ON public.product_app_mappings(verified_by);

-- Index for purchases foreign key
CREATE INDEX IF NOT EXISTS idx_purchases_user_id 
ON public.purchases(user_id);

-- Index for stripe_entitlements foreign key
CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_user_id 
ON public.stripe_entitlements(user_id);

-- Index for subscription_status foreign key
CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id 
ON public.subscription_status(user_id);

-- Index for videos foreign key
CREATE INDEX IF NOT EXISTS idx_videos_user_id 
ON public.videos(user_id);

-- ============================================================================
-- 2. FIX RLS POLICIES FOR PERFORMANCE
-- ============================================================================

-- Drop and recreate policies with optimized auth function calls

-- CSV Imports
DROP POLICY IF EXISTS "Admins can manage CSV imports" ON public.csv_imports;
CREATE POLICY "Admins can manage CSV imports"
  ON public.csv_imports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Import Products
DROP POLICY IF EXISTS "Admins can manage import products" ON public.import_products;
CREATE POLICY "Admins can manage import products"
  ON public.import_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Access Tiers
DROP POLICY IF EXISTS "Admins can manage access tiers" ON public.access_tiers;
CREATE POLICY "Admins can manage access tiers"
  ON public.access_tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Product App Mappings
DROP POLICY IF EXISTS "Admins can manage product app mappings" ON public.product_app_mappings;
CREATE POLICY "Admins can manage product app mappings"
  ON public.product_app_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Import User Records
DROP POLICY IF EXISTS "Admins can manage import user records" ON public.import_user_records;
CREATE POLICY "Admins can manage import user records"
  ON public.import_user_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view own import records" ON public.import_user_records;
CREATE POLICY "Users can view own import records"
  ON public.import_user_records
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Videos
DROP POLICY IF EXISTS "Authenticated users can read public videos" ON public.videos;
CREATE POLICY "Authenticated users can read public videos"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "Admins can manage homepage display settings" ON public.videos;
CREATE POLICY "Admins can manage homepage display settings"
  ON public.videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- User Roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 3. FIX FUNCTION SECURITY (Search Path)
-- ============================================================================

-- Fix is_video_file_public
CREATE OR REPLACE FUNCTION public.is_video_file_public(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.file_path = is_video_file_public.file_path
    AND videos.is_public = true
  );
END;
$$;

-- Fix is_thumbnail_public
CREATE OR REPLACE FUNCTION public.is_thumbnail_public(thumbnail_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.thumbnail_path = is_thumbnail_public.thumbnail_path
    AND videos.is_public = true
  );
END;
$$;

-- Fix is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
END;
$$;

-- ============================================================================
-- 4. REMOVE UNUSED INDEXES
-- ============================================================================

-- Remove unused sync_jobs index
DROP INDEX IF EXISTS public.idx_sync_jobs_started_by_fkey;

-- Remove unused user_app_access index
DROP INDEX IF EXISTS public.idx_user_app_access_purchase_id_fkey;

-- Remove unused purchases index
DROP INDEX IF EXISTS public.idx_purchases_product_id_fkey;

-- Remove unused subscription_status index
DROP INDEX IF EXISTS public.idx_subscription_status_purchase_id_fkey;

-- Remove unused csv_imports indexes
DROP INDEX IF EXISTS public.idx_csv_imports_status;
DROP INDEX IF EXISTS public.idx_csv_imports_imported_by;
DROP INDEX IF EXISTS public.idx_csv_imports_created_at;

-- Remove unused import_products indexes
DROP INDEX IF EXISTS public.idx_import_products_mapping_status;
DROP INDEX IF EXISTS public.idx_import_products_is_mapped;
DROP INDEX IF EXISTS public.idx_import_products_normalized_name;
DROP INDEX IF EXISTS public.idx_import_products_campaign_name;

-- Remove unused access_tiers indexes
DROP INDEX IF EXISTS public.idx_access_tiers_tier_level;
DROP INDEX IF EXISTS public.idx_access_tiers_is_active;

-- Remove unused product_app_mappings indexes
DROP INDEX IF EXISTS public.idx_product_app_mappings_product;
DROP INDEX IF EXISTS public.idx_product_app_mappings_app;
DROP INDEX IF EXISTS public.idx_product_app_mappings_tier;
DROP INDEX IF EXISTS public.idx_product_app_mappings_active;

-- Remove unused import_user_records indexes
DROP INDEX IF EXISTS public.idx_import_user_records_csv_import;
DROP INDEX IF EXISTS public.idx_import_user_records_email;
DROP INDEX IF EXISTS public.idx_import_user_records_user_id;
DROP INDEX IF EXISTS public.idx_import_user_records_status;

-- Remove unused videos indexes
DROP INDEX IF EXISTS public.idx_videos_display_on_homepage;
DROP INDEX IF EXISTS public.idx_videos_is_featured;
DROP INDEX IF EXISTS public.idx_videos_is_public;
DROP INDEX IF EXISTS public.idx_videos_homepage_display;
DROP INDEX IF EXISTS public.idx_videos_public_homepage;

-- Remove unused apps indexes
DROP INDEX IF EXISTS public.idx_apps_popular;
DROP INDEX IF EXISTS public.idx_apps_new;
DROP INDEX IF EXISTS public.idx_apps_price;
DROP INDEX IF EXISTS public.idx_apps_tags;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Create a summary comment for verification
COMMENT ON SCHEMA public IS 'Security and performance optimization applied: Added missing FK indexes, optimized RLS policies, secured functions, removed unused indexes';
