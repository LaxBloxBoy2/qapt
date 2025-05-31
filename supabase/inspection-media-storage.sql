-- Create storage bucket for inspection media

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-media', 'inspection-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the inspection-media bucket
CREATE POLICY "Allow authenticated users to upload inspection media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inspection-media');

-- Allow authenticated users to select files from the inspection-media bucket
CREATE POLICY "Allow authenticated users to view inspection media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'inspection-media');

-- Allow authenticated users to update files they own in the inspection-media bucket
CREATE POLICY "Allow authenticated users to update inspection media they own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'inspection-media' AND owner = auth.uid());

-- Allow authenticated users to delete files they own in the inspection-media bucket
CREATE POLICY "Allow authenticated users to delete inspection media they own"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'inspection-media' AND owner = auth.uid());
