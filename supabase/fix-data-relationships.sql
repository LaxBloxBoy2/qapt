-- Fix Data Relationships and Clean Up Inconsistent Data
-- This script will ensure proper correlation between tenants, leases, units, and properties

-- 1. First, let's see what we're working with
SELECT 'CURRENT DATA OVERVIEW' as section;

-- Show current lease data with relationships
SELECT 
  'Current Leases:' as info,
  l.id,
  l.start_date,
  l.end_date,
  u.name as unit_name,
  p.name as property_name,
  COUNT(lt.tenant_id) as tenant_count
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
GROUP BY l.id, l.start_date, l.end_date, u.name, p.name
ORDER BY l.created_at DESC;

-- Show current tenant data
SELECT 
  'Current Tenants:' as info,
  t.id,
  t.first_name,
  t.last_name,
  t.email,
  COUNT(lt.lease_id) as lease_count
FROM public.tenants t
LEFT JOIN public.lease_tenants lt ON t.id = lt.tenant_id
GROUP BY t.id, t.first_name, t.last_name, t.email
ORDER BY t.created_at DESC;

-- 2. Check for data quality issues
SELECT 'DATA QUALITY ISSUES' as section;

-- Find tenants with suspicious names (like "John ASFA")
SELECT 
  'Suspicious Tenant Names:' as issue,
  id,
  first_name,
  last_name,
  email
FROM public.tenants
WHERE 
  first_name ILIKE '%asfa%' 
  OR last_name ILIKE '%asfa%'
  OR first_name ILIKE '%test%'
  OR last_name ILIKE '%test%'
  OR first_name ILIKE '%demo%'
  OR last_name ILIKE '%demo%';

-- Find leases without proper tenant relationships
SELECT 
  'Leases Missing Tenants:' as issue,
  l.id as lease_id,
  u.name as unit_name,
  p.name as property_name
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
WHERE lt.lease_id IS NULL;

-- 3. Create sample realistic data if needed
DO $$
DECLARE
  sample_property_id uuid;
  sample_unit_id uuid;
  sample_tenant_id uuid;
  sample_lease_id uuid;
  user_id_val uuid;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO user_id_val;
  
  -- If no user ID available, use a default approach
  IF user_id_val IS NULL THEN
    SELECT id INTO user_id_val FROM auth.users LIMIT 1;
  END IF;
  
  -- Only create sample data if we have very little data
  IF (SELECT COUNT(*) FROM public.leases) < 3 THEN
    RAISE NOTICE 'Creating sample data for testing relationships...';
    
    -- Create a sample property if none exist
    IF NOT EXISTS (SELECT 1 FROM public.properties LIMIT 1) THEN
      INSERT INTO public.properties (id, user_id, name, address, status)
      VALUES (gen_random_uuid(), user_id_val, 'Sample Apartment Complex', '123 Main St, City, State', 'active')
      RETURNING id INTO sample_property_id;
      
      RAISE NOTICE 'Created sample property: %', sample_property_id;
    ELSE
      SELECT id INTO sample_property_id FROM public.properties LIMIT 1;
    END IF;
    
    -- Create sample units
    INSERT INTO public.units (id, user_id, property_id, name, unit_type, status, market_rent)
    VALUES 
      (gen_random_uuid(), user_id_val, sample_property_id, 'Unit 101', 'Apartment', 'occupied', 1200.00),
      (gen_random_uuid(), user_id_val, sample_property_id, 'Unit 102', 'Apartment', 'vacant', 1250.00)
    ON CONFLICT DO NOTHING;
    
    -- Get a sample unit
    SELECT id INTO sample_unit_id FROM public.units WHERE property_id = sample_property_id LIMIT 1;
    
    -- Create sample tenants with realistic names
    INSERT INTO public.tenants (id, user_id, first_name, last_name, email, phone)
    VALUES 
      (gen_random_uuid(), user_id_val, 'Sarah', 'Johnson', 'sarah.johnson@email.com', '555-0101'),
      (gen_random_uuid(), user_id_val, 'Michael', 'Chen', 'michael.chen@email.com', '555-0102'),
      (gen_random_uuid(), user_id_val, 'Emily', 'Rodriguez', 'emily.rodriguez@email.com', '555-0103')
    ON CONFLICT DO NOTHING;
    
    -- Get a sample tenant
    SELECT id INTO sample_tenant_id FROM public.tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson' LIMIT 1;
    
    -- Create sample lease
    INSERT INTO public.leases (id, unit_id, start_date, end_date, rent_amount, deposit_amount)
    VALUES (gen_random_uuid(), sample_unit_id, '2024-01-01', '2024-12-31', 1200.00, 1200.00)
    ON CONFLICT DO NOTHING
    RETURNING id INTO sample_lease_id;
    
    -- Link tenant to lease
    INSERT INTO public.lease_tenants (lease_id, tenant_id, is_primary)
    VALUES (sample_lease_id, sample_tenant_id, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created sample lease with proper relationships';
  END IF;
  
  -- Clean up any test/demo data
  DELETE FROM public.lease_tenants 
  WHERE tenant_id IN (
    SELECT id FROM public.tenants 
    WHERE first_name ILIKE '%asfa%' OR last_name ILIKE '%asfa%'
       OR first_name ILIKE '%test%' OR last_name ILIKE '%test%'
       OR first_name ILIKE '%demo%' OR last_name ILIKE '%demo%'
  );
  
  DELETE FROM public.tenants 
  WHERE first_name ILIKE '%asfa%' OR last_name ILIKE '%asfa%'
     OR first_name ILIKE '%test%' OR last_name ILIKE '%test%'
     OR first_name ILIKE '%demo%' OR last_name ILIKE '%demo%';
  
  RAISE NOTICE 'Cleaned up test/demo tenant data';
END $$;

-- 4. Show final results
SELECT 'FINAL RESULTS' as section;

-- Show corrected lease data with relationships
SELECT 
  'Final Leases with Relationships:' as info,
  l.id,
  l.start_date,
  l.end_date,
  l.status,
  u.name as unit_name,
  p.name as property_name,
  p.address,
  STRING_AGG(t.first_name || ' ' || t.last_name, ', ') as tenants
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
GROUP BY l.id, l.start_date, l.end_date, l.status, u.name, p.name, p.address
ORDER BY l.created_at DESC;
