-- URGENT FIX FOR DOCUMENTS TABLE
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- Step 1: Drop the file_name column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'file_name'
    ) THEN
        ALTER TABLE public.documents DROP COLUMN file_name CASCADE;
        RAISE NOTICE 'Successfully dropped file_name column';
    ELSE
        RAISE NOTICE 'file_name column does not exist';
    END IF;
END $$;

-- Step 2: Ensure name column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Document';
        RAISE NOTICE 'Added name column';
    ELSE
        RAISE NOTICE 'name column already exists';
    END IF;
END $$;

-- Step 3: Clear any cached schema information
ANALYZE public.documents;

-- Step 4: Show current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;
