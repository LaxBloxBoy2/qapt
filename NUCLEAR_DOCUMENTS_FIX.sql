-- NUCLEAR OPTION: Complete documents table fix
-- This will completely rebuild the documents table structure

-- Step 1: Drop any views that might reference the old structure
DROP VIEW IF EXISTS documents_view CASCADE;
DROP VIEW IF EXISTS document_details_view CASCADE;
DROP VIEW IF EXISTS documents_with_relations CASCADE;

-- Step 2: Create a backup of existing data (if any)
CREATE TEMP TABLE documents_backup AS 
SELECT 
    id,
    COALESCE(name, 'Untitled Document') as name,
    COALESCE(category, 'other') as category,
    description,
    file_url,
    file_size,
    file_type,
    storage_path,
    COALESCE(status, 'active') as status,
    property_id,
    lease_id,
    tenant_id,
    expiration_date,
    tags,
    uploaded_by,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM public.documents;

-- Step 3: Drop and recreate the documents table with correct structure
DROP TABLE IF EXISTS public.documents CASCADE;

CREATE TABLE public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT CHECK (category IN (
        'lease_agreement', 'tenant_application', 'maintenance_report', 'inspection_report',
        'insurance_document', 'property_deed', 'tax_document', 'utility_bill',
        'vendor_contract', 'legal_document', 'financial_statement', 'other'
    )) DEFAULT 'other',
    description TEXT,
    file_url TEXT NOT NULL DEFAULT '',
    file_size INTEGER,
    file_type TEXT,
    storage_path TEXT,
    status TEXT CHECK (status IN ('active', 'archived', 'expired', 'pending_review')) DEFAULT 'active',
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    expiration_date DATE,
    tags TEXT[],
    uploaded_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: Restore data from backup
INSERT INTO public.documents (
    id, name, category, description, file_url, file_size, file_type, 
    storage_path, status, property_id, lease_id, tenant_id, 
    expiration_date, tags, uploaded_by, created_at, updated_at
)
SELECT 
    id, name, category, description, file_url, file_size, file_type,
    storage_path, status, property_id, lease_id, tenant_id,
    expiration_date, tags, uploaded_by, created_at, updated_at
FROM documents_backup;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_lease_id ON public.documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- Step 6: Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Users can view documents" ON public.documents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their documents" ON public.documents
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their documents" ON public.documents
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Step 8: Show final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;

-- Step 9: Show row count
SELECT COUNT(*) as total_documents FROM public.documents;
