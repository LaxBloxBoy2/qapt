  -- Fix the foreign key relationship between inspections and properties tables

  -- First, check if the inspections table exists
  DO $$
  BEGIN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'inspections'
    ) THEN
      -- Drop existing foreign key constraint if it exists
      IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'inspections_property_id_fkey' 
        AND table_name = 'inspections'
      ) THEN
        ALTER TABLE public.inspections DROP CONSTRAINT inspections_property_id_fkey;
      END IF;

      -- Add the foreign key constraint with ON DELETE CASCADE
      ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_property_id_fkey
      FOREIGN KEY (property_id)
      REFERENCES public.properties(id)
      ON DELETE CASCADE;

      RAISE NOTICE 'Foreign key constraint updated successfully.';
    ELSE
      RAISE NOTICE 'The inspections table does not exist.';
    END IF;
  END
  $$;
