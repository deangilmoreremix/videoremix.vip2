/*
  # Fix Security and Performance Issues - Comprehensive

  1. **Add Missing Foreign Key Indexes**
     - Adds indexes for 8 unindexed foreign keys
     
  2. **Optimize RLS Policies**
     - Updates policies to use (select auth.uid()) for better performance
     
  3. **Remove Unused Indexes**
     - Drops 29 unused indexes to reduce storage overhead
     
  4. **Fix Function Search Paths**
     - Updates security functions with immutable search paths

  ## Performance Impact
  - Improved query performance on foreign key lookups
  - Reduced RLS policy evaluation overhead
  - Lower storage and maintenance costs from removed indexes
*/

-- =====================================================
-- PART 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_import_products_first_seen_in_import_id 
  ON public.import_products(first_seen_in_import_id);

CREATE INDEX IF NOT EXISTS idx_import_user_records_import_product_id 
  ON public.import_user_records(import_product_id);

CREATE INDEX IF NOT EXISTS idx_platform_product_mappings_product_id 
  ON public.platform_product_mappings(product_id);

CREATE INDEX IF NOT EXISTS idx_product_app_mappings_verified_by 
  ON public.product_app_mappings(verified_by);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id 
  ON public.purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_user_id 
  ON public.stripe_entitlements(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id 
  ON public.subscription_status(user_id);

CREATE INDEX IF NOT EXISTS idx_videos_user_id 
  ON public.videos(user_id);

-- =====================================================
-- PART 2: OPTIMIZE RLS POLICIES
-- =====================================================

-- csv_imports
DROP POLICY IF EXISTS "Admins can manage CSV imports" ON public.csv_imports;
CREATE POLICY "Admins can manage CSV imports"
  ON public.csv_imports FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- import_products
DROP POLICY IF EXISTS "Admins can manage import products" ON public.import_products;
CREATE POLICY "Admins can manage import products"
  ON public.import_products FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- access_tiers
DROP POLICY IF EXISTS "Admins can manage access tiers" ON public.access_tiers;
CREATE POLICY "Admins can manage access tiers"
  ON public.access_tiers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- product_app_mappings
DROP POLICY IF EXISTS "Admins can manage product app mappings" ON public.product_app_mappings;
CREATE POLICY "Admins can manage product app mappings"
  ON public.product_app_mappings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- import_user_records - admin policy
DROP POLICY IF EXISTS "Admins can manage import user records" ON public.import_user_records;
CREATE POLICY "Admins can manage import user records"
  ON public.import_user_records FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- import_user_records - user policy
DROP POLICY IF EXISTS "Users can view own import records" ON public.import_user_records;
CREATE POLICY "Users can view own import records"
  ON public.import_user_records FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- videos - public reading policy
DROP POLICY IF EXISTS "Authenticated users can read public videos" ON public.videos;
CREATE POLICY "Authenticated users can read public videos"
  ON public.videos FOR SELECT TO authenticated
  USING (is_public = true AND status = 'completed');

-- videos - admin homepage management
DROP POLICY IF EXISTS "Admins can manage homepage display settings" ON public.videos;
CREATE POLICY "Admins can manage homepage display settings"
  ON public.videos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- user_roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PART 3: DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_sync_jobs_started_by_fkey;
DROP INDEX IF EXISTS public.idx_user_app_access_purchase_id_fkey;
DROP INDEX IF EXISTS public.idx_purchases_product_id_fkey;
DROP INDEX IF EXISTS public.idx_subscription_status_purchase_id_fkey;
DROP INDEX IF EXISTS public.idx_csv_imports_status;
DROP INDEX IF EXISTS public.idx_csv_imports_imported_by;
DROP INDEX IF EXISTS public.idx_csv_imports_created_at;
DROP INDEX IF EXISTS public.idx_import_products_mapping_status;
DROP INDEX IF EXISTS public.idx_import_products_is_mapped;
DROP INDEX IF EXISTS public.idx_import_products_normalized_name;
DROP INDEX IF EXISTS public.idx_import_products_campaign_name;
DROP INDEX IF EXISTS public.idx_access_tiers_tier_level;
DROP INDEX IF EXISTS public.idx_access_tiers_is_active;
DROP INDEX IF EXISTS public.idx_product_app_mappings_product;
DROP INDEX IF EXISTS public.idx_product_app_mappings_app;
DROP INDEX IF EXISTS public.idx_product_app_mappings_tier;
DROP INDEX IF EXISTS public.idx_product_app_mappings_active;
DROP INDEX IF EXISTS public.idx_import_user_records_csv_import;
DROP INDEX IF EXISTS public.idx_import_user_records_email;
DROP INDEX IF EXISTS public.idx_import_user_records_user_id;
DROP INDEX IF EXISTS public.idx_import_user_records_status;
DROP INDEX IF EXISTS public.idx_videos_display_on_homepage;
DROP INDEX IF EXISTS public.idx_videos_is_featured;
DROP INDEX IF EXISTS public.idx_videos_is_public;
DROP INDEX IF EXISTS public.idx_videos_homepage_display;
DROP INDEX IF EXISTS public.idx_videos_public_homepage;
DROP INDEX IF EXISTS public.idx_apps_popular;
DROP INDEX IF EXISTS public.idx_apps_new;
DROP INDEX IF EXISTS public.idx_apps_price;
DROP INDEX IF EXISTS public.idx_apps_tags;

-- =====================================================
-- PART 4: FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Fix is_video_file_public with CASCADE
DROP FUNCTION IF EXISTS public.is_video_file_public(text) CASCADE;
CREATE FUNCTION public.is_video_file_public(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  video_record RECORD;
BEGIN
  SELECT is_public, status INTO video_record
  FROM videos
  WHERE videos.file_path = is_video_file_public.file_path;
  
  RETURN COALESCE(video_record.is_public, false) 
    AND COALESCE(video_record.status, '') = 'completed';
END;
$$;

-- Fix is_thumbnail_public with CASCADE
DROP FUNCTION IF EXISTS public.is_thumbnail_public(text) CASCADE;
CREATE FUNCTION public.is_thumbnail_public(thumb_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  video_record RECORD;
BEGIN
  SELECT is_public, status INTO video_record
  FROM videos
  WHERE thumbnail_path = thumb_path;
  
  RETURN COALESCE(video_record.is_public, false) 
    AND COALESCE(video_record.status, '') = 'completed';
END;
$$;

-- Fix is_super_admin with CASCADE
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
CREATE FUNCTION public.is_super_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = target_user_id
    AND role = 'super_admin'
  );
END;
$$;

-- Recreate storage policies that depend on these functions
DO $$
BEGIN
  -- Public can read public video files
  DROP POLICY IF EXISTS "Public can read public video files" ON storage.objects;
  CREATE POLICY "Public can read public video files"
    ON storage.objects FOR SELECT
    TO public
    USING (
      bucket_id = 'videos' 
      AND is_video_file_public(name)
    );

  -- Authenticated can read public video files
  DROP POLICY IF EXISTS "Authenticated can read public video files" ON storage.objects;
  CREATE POLICY "Authenticated can read public video files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'videos' 
      AND is_video_file_public(name)
    );

  -- Public can read public thumbnails
  DROP POLICY IF EXISTS "Public can read public thumbnails" ON storage.objects;
  CREATE POLICY "Public can read public thumbnails"
    ON storage.objects FOR SELECT
    TO public
    USING (
      bucket_id = 'thumbnails' 
      AND is_thumbnail_public(name)
    );

  -- Authenticated can read public thumbnails
  DROP POLICY IF EXISTS "Authenticated can read public thumbnails" ON storage.objects;
  CREATE POLICY "Authenticated can read public thumbnails"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'thumbnails' 
      AND is_thumbnail_public(name)
    );
END $$;