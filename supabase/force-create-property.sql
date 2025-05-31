-- EMERGENCY FIX FOR PROPERTY RELATIONSHIP ISSUES

-- 1. First, drop any existing RLS policies that might interfere with our updates
-- Drop inspection_sections policies
DROP POLICY IF EXISTS "Users can view their inspection sections" ON public.inspection_sections;
DROP POLICY IF EXISTS "Users can insert their inspection sections" ON public.inspection_sections;
DROP POLICY IF EXISTS "Users can update their inspection sections" ON public.inspection_sections;
DROP POLICY IF EXISTS "Users can delete their inspection sections" ON public.inspection_sections;

-- Drop inspections policies
DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

-- 2. Make sure the property_id column is the correct type
ALTER TABLE IF EXISTS public.inspections
  DROP CONSTRAINT IF EXISTS inspections_property_id_fkey;

ALTER TABLE IF EXISTS public.inspections
  ALTER COLUMN property_id TYPE uuid USING property_id::uuid;

-- 3. Force create the Reinold AP property
DO $$
DECLARE
  property_exists BOOLEAN;
  user_id UUID;
BEGIN
  -- Get the first user ID from the database
  SELECT id INTO user_id FROM auth.users LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the database';
  END IF;

  -- Delete the property if it exists (to ensure clean state)
  DELETE FROM public.properties
  WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51';

  -- Create the property fresh
  INSERT INTO public.properties (
    id,
    name,
    address,
    user_id,
    created_at
  ) VALUES (
    '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51',
    'Reinold AP',
    '128 city road',
    user_id,
    NOW()
  );

  RAISE NOTICE 'Created property: Reinold AP';

  -- Force update all problematic inspections with this property ID
  UPDATE public.inspections
  SET property_id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
  WHERE id IN ('c4e10265-d302-415e-8b14-5c9192a29a96', '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51');

  RAISE NOTICE 'Updated inspections to use property: Reinold AP';
END
$$;

-- 4. Add back the foreign key constraint
ALTER TABLE IF EXISTS public.inspections
  ADD CONSTRAINT inspections_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES public.properties(id)
  ON DELETE SET NULL;

-- 5. Recreate the RLS policies for inspections
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

-- 6. Recreate the RLS policies for inspection_sections
CREATE POLICY "Users can view their inspection sections"
ON public.inspection_sections
FOR SELECT
USING (
  inspection_id IN (
    SELECT id FROM inspections
    WHERE auth.uid() = created_by OR
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert their inspection sections"
ON public.inspection_sections
FOR INSERT
WITH CHECK (
  inspection_id IN (
    SELECT id FROM inspections
    WHERE auth.uid() = created_by OR
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their inspection sections"
ON public.inspection_sections
FOR UPDATE
USING (
  inspection_id IN (
    SELECT id FROM inspections
    WHERE auth.uid() = created_by OR
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their inspection sections"
ON public.inspection_sections
FOR DELETE
USING (
  inspection_id IN (
    SELECT id FROM inspections
    WHERE auth.uid() = created_by OR
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  )
);

-- 7. Verify the fix worked
SELECT
  i.id AS inspection_id,
  i.property_id,
  p.name AS property_name,
  p.address AS property_address
FROM
  public.inspections i
JOIN
  public.properties p ON i.property_id = p.id
WHERE
  i.id IN ('c4e10265-d302-415e-8b14-5c9192a29a96', '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51');
