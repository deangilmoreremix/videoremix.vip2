-- Create videos table if not exists with app_slug for multi-tenant support
CREATE TABLE IF NOT EXISTS videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  app_slug text REFERENCES apps(slug),
  title text,
  description text,
  original_filename text,
  file_path text,
  thumbnail_path text,
  file_size bigint,
  mime_type text,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add app_slug column if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'app_slug') THEN
    ALTER TABLE videos ADD COLUMN app_slug text REFERENCES apps(slug);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage own videos' AND polrelid = 'videos'::regclass) THEN
    CREATE POLICY "Users can manage own videos"
      ON videos
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_app ON videos(app_slug);
