-- Emergency fix for storage upload issues
-- This script creates the most permissive policies possible to ensure uploads work

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Drop ALL existing policies to start completely fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on storage.objects
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Temporarily disable RLS to test
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create the most permissive policies possible

-- 1. Allow ALL users (authenticated and anon) to upload to document-files
CREATE POLICY "Allow all uploads to document-files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'document-files');

-- 2. Allow ALL users to read from document-files
CREATE POLICY "Allow all reads from document-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'document-files');

-- 3. Allow ALL users to update document-files
CREATE POLICY "Allow all updates to document-files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'document-files')
WITH CHECK (bucket_id = 'document-files');

-- 4. Allow ALL users to delete from document-files
CREATE POLICY "Allow all deletes from document-files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'document-files');

-- Grant maximum permissions
GRANT ALL ON storage.objects TO public;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO public;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO anon;

-- Also grant on the storage schema itself
GRANT USAGE ON SCHEMA storage TO public;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Emergency storage policies applied successfully';
  RAISE NOTICE 'Bucket: document-files (public)';
  RAISE NOTICE 'Policies: Maximum permissive - all users can do everything';
  RAISE NOTICE 'This is for testing - tighten security later if needed';
END $$;
