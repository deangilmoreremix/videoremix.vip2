-- =============================================================================
-- Storage Bucket Setup for VideoRemixVIP
-- Run this in Supabase Dashboard > Storage > New bucket
-- Or use the Storage API
-- =============================================================================

-- Storage buckets needed:
-- 1. app-assets - For app icons, images, thumbnails
-- 2. user-uploads - For user uploaded videos
-- 3. training-videos - For training video content
-- 4. webinar-replays - For webinar replay content

-- To create via SQL, you would need to use the storage.objects table
-- But the recommended way is via the Supabase Dashboard or API

-- Here's the SQL to set up storage if you have the storage schema:

/*
-- App Assets Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('app-assets', 'app-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'], now(), now())
ON CONFLICT (id) DO NOTHING;

-- User Uploads Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('user-uploads', 'user-uploads', false, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime'], now(), now())
ON CONFLICT (id) DO NOTHING;

-- Training Videos Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('training-videos', 'training-videos', true, 1073741824, ARRAY['video/mp4', 'video/webm', 'video/quicktime'], now(), now())
ON CONFLICT (id) DO NOTHING;

-- Webinar Replays Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('webinar-replays', 'webinar-replays', true, 2147483648, ARRAY['video/mp4', 'video/webm', 'video/quicktime'], now(), now())
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- App Assets: Public read, authenticated write
CREATE POLICY "Public read app-assets" ON storage.objects FOR SELECT USING (bucket_id = 'app-assets');
CREATE POLICY "Authenticated upload app-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'app-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated update app-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'app-assets' AND auth.role() = 'authenticated');

-- User Uploads: Owner read/write
CREATE POLICY "Owner read user-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner upload user-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner update user-uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete user-uploads" ON storage.objects FOR DELETE USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Training Videos: Public read, admin write
CREATE POLICY "Public read training-videos" ON storage.objects FOR SELECT USING (bucket_id = 'training-videos');
CREATE POLICY "Service role upload training-videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'training-videos');
CREATE POLICY "Service role update training-videos" ON storage.objects FOR UPDATE USING (bucket_id = 'training-videos');

-- Webinar Replays: Public read, admin write
CREATE POLICY "Public read webinar-replays" ON storage.objects FOR SELECT USING (bucket_id = 'webinar-replays');
CREATE POLICY "Service role upload webinar-replays" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'webinar-replays');
CREATE POLICY "Service role update webinar-replays" ON storage.objects FOR UPDATE USING (bucket_id = 'webinar-replays');
*/

-- To create buckets, use the Supabase Dashboard:
-- 1. Go to Storage
-- 2. Click "New Bucket"
-- 3. Create these buckets with the settings above
