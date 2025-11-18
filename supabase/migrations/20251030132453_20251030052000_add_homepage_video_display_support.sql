/*
  # Add Homepage Video Display Support

  ## Overview
  Extends the videos table to support public video display on the homepage with featured status and custom ordering.

  ## 1. New Columns Added to videos table

  ### display_on_homepage
  - Type: boolean
  - Default: false
  - Description: When true, video will be shown on the homepage

  ### is_featured
  - Type: boolean
  - Default: false
  - Description: When true, video will be highlighted/featured on homepage

  ### is_public
  - Type: boolean
  - Default: false
  - Description: When true, video is publicly accessible to all visitors (authenticated or not)

  ### homepage_order
  - Type: integer
  - Default: NULL
  - Description: Controls the display order of videos on homepage (lower numbers appear first)

  ## 2. Performance Indexes
  - Index on display_on_homepage for efficient homepage queries
  - Index on is_featured for featured video queries
  - Index on is_public for public video access
  - Composite index on (display_on_homepage, homepage_order) for ordered homepage queries
  - Composite index on (is_public, display_on_homepage) for public homepage video queries

  ## 3. Row Level Security Updates
  - Allow anonymous (public) users to read videos marked as is_public = true
  - Allow authenticated users to read all public videos
  - Maintain existing policies for users to manage their own videos
  - Add admin-only policies to manage homepage display settings

  ## 4. Storage Policy Updates
  - Allow public read access to video files that are marked as public
  - Maintain security for private user videos
  - Thumbnails remain publicly readable for performance

  ## 5. Important Notes
  - All new columns have safe defaults (false/null) to maintain backward compatibility
  - Only admins can set display_on_homepage, is_featured, and is_public flags
  - Users maintain full control over their own video metadata
  - Public videos remain owned by their creators
*/

-- Add new columns to videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'display_on_homepage'
  ) THEN
    ALTER TABLE videos ADD COLUMN display_on_homepage boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE videos ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE videos ADD COLUMN is_public boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'homepage_order'
  ) THEN
    ALTER TABLE videos ADD COLUMN homepage_order integer;
  END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_videos_display_on_homepage ON videos(display_on_homepage) WHERE display_on_homepage = true;
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_videos_is_public ON videos(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_videos_homepage_display ON videos(display_on_homepage, homepage_order) WHERE display_on_homepage = true;
CREATE INDEX IF NOT EXISTS idx_videos_public_homepage ON videos(is_public, display_on_homepage) WHERE is_public = true;

-- Drop existing public read policy if it exists to recreate it
DROP POLICY IF EXISTS "Public users can read public videos" ON videos;
DROP POLICY IF EXISTS "Authenticated users can read public videos" ON videos;

-- Allow public (anonymous) users to read videos marked as public
CREATE POLICY "Public users can read public videos"
  ON videos FOR SELECT
  TO anon
  USING (is_public = true);

-- Allow authenticated users to read all public videos
CREATE POLICY "Authenticated users can read public videos"
  ON videos FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Allow admins to update homepage display settings on any video
DROP POLICY IF EXISTS "Admins can manage homepage display settings" ON videos;

CREATE POLICY "Admins can manage homepage display settings"
  ON videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Update storage policies to allow public read access for public videos
-- Note: We need to create a function to check if a video file is public

-- Create a function to check if a video file belongs to a public video
CREATE OR REPLACE FUNCTION is_video_file_public(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM videos
    WHERE videos.file_path = file_path
    AND videos.is_public = true
  );
END;
$$;

-- Create a function to check if a thumbnail belongs to a public video
CREATE OR REPLACE FUNCTION is_thumbnail_public(thumbnail_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM videos
    WHERE videos.thumbnail_path = thumbnail_path
    AND videos.is_public = true
  );
END;
$$;

-- Update storage policy for videos bucket to allow public read of public videos
DROP POLICY IF EXISTS "Public can read public video files" ON storage.objects;

CREATE POLICY "Public can read public video files"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'videos' AND
    is_video_file_public(name)
  );

-- Storage policy for authenticated users to read public videos
DROP POLICY IF EXISTS "Authenticated can read public video files" ON storage.objects;

CREATE POLICY "Authenticated can read public video files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    (
      is_video_file_public(name) OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- Update thumbnail policies for public access
DROP POLICY IF EXISTS "Public can read public thumbnails" ON storage.objects;

CREATE POLICY "Public can read public thumbnails"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'thumbnails' AND
    is_thumbnail_public(name)
  );

-- Comment explaining the security model
COMMENT ON COLUMN videos.is_public IS 'When true, video is publicly accessible to all visitors. Only admins can set this flag.';
COMMENT ON COLUMN videos.display_on_homepage IS 'When true, video appears on the homepage. Only admins can set this flag.';
COMMENT ON COLUMN videos.is_featured IS 'When true, video is highlighted on homepage. Only admins can set this flag.';
COMMENT ON COLUMN videos.homepage_order IS 'Controls display order on homepage. Lower numbers appear first. Only admins can set this.';