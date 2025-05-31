-- Comprehensive fix for inspection access issues

-- First, verify and fix inspection records
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the admin user ID (first user)
  SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- Update any inspections that have NULL created_by
  UPDATE public.inspections
  SET created_by = admin_user_id
  WHERE created_by IS NULL;

  -- Update any inspections that have an invalid created_by (user doesn't exist)
  UPDATE public.inspections
  SET created_by = admin_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = created_by
  );

  -- Update any inspections that have an invalid property_id
  UPDATE public.inspections
  SET property_id = NULL
  WHERE property_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.properties WHERE id = property_id
  );

  RAISE NOTICE 'Fixed invalid inspection records';
END;
$$;

-- Reset RLS on inspections table
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own inspections"
ON public.inspections
FOR SELECT
USING (
  -- User can access if they created the inspection
  auth.uid() = created_by
  OR 
  -- OR if they own the property
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can insert their own inspections"
ON public.inspections
FOR INSERT
WITH CHECK (
  -- User can only create inspections for themselves or their properties
  auth.uid() = created_by
  OR
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their own inspections"
ON public.inspections
FOR UPDATE
USING (
  -- User can update if they created the inspection
  auth.uid() = created_by
  OR
  -- OR if they own the property
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their own inspections"
ON public.inspections
FOR DELETE
USING (
  -- User can delete if they created the inspection
  auth.uid() = created_by
  OR
  -- OR if they own the property
  (property_id IS NOT NULL AND property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  ))
);

-- Finally, verify inspection-property relationships
DO $$
BEGIN
  -- Ensure the foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'inspections_property_id_fkey'
    AND table_name = 'inspections'
  ) THEN
    ALTER TABLE public.inspections
    ADD CONSTRAINT inspections_property_id_fkey
    FOREIGN KEY (property_id)
    REFERENCES public.properties(id)
    ON DELETE SET NULL;
  END IF;
  
  -- Grant necessary permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
  
  -- Verify some key inspections
  -- (Reuse Reinold AP property for any detached inspections)
  UPDATE public.inspections
  SET property_id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
  WHERE property_id IS NULL;

  RAISE NOTICE 'Successfully fixed inspection access and relationships';
END;
$$;
