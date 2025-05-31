-- INSTANT FIX - Copy and paste this into Supabase SQL Editor

-- Create bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('document-files', 'document-files', true) ON CONFLICT (id) DO NOTHING;

-- Create policies (run one at a time if needed)
CREATE POLICY "upload_docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'document-files');
CREATE POLICY "read_docs" ON storage.objects FOR SELECT TO public USING (bucket_id = 'document-files');
CREATE POLICY "update_docs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'document-files') WITH CHECK (bucket_id = 'document-files');
CREATE POLICY "delete_docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'document-files');
