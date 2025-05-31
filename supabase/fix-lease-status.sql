-- Fix the status column in the leases table

-- Check if the leases table exists and if the status column is properly set up
DO $check$
DECLARE
  table_exists BOOLEAN;
  has_status_column BOOLEAN;
  is_generated_column BOOLEAN;
BEGIN
  -- Check if the leases table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leases'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Leases table exists, checking status column...';
    
    -- Check if status column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'status'
    ) INTO has_status_column;
    
    -- Check if it's a generated column
    IF has_status_column THEN
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leases'
        AND column_name = 'status'
        AND is_generated = 'ALWAYS'
      ) INTO is_generated_column;
      
      IF is_generated_column THEN
        RAISE NOTICE 'Status column exists and is properly set up as a generated column.';
      ELSE
        RAISE NOTICE 'Status column exists but is not a generated column. Updating values...';
        
        -- Update the status values
        UPDATE public.leases
        SET status = 
          CASE
            WHEN start_date > CURRENT_DATE THEN 'upcoming'
            WHEN end_date < CURRENT_DATE THEN 'expired'
            ELSE 'active'
          END;
          
        RAISE NOTICE 'Status values updated successfully.';
      END IF;
    ELSE
      RAISE NOTICE 'Status column does not exist, adding it...';
      
      -- Try to add the generated column
      BEGIN
        ALTER TABLE public.leases ADD COLUMN status TEXT GENERATED ALWAYS AS (
          CASE
            WHEN start_date > CURRENT_DATE THEN 'upcoming'
            WHEN end_date < CURRENT_DATE THEN 'expired'
            ELSE 'active'
          END
        ) STORED;
        
        RAISE NOTICE 'Status column added successfully as a generated column.';
      EXCEPTION
        WHEN OTHERS THEN
          -- If generated column fails, add a regular column
          RAISE NOTICE 'Could not add generated status column: %', SQLERRM;
          RAISE NOTICE 'Adding status as a regular column...';
          
          ALTER TABLE public.leases ADD COLUMN status TEXT;
          
          -- Update the status values
          UPDATE public.leases
          SET status = 
            CASE
              WHEN start_date > CURRENT_DATE THEN 'upcoming'
              WHEN end_date < CURRENT_DATE THEN 'expired'
              ELSE 'active'
            END;
            
          RAISE NOTICE 'Status column added as a regular column and values updated.';
      END;
    END IF;
  ELSE
    RAISE NOTICE 'Leases table does not exist, please run the check-all-lease-columns.sql script first.';
  END IF;
END
$check$;
