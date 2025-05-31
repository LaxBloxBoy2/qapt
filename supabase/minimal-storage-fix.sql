-- MINIMAL storage fix - run each section separately if needed

-- Step 1: Create bucket (run this first)
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create upload policy (run this second)
CREATE POLICY "docs_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'document-files');

-- Step 3: Create read policy (run this third)
CREATE POLICY "docs_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'document-files');

-- Step 4: Create update policy (run this fourth)
CREATE POLICY "docs_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'document-files')
WITH CHECK (bucket_id = 'document-files');

-- Step 5: Create delete policy (run this fifth)
CREATE POLICY "docs_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'document-files');
