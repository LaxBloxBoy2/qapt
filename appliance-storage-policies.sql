-- Add storage policies for the appliance-files bucket

-- Check if the bucket exists, create it if it doesn't
INSERT INTO storage.buckets (id, name, public) 
VALUES ('appliance-files', 'appliance-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the appliance-files bucket
CREATE POLICY "Allow authenticated users to upload appliance files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'appliance-files');

-- Allow authenticated users to select files from the appliance-files bucket
CREATE POLICY "Allow authenticated users to view appliance files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'appliance-files');

-- Allow authenticated users to update files they own in the appliance-files bucket
CREATE POLICY "Allow authenticated users to update appliance files they own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'appliance-files' AND owner = auth.uid());

-- Allow authenticated users to delete files they own in the appliance-files bucket
CREATE POLICY "Allow authenticated users to delete appliance files they own"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'appliance-files' AND owner = auth.uid());

-- Verify that the appliance_attachments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'appliance_attachments'
);
