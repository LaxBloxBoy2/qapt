-- Simple and effective document storage policies
-- This script creates basic RLS policies that should work reliably

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete document files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view document files" ON storage.objects;
DROP POLICY IF EXISTS "Simple upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Simple read policy" ON storage.objects;
DROP POLICY IF EXISTS "Simple update policy" ON storage.objects;
DROP POLICY IF EXISTS "Simple delete policy" ON storage.objects;

-- Create simple, permissive policies for document-files bucket

-- 1. Allow all authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-files');

-- 2. Allow everyone to read files (since bucket is public)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'document-files');

-- 3. Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'document-files')
WITH CHECK (bucket_id = 'document-files');

-- 4. Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'document-files');

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO public;

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Simple document storage policies created successfully';
  RAISE NOTICE 'Bucket: document-files (public)';
  RAISE NOTICE 'Policies: Allow all authenticated users to upload/update/delete, allow public reads';
END $$;
