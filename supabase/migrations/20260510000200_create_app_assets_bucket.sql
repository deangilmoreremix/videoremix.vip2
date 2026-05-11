-- Create app-assets storage bucket for app thumbnails
DO $$
BEGIN
  -- Insert bucket if not exists
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('app-assets', 'app-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  ON CONFLICT (id) DO NOTHING;

  -- Create policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public can read app-assets') THEN
    CREATE POLICY "Public can read app-assets"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'app-assets');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role can manage app-assets') THEN
    CREATE POLICY "Service role can manage app-assets"
      ON storage.objects FOR ALL
      TO service_role
      USING (bucket_id = 'app-assets');
  END IF;
END $$;
