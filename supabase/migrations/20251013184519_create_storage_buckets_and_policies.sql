/*
  # Create Storage Buckets and Policies

  ## Overview
  Sets up storage buckets for user-generated content with appropriate access policies.

  ## 1. Storage Buckets

  ### videos
  - Stores user-uploaded video files
  - Private bucket with user-specific access

  ### thumbnails
  - Stores video thumbnail images
  - Public bucket for fast access

  ### user-assets
  - General purpose storage for user files (images, documents, etc.)
  - Private bucket with user-specific access

  ### user-data
  - Stores app-specific user data (JSON, CSV, etc.)
  - Private bucket with user-specific access

  ## 2. Security Policies
  - Users can only access their own files
  - Files organized by user_id folder structure
  - Public buckets allow authenticated read access
  - Service role has full access for processing

  ## 3. File Organization
  - Files stored as: {user_id}/{filename}
  - Ensures user isolation and easy cleanup
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('videos', 'videos', false, 524288000, ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']),
  ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('user-assets', 'user-assets', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']),
  ('user-data', 'user-data', false, 10485760, ARRAY['application/json', 'text/csv', 'text/plain', 'application/xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Users can upload own videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for thumbnails bucket (public read)
CREATE POLICY "Anyone can read thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload own thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for user-assets bucket
CREATE POLICY "Users can upload own assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for user-data bucket
CREATE POLICY "Users can upload own data files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-data' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own data files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-data' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own data files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-data' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-data' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own data files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-data' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create videos table if not exists for tracking video metadata
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  description text,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  thumbnail_path text,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  duration numeric,
  file_size bigint,
  mime_type text,
  processing_started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos table
CREATE POLICY "Users can read own videos"
  ON videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can manage all videos
CREATE POLICY "Super admins can read all videos"
  ON videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all videos"
  ON videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();