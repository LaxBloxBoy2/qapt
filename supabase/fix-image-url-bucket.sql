-- Fix image_url bucket configuration
-- This script ensures the image_url bucket is properly configured with correct policies

-- 1. Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('image_url', 'image_url', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Drop any existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to image_url" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to image_url" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update image_url files they own" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete image_url files they own" ON storage.objects;

-- 3. Create new policies
-- Allow public access to read files (most important for displaying images)
CREATE POLICY "Allow public access to image_url"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'image_url');

-- Allow authenticated users to upload files
CREATE POLICY "Allow users to upload to image_url"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image_url');

-- Allow authenticated users to update files they own
CREATE POLICY "Allow users to update image_url files they own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'image_url' AND owner = auth.uid());

-- Allow authenticated users to delete files they own
CREATE POLICY "Allow users to delete image_url files they own"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'image_url' AND owner = auth.uid());

-- 4. Fix existing URLs in the property_photos table
UPDATE public.property_photos
SET url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || storage_path
WHERE url LIKE '%/api/%' OR url NOT LIKE 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/%';
