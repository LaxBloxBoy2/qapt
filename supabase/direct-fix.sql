-- DIRECT FIX FOR PROPERTY RELATIONSHIP

-- First, check if the property exists
DO $$
DECLARE
  property_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.properties 
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
  ) INTO property_exists;
  
  IF NOT property_exists THEN
    -- Create the property if it doesn't exist
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
      auth.uid(),
      NOW()
    );
    
    RAISE NOTICE 'Created property: Reinold AP';
  ELSE
    -- Update the property if it exists
    UPDATE public.properties
    SET 
      name = 'Reinold AP',
      address = '128 city road'
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51';
    
    RAISE NOTICE 'Updated property: Reinold AP';
  END IF;
  
  -- Update all inspections with this property ID
  UPDATE public.inspections
  SET property_id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
  WHERE id IN ('c4e10265-d302-415e-8b14-5c9192a29a96', '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51');
  
  RAISE NOTICE 'Updated inspections to use property: Reinold AP';
END
$$;
