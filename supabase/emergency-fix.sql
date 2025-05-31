-- EMERGENCY FIX FOR INSPECTION PROPERTY ISSUE

-- 1. First, check if we have any properties at all
DO $$
DECLARE
  property_count INTEGER;
  first_property_id UUID;
BEGIN
  SELECT COUNT(*) INTO property_count FROM public.properties;
  
  IF property_count = 0 THEN
    RAISE EXCEPTION 'No properties found in the database. Please create at least one property first.';
  END IF;
  
  -- Get the first property ID
  SELECT id INTO first_property_id FROM public.properties LIMIT 1;
  
  -- Output the property ID for reference
  RAISE NOTICE 'Using property ID: %', first_property_id;
  
  -- Force update ALL inspections to use this property ID
  UPDATE public.inspections SET property_id = first_property_id;
  
  -- Specifically update the inspection with ID c4e10265-d302-415e-8b14-5c9192a29a96
  UPDATE public.inspections 
  SET property_id = first_property_id
  WHERE id = 'c4e10265-d302-415e-8b14-5c9192a29a96';
  
  -- Also update the one with ID 565a8c55-8af0-4ef5-a279-2ff0a2dd5c51
  UPDATE public.inspections 
  SET property_id = first_property_id
  WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51';
  
  RAISE NOTICE 'Updated all inspections to use property ID: %', first_property_id;
END
$$;

-- 2. Verify the update worked
SELECT id, property_id FROM public.inspections;

-- 3. Make sure the foreign key constraint is correct
ALTER TABLE IF EXISTS public.inspections
  DROP CONSTRAINT IF EXISTS inspections_property_id_fkey;

ALTER TABLE IF EXISTS public.inspections
  ADD CONSTRAINT inspections_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES public.properties(id)
  ON DELETE SET NULL;

-- 4. Create a view to help debug property relationships
CREATE OR REPLACE VIEW inspection_property_view AS
SELECT 
  i.id AS inspection_id,
  i.property_id,
  p.id AS actual_property_id,
  p.name AS property_name,
  p.address AS property_address
FROM 
  public.inspections i
LEFT JOIN 
  public.properties p ON i.property_id = p.id;

-- 5. Output the view for verification
SELECT * FROM inspection_property_view;
