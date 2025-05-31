-- Check and add all required columns to leases table

-- First, check if the leases table exists
DO $check$
DECLARE
  table_exists BOOLEAN;
  has_unit_id BOOLEAN;
  has_start_date BOOLEAN;
  has_end_date BOOLEAN;
  has_rent_amount BOOLEAN;
  has_deposit_amount BOOLEAN;
  has_notes BOOLEAN;
BEGIN
  -- Check if the leases table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leases'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Leases table exists, checking for all required columns...';
    
    -- Check for each required column
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'unit_id'
    ) INTO has_unit_id;
    
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'start_date'
    ) INTO has_start_date;
    
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'end_date'
    ) INTO has_end_date;
    
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'rent_amount'
    ) INTO has_rent_amount;
    
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name IN ('deposit_amount', 'security_deposit', 'deposit')
    ) INTO has_deposit_amount;
    
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'notes'
    ) INTO has_notes;
    
    -- Add missing columns
    IF NOT has_unit_id THEN
      RAISE NOTICE 'Adding unit_id column to leases table...';
      ALTER TABLE public.leases ADD COLUMN unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE;
      RAISE NOTICE 'unit_id column added successfully.';
    ELSE
      RAISE NOTICE 'unit_id column already exists.';
    END IF;
    
    IF NOT has_start_date THEN
      RAISE NOTICE 'Adding start_date column to leases table...';
      ALTER TABLE public.leases ADD COLUMN start_date DATE NOT NULL DEFAULT CURRENT_DATE;
      RAISE NOTICE 'start_date column added successfully.';
    ELSE
      RAISE NOTICE 'start_date column already exists.';
    END IF;
    
    IF NOT has_end_date THEN
      RAISE NOTICE 'Adding end_date column to leases table...';
      ALTER TABLE public.leases ADD COLUMN end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year');
      RAISE NOTICE 'end_date column added successfully.';
    ELSE
      RAISE NOTICE 'end_date column already exists.';
    END IF;
    
    IF NOT has_rent_amount THEN
      RAISE NOTICE 'Adding rent_amount column to leases table...';
      ALTER TABLE public.leases ADD COLUMN rent_amount NUMERIC NOT NULL DEFAULT 0;
      RAISE NOTICE 'rent_amount column added successfully.';
    ELSE
      RAISE NOTICE 'rent_amount column already exists.';
    END IF;
    
    IF NOT has_deposit_amount THEN
      RAISE NOTICE 'Adding deposit_amount column to leases table...';
      ALTER TABLE public.leases ADD COLUMN deposit_amount NUMERIC;
      RAISE NOTICE 'deposit_amount column added successfully.';
    ELSE
      RAISE NOTICE 'deposit_amount column already exists.';
    END IF;
    
    IF NOT has_notes THEN
      RAISE NOTICE 'Adding notes column to leases table...';
      ALTER TABLE public.leases ADD COLUMN notes TEXT;
      RAISE NOTICE 'notes column added successfully.';
    ELSE
      RAISE NOTICE 'notes column already exists.';
    END IF;
    
    -- Check if status column exists, and add it if it doesn't
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases'
      AND column_name = 'status'
    ) THEN
      RAISE NOTICE 'Adding status column to leases table...';
      
      -- First, try to add the generated column
      BEGIN
        ALTER TABLE public.leases ADD COLUMN status TEXT GENERATED ALWAYS AS (
          CASE
            WHEN start_date > CURRENT_DATE THEN 'upcoming'
            WHEN end_date < CURRENT_DATE THEN 'expired'
            ELSE 'active'
          END
        ) STORED;
        RAISE NOTICE 'status column added successfully as a generated column.';
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
            
          RAISE NOTICE 'status column added as a regular column and values updated.';
      END;
    ELSE
      RAISE NOTICE 'status column already exists.';
    END IF;
    
  ELSE
    RAISE NOTICE 'Leases table does not exist, creating it from scratch...';
    
    -- Create the leases table with all required columns
    CREATE TABLE public.leases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      rent_amount NUMERIC NOT NULL,
      deposit_amount NUMERIC,
      status TEXT GENERATED ALWAYS AS (
        CASE
          WHEN start_date > CURRENT_DATE THEN 'upcoming'
          WHEN end_date < CURRENT_DATE THEN 'expired'
          ELSE 'active'
        END
      ) STORED,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Leases table created successfully with all required columns.';
    
    -- Create lease_tenants and lease_attachments tables
    -- (This part is the same as in previous scripts)
  END IF;
END
$check$;
