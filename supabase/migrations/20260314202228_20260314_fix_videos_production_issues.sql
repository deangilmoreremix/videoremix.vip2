
/*
  # Fix videos table production issues

  ## Summary
  Three production issues fixed:

  1. Missing indexes on videos table
     - `file_path` and `thumbnail_path` are queried by the `is_video_file_public` and
       `is_thumbnail_public` RLS helper functions on every storage access. Without indexes
       these cause sequential full-table scans on every file read/write operation.
     - `(is_public, status)` composite index optimises the public video listing queries
       used on the homepage and public gallery.

  2. Helper functions marked VOLATILE instead of STABLE
     - `is_video_file_public` and `is_thumbnail_public` are security-definer functions
       called inside storage RLS policies. They were VOLATILE (default), meaning Postgres
       cannot cache or reuse results within a single query/transaction. Marking them STABLE
       allows the planner to call them once per unique input per query, significantly
       reducing load under concurrent storage requests.

  3. No changes to data — index-only and function-signature changes.
*/

-- ============================================================
-- 1. Add missing indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_videos_file_path
  ON public.videos (file_path);

CREATE INDEX IF NOT EXISTS idx_videos_thumbnail_path
  ON public.videos (thumbnail_path);

CREATE INDEX IF NOT EXISTS idx_videos_is_public_status
  ON public.videos (is_public, status);

-- ============================================================
-- 2. Fix function volatility: VOLATILE -> STABLE
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_video_file_public(file_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.is_thumbnail_public(thumb_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Re-grant execute permissions (CREATE OR REPLACE resets them)
GRANT EXECUTE ON FUNCTION public.is_video_file_public(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_thumbnail_public(text) TO anon, authenticated, service_role;
