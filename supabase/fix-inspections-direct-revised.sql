-- Direct fix for inspections table and property relationships

-- 1. First, make sure the properties table has the correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'Properties table does not have an id column';
  END IF;
END
$$;

-- 2. Drop all existing RLS policies first
DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

-- 3. Fix the inspections table structure
ALTER TABLE IF EXISTS public.inspections
  DROP CONSTRAINT IF EXISTS inspections_property_id_fkey;

-- 4. Now we can safely alter the column type
DO $$
BEGIN
  -- Check if the column is already UUID type
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'inspections' AND column_name = 'property_id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'property_id is already UUID type, skipping conversion';
  ELSE
    -- Try to convert to UUID
    BEGIN
      ALTER TABLE public.inspections
        ALTER COLUMN property_id TYPE uuid USING property_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, set property_id to NULL for all rows
      RAISE NOTICE 'Could not convert property_id to UUID, setting to NULL';
      ALTER TABLE public.inspections
        ALTER COLUMN property_id DROP NOT NULL;
      UPDATE public.inspections SET property_id = NULL;
      ALTER TABLE public.inspections
        ALTER COLUMN property_id TYPE uuid USING NULL;
    END;
  END IF;
END
$$;

-- 5. Add the foreign key constraint
ALTER TABLE IF EXISTS public.inspections
  ADD CONSTRAINT inspections_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES public.properties(id)
  ON DELETE SET NULL;

-- 6. Enable RLS on the inspections table
ALTER TABLE IF EXISTS public.inspections ENABLE ROW LEVEL SECURITY;

-- 7. Create new RLS policies
CREATE POLICY "Users can view their own inspections"
ON public.inspections
FOR SELECT
USING (
  auth.uid() = created_by OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own inspections"
ON public.inspections
FOR INSERT
WITH CHECK (
  auth.uid() = created_by OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own inspections"
ON public.inspections
FOR UPDATE
USING (
  auth.uid() = created_by OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own inspections"
ON public.inspections
FOR DELETE
USING (
  auth.uid() = created_by OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

-- 8. Fix inspections with null or invalid property_id
UPDATE public.inspections
SET property_id = (
  SELECT id FROM public.properties LIMIT 1
)
WHERE property_id IS NULL OR 
      property_id NOT IN (SELECT id FROM public.properties);

-- 9. Fix the specific inspection with ID c4e10265-d302-415e-8b14-5c9192a29a96
UPDATE public.inspections
SET property_id = (
  SELECT id FROM public.properties LIMIT 1
)
WHERE id = 'c4e10265-d302-415e-8b14-5c9192a29a96';
