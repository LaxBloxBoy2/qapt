-- Get a valid property_id
SELECT id FROM public.properties LIMIT 1;

-- Test inserting a unit with a valid status
-- Replace 'property_id_here' with an actual property_id from your database
INSERT INTO public.units (
  name, 
  property_id, 
  unit_type, 
  status, 
  description, 
  beds, 
  baths, 
  size, 
  market_rent, 
  deposit, 
  user_id
) VALUES (
  'Test Unit', 
  'property_id_here', -- Replace with actual property_id
  'Apartment', 
  'vacant', -- Using a valid status value
  'Test description', 
  2, 
  1, 
  1000, 
  1500, 
  1000,
  (SELECT user_id FROM public.properties WHERE id = 'property_id_here') -- Get user_id from the property
);
