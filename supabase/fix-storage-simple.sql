-- Simple fix for property photos storage
-- This script only configures the bucket and policies without trying to modify CORS

-- 1. Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('image_url', 'image_url', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Set up proper storage policies
-- First, drop any existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to image_url" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to image_url" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update image_url files they own" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete image_url files they own" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to property photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update property photos they own" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete property photos they own" ON storage.objects;

-- Create new policies
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

-- 3. Fix any existing property photos URLs in the database
DO $$
DECLARE
    photo_record RECORD;
BEGIN
    -- Get all property photos
    FOR photo_record IN
        SELECT id, url, storage_path, property_id
        FROM public.property_photos
    LOOP
        -- Update the record to ensure it has the correct URL format
        UPDATE public.property_photos
        SET url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || photo_record.storage_path
        WHERE id = photo_record.id;
        
        RAISE NOTICE 'Updated URL for photo %', photo_record.id;
    END LOOP;
    
    RAISE NOTICE 'Property photo URLs have been updated';
END;
$$;
