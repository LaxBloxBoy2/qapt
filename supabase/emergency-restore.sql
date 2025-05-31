-- EMERGENCY RESTORE AND FIX

-- 1. First, check if we have any properties at all
DO $$
DECLARE
  property_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO property_count FROM public.properties;
  
  IF property_count = 0 THEN
    RAISE NOTICE 'No properties found in the database. Creating sample properties...';
    
    -- Insert sample properties
    INSERT INTO public.properties (id, name, address, user_id, created_at)
    VALUES 
      (gen_random_uuid(), 'Sample Property 1', '123 Main St', (SELECT id FROM auth.users LIMIT 1), NOW()),
      (gen_random_uuid(), 'Sample Property 2', '456 Oak Ave', (SELECT id FROM auth.users LIMIT 1), NOW()),
      (gen_random_uuid(), 'Sample Property 3', '789 Pine Rd', (SELECT id FROM auth.users LIMIT 1), NOW());
  ELSE
    RAISE NOTICE 'Found % properties in the database', property_count;
  END IF;
END
$$;

-- 2. Make sure Reinold AP property exists
DO $$
DECLARE
  reinold_exists BOOLEAN;
  user_id UUID;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.properties 
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
  ) INTO reinold_exists;
  
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  IF NOT reinold_exists THEN
    -- Create the Reinold AP property
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
    
    RAISE NOTICE 'Created Reinold AP property';
  ELSE
    RAISE NOTICE 'Reinold AP property already exists';
  END IF;
END
$$;

-- 3. Fix the problematic inspections
UPDATE public.inspections
SET property_id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
WHERE id IN ('c4e10265-d302-415e-8b14-5c9192a29a96', '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51');

-- 4. Verify the fix
SELECT
  i.id AS inspection_id,
  i.property_id,
  p.name AS property_name,
  p.address AS property_address
FROM
  public.inspections i
LEFT JOIN
  public.properties p ON i.property_id = p.id
WHERE
  i.id IN ('c4e10265-d302-415e-8b14-5c9192a29a96', '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51');
