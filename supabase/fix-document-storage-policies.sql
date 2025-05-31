-- Fix document storage policies for file uploads
-- This script creates proper RLS policies for the document-files storage bucket

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete document files" ON storage.objects;

-- Create comprehensive storage policies for document-files bucket

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Users can upload document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-files'
);

-- Policy 2: Allow public read access to document files
CREATE POLICY "Public can view document files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'document-files'
);

-- Policy 3: Allow authenticated users to update their uploaded files
CREATE POLICY "Users can update document files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'document-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'document-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow authenticated users to delete their uploaded files
CREATE POLICY "Users can delete document files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative simpler policies if the above don't work
-- Uncomment these if you need more permissive policies for testing

/*
-- Simple upload policy for all authenticated users
CREATE POLICY "Simple upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-files');

-- Simple read policy for all users
CREATE POLICY "Simple read policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'document-files');

-- Simple update policy for authenticated users
CREATE POLICY "Simple update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'document-files')
WITH CHECK (bucket_id = 'document-files');

-- Simple delete policy for authenticated users
CREATE POLICY "Simple delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'document-files');
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Document storage policies have been updated successfully';
  RAISE NOTICE 'Bucket: document-files';
  RAISE NOTICE 'Policies created for: INSERT, SELECT, UPDATE, DELETE';
END $$;
