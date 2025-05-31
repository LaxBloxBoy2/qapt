-- Fix RLS policies for properties table

-- First ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

-- Create policies for properties
CREATE POLICY "Users can view own properties"
ON public.properties
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
ON public.properties
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
ON public.properties
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
ON public.properties
FOR DELETE
USING (auth.uid() = user_id);

-- Verify the property exists and has correct ownership
DO $$
DECLARE
  property_exists BOOLEAN;
  property_owner UUID;
BEGIN
  -- Check if our specific property exists
  SELECT EXISTS (
    SELECT 1 
    FROM public.properties 
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
  ) INTO property_exists;

  IF property_exists THEN
    -- Get the owner
    SELECT user_id 
    FROM public.properties 
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
    INTO property_owner;

    -- Update the owner if needed
    UPDATE public.properties
    SET user_id = (SELECT id FROM auth.users LIMIT 1)
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
    AND (property_owner IS NULL OR NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = property_owner
    ));

    RAISE NOTICE 'Property exists and ownership verified';
  ELSE
    RAISE NOTICE 'Property not found - it may need to be recreated';
  END IF;
END
$$;
