-- Add missing columns to leases table

-- First, check if the leases table exists
DO $check$
DECLARE
  table_exists BOOLEAN;
  has_deposit_column BOOLEAN;
  has_notes_column BOOLEAN;
BEGIN
  -- Check if the leases table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leases'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Leases table exists, checking for missing columns...';
    
    -- Check if deposit_amount column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name IN ('deposit_amount', 'security_deposit', 'deposit')
    ) INTO has_deposit_column;
    
    -- Check if notes column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'notes'
    ) INTO has_notes_column;
    
    -- Add deposit_amount column if it doesn't exist
    IF NOT has_deposit_column THEN
      RAISE NOTICE 'Adding deposit_amount column to leases table...';
      ALTER TABLE public.leases ADD COLUMN deposit_amount NUMERIC;
      RAISE NOTICE 'deposit_amount column added successfully.';
    ELSE
      RAISE NOTICE 'deposit_amount column already exists.';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT has_notes_column THEN
      RAISE NOTICE 'Adding notes column to leases table...';
      ALTER TABLE public.leases ADD COLUMN notes TEXT;
      RAISE NOTICE 'notes column added successfully.';
    ELSE
      RAISE NOTICE 'notes column already exists.';
    END IF;
    
  ELSE
    RAISE NOTICE 'Leases table does not exist, please run the fix-leases-schema.sql script first.';
  END IF;
END
$check$;
