
/*
  # Fix storage bucket policies

  ## Summary
  Two issues corrected in storage.objects policies:

  1. Duplicate SELECT policies on the thumbnails bucket for authenticated users:
     - "Anyone can read thumbnails" allows all authenticated users to read every thumbnail
     - "Authenticated can read public thumbnails" is a narrower subset of the same
     Both are permissive SELECT policies evaluated simultaneously, creating unnecessary
     overhead and an overlapping permissive policy. The broader policy is kept and the
     narrower duplicate is removed.

  2. No admin management policies exist across any bucket. Admins need the ability to
     read, update, and delete files across all buckets for content moderation and
     platform management. Four policies are added (one per operation) for each bucket,
     restricted to users whose role is super_admin or admin.

  ## Changes
  - DROP "Authenticated can read public thumbnails" (redundant with "Anyone can read thumbnails")
  - ADD admin SELECT, UPDATE, DELETE policies on videos, thumbnails, user-assets, user-data buckets
  - Admin INSERT is intentionally omitted — admins do not need to upload on behalf of users
*/

-- ============================================================
-- Remove redundant duplicate SELECT policy on thumbnails
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read public thumbnails" ON storage.objects;

-- ============================================================
-- Admin management policies — videos
-- ============================================================
CREATE POLICY "Admins can read all videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update all videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete all videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================
-- Admin management policies — thumbnails
-- ============================================================
CREATE POLICY "Admins can update all thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete all thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================
-- Admin management policies — user-assets
-- ============================================================
CREATE POLICY "Admins can read all user assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update all user assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'user-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete all user assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================
-- Admin management policies — user-data
-- ============================================================
CREATE POLICY "Admins can read all user data files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-data'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update all user data files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-data'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'user-data'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete all user data files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-data'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role IN ('super_admin', 'admin')
    )
  );
