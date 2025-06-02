-- Fix avatar upload functionality
-- This script ensures the image_url bucket can handle avatar uploads

-- 1. Make sure the image_url bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('image_url', 'image_url', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- 3. Create comprehensive policies for avatar uploads

-- Allow authenticated users to upload files to the image_url bucket
CREATE POLICY "Allow authenticated users to upload to image_url"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image_url');

-- Allow public access to view files in the image_url bucket
CREATE POLICY "Allow public access to image_url files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'image_url');

-- Allow authenticated users to update files they own in the image_url bucket
CREATE POLICY "Allow users to update their own image_url files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'image_url' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'image_url');

-- Allow authenticated users to delete files they own in the image_url bucket
CREATE POLICY "Allow users to delete their own image_url files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'image_url' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Update bucket configuration for better file handling
UPDATE storage.buckets
SET 
  file_size_limit = 5242880,  -- 5MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'image_url';

-- 5. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
