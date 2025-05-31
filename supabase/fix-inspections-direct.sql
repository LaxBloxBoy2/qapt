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

-- 2. Fix the inspections table structure
ALTER TABLE IF EXISTS public.inspections
  ALTER COLUMN property_id TYPE uuid USING property_id::uuid;

-- 3. Update the inspections table to ensure property_id is a foreign key to properties
ALTER TABLE IF EXISTS public.inspections
  DROP CONSTRAINT IF EXISTS inspections_property_id_fkey;

ALTER TABLE IF EXISTS public.inspections
  ADD CONSTRAINT inspections_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES public.properties(id)
  ON DELETE SET NULL;

-- 4. Enable RLS on the inspections table
ALTER TABLE IF EXISTS public.inspections ENABLE ROW LEVEL SECURITY;

-- 5. Create or replace RLS policies for inspections
DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

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

-- 6. Fix the specific inspection with ID c4e10265-d302-415e-8b14-5c9192a29a96
UPDATE public.inspections
SET property_id = (
  SELECT id FROM public.properties LIMIT 1
)
WHERE id = 'c4e10265-d302-415e-8b14-5c9192a29a96';

-- 7. Fix any other inspections with null or invalid property_id
UPDATE public.inspections
SET property_id = (
  SELECT id FROM public.properties LIMIT 1
)
WHERE property_id IS NULL OR 
      property_id NOT IN (SELECT id FROM public.properties);
