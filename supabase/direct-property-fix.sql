-- DIRECT PROPERTY FIX
-- This script fixes the property relationship for specific inspections

-- 1. Make sure the Reinold AP property exists
INSERT INTO public.properties (id, name, address, user_id, created_at)
VALUES (
  '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51',
  'Reinold AP',
  '128 city road',
  (SELECT id FROM auth.users LIMIT 1),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET name = 'Reinold AP', address = '128 city road';

-- 2. Update the problematic inspections to use this property
UPDATE public.inspections
SET property_id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
WHERE id IN ('c4e10265-d302-415e-8b14-5c9192a29a96', '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51');

-- 3. Verify the fix worked
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
