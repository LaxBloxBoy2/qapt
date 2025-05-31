-- Documents Schema for QAPT Property Management System

-- Update the existing documents table to match our enhanced schema
DO $do$
BEGIN
  -- Check if the documents table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    -- Add new columns if they don't exist

    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'category') THEN
      ALTER TABLE public.documents ADD COLUMN category TEXT CHECK (category IN (
        'lease_agreement', 'tenant_application', 'maintenance_report', 'inspection_report',
        'insurance_document', 'property_deed', 'tax_document', 'utility_bill',
        'vendor_contract', 'legal_document', 'financial_statement', 'other'
      )) DEFAULT 'other';
    END IF;

    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'description') THEN
      ALTER TABLE public.documents ADD COLUMN description TEXT;
    END IF;

    -- Add file_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size') THEN
      ALTER TABLE public.documents ADD COLUMN file_size INTEGER;
    END IF;

    -- Add file_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_type') THEN
      ALTER TABLE public.documents ADD COLUMN file_type TEXT;
    END IF;

    -- Add storage_path column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'storage_path') THEN
      ALTER TABLE public.documents ADD COLUMN storage_path TEXT;
    END IF;

    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'status') THEN
      ALTER TABLE public.documents ADD COLUMN status TEXT CHECK (status IN ('active', 'archived', 'expired', 'pending_review')) DEFAULT 'active';
    END IF;

    -- Add expiration_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'expiration_date') THEN
      ALTER TABLE public.documents ADD COLUMN expiration_date DATE;
    END IF;

    -- Add tags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'tags') THEN
      ALTER TABLE public.documents ADD COLUMN tags TEXT[];
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'updated_at') THEN
      ALTER TABLE public.documents ADD COLUMN updated_at TIMESTAMP DEFAULT now();
    END IF;

    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'name') THEN
      ALTER TABLE public.documents ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Document';
    END IF;

    -- Remove file_name column if it exists (we only use 'name' now)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_name') THEN
      ALTER TABLE public.documents DROP COLUMN file_name;
    END IF;

    RAISE NOTICE 'Documents table updated successfully.';
  ELSE
    -- Create the documents table if it doesn't exist
    CREATE TABLE public.documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT CHECK (category IN (
        'lease_agreement', 'tenant_application', 'maintenance_report', 'inspection_report',
        'insurance_document', 'property_deed', 'tax_document', 'utility_bill',
        'vendor_contract', 'legal_document', 'financial_statement', 'other'
      )) DEFAULT 'other',
      description TEXT,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      storage_path TEXT,
      status TEXT CHECK (status IN ('active', 'archived', 'expired', 'pending_review')) DEFAULT 'active',
      property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
      lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
      tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
      expiration_date DATE,
      tags TEXT[],
      uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    RAISE NOTICE 'Documents table created successfully.';
  END IF;
END
$do$;

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view documents of own properties" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents to own properties" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents of own properties" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents of own properties" ON public.documents;

-- Create comprehensive RLS policies for documents
CREATE POLICY "Users can view documents of own properties"
ON public.documents
FOR SELECT
USING (
  -- Allow if user uploaded the document
  uploaded_by = auth.uid() OR
  -- Allow if document is associated with user's property
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) OR
  -- Allow if document is associated with user's lease
  (lease_id IS NOT NULL AND lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )) OR
  -- Allow if document is associated with user's tenant
  (tenant_id IS NOT NULL AND tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.units u ON t.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can insert documents to own properties"
ON public.documents
FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL AND
  -- User must be the uploader
  uploaded_by = auth.uid() AND
  (
    -- Document can be unassociated (general document)
    (property_id IS NULL AND lease_id IS NULL AND tenant_id IS NULL) OR
    -- Document is associated with user's property
    (property_id IS NOT NULL AND property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )) OR
    -- Document is associated with user's lease
    (lease_id IS NOT NULL AND lease_id IN (
      SELECT l.id FROM public.leases l
      JOIN public.units u ON l.unit_id = u.id
      JOIN public.properties p ON u.property_id = p.id
      WHERE p.user_id = auth.uid()
    )) OR
    -- Document is associated with user's tenant
    (tenant_id IS NOT NULL AND tenant_id IN (
      SELECT t.id FROM public.tenants t
      JOIN public.units u ON t.unit_id = u.id
      JOIN public.properties p ON u.property_id = p.id
      WHERE p.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can update documents of own properties"
ON public.documents
FOR UPDATE
USING (
  -- Allow if user uploaded the document
  uploaded_by = auth.uid() OR
  -- Allow if document is associated with user's property
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) OR
  -- Allow if document is associated with user's lease
  (lease_id IS NOT NULL AND lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )) OR
  -- Allow if document is associated with user's tenant
  (tenant_id IS NOT NULL AND tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.units u ON t.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete documents of own properties"
ON public.documents
FOR DELETE
USING (
  -- Allow if user uploaded the document
  uploaded_by = auth.uid() OR
  -- Allow if document is associated with user's property
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) OR
  -- Allow if document is associated with user's lease
  (lease_id IS NOT NULL AND lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )) OR
  -- Allow if document is associated with user's tenant
  (tenant_id IS NOT NULL AND tenant_id IN (
    SELECT t.id FROM public.tenants t
    JOIN public.units u ON t.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

-- Create storage policies for document-files bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('document-files', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT DO NOTHING;

-- Storage policies for document-files bucket
CREATE POLICY "Users can view own document files"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload document files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own document files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'document-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own document files"
ON storage.objects FOR DELETE
USING (bucket_id = 'document-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_lease_id ON public.documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_expiration_date ON public.documents(expiration_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Final completion notice
DO $final$
BEGIN
  RAISE NOTICE 'Documents schema setup complete with enhanced features';
END
$final$;
