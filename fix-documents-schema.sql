-- Fix documents table schema by removing file_name column completely
-- and clearing any cached schema information

-- First, drop any views or dependencies that might reference file_name
DROP VIEW IF EXISTS documents_view;
DROP VIEW IF EXISTS document_details_view;

-- Remove file_name column if it exists
DO $$
BEGIN
    -- Check if file_name column exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'file_name'
    ) THEN
        ALTER TABLE public.documents DROP COLUMN file_name;
        RAISE NOTICE 'Dropped file_name column from documents table';
    ELSE
        RAISE NOTICE 'file_name column does not exist in documents table';
    END IF;
END $$;

-- Ensure the documents table has the correct structure
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Document';
        RAISE NOTICE 'Added name column to documents table';
    END IF;

    -- Ensure file_url column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'file_url'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN file_url TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added file_url column to documents table';
    END IF;
END $$;

-- Clear any cached schema information by updating table statistics
ANALYZE public.documents;

-- Show the current structure of the documents table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;
