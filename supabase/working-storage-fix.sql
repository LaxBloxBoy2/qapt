-- Working storage fix for Supabase SQL Editor
-- This script only uses operations allowed in Supabase SQL Editor

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Drop existing policies one by one (safer approach)
DROP POLICY IF EXISTS "Allow all uploads to document-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from document-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to document-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from document-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete document files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view document files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create simple, working policies for document-files bucket

-- 1. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to document-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-files');

-- 2. Allow everyone to read files (since bucket is public)
CREATE POLICY "Allow public reads from document-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'document-files');

-- 3. Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to document-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'document-files')
WITH CHECK (bucket_id = 'document-files');

-- 4. Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from document-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'document-files');

-- Verification message
SELECT 'Storage policies for document-files bucket created successfully!' as status;
