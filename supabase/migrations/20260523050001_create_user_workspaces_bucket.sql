-- Migration: Create user-workspaces bucket for AI app results
-- Run this in Supabase dashboard SQL editor or via CLI

-- Create storage bucket (public: false so only authenticated users can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-workspaces', 'user-workspaces', false, 10485760, NULL::text[])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own files
CREATE POLICY "Users can manage their own workspace files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'user-workspaces' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'user-workspaces' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy: Users can upload to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-workspaces' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-workspaces' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'user-workspaces' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-workspaces' AND auth.uid()::text = (storage.foldername(name))[1]);