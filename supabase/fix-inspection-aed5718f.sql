-- Fix for inspection aed5718f-84e3-47b4-a237-35a6728fbe5f

-- First, check the inspection's data
DO $$
DECLARE
  inspection_exists BOOLEAN;
  inspection_property_id UUID;
  property_exists BOOLEAN;
  user_id UUID;
BEGIN
  -- Get the first user ID (admin)
  SELECT id INTO user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- Check if inspection exists
  SELECT EXISTS (
    SELECT 1 FROM public.inspections WHERE id = 'aed5718f-84e3-47b4-a237-35a6728fbe5f'
  ) INTO inspection_exists;

  IF NOT inspection_exists THEN
    RAISE NOTICE 'Inspection does not exist';
    RETURN;
  END IF;

  -- Get the property_id from the inspection
  SELECT property_id INTO inspection_property_id 
  FROM public.inspections 
  WHERE id = 'aed5718f-84e3-47b4-a237-35a6728fbe5f';

  -- Check if the property exists
  IF inspection_property_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.properties WHERE id = inspection_property_id
    ) INTO property_exists;
  END IF;

  -- If property_id is NULL or property doesn't exist, update to use Reinold AP
  IF inspection_property_id IS NULL OR NOT property_exists THEN
    UPDATE public.inspections
    SET property_id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
    WHERE id = 'aed5718f-84e3-47b4-a237-35a6728fbe5f';
    
    RAISE NOTICE 'Updated inspection to use Reinold AP property';
  END IF;

  -- Ensure the inspection has a created_by value
  UPDATE public.inspections
  SET created_by = user_id
  WHERE id = 'aed5718f-84e3-47b4-a237-35a6728fbe5f'
  AND (created_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = created_by
  ));

  -- Re-enable RLS and recreate policies
  ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
  DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
  DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
  DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

  -- Create new policies that allow access via both created_by and property ownership
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

  RAISE NOTICE 'Successfully updated inspection and RLS policies';
END;
$$;
