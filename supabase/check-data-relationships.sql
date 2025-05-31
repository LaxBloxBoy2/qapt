-- Check Data Relationships Between Tenants, Leases, Units, and Properties
-- This script will verify that the data is properly correlated

-- 1. Check the basic table structures and counts
SELECT 'Properties Count:' as info, COUNT(*) as count FROM public.properties;
SELECT 'Units Count:' as info, COUNT(*) as count FROM public.units;
SELECT 'Tenants Count:' as info, COUNT(*) as count FROM public.tenants;
SELECT 'Leases Count:' as info, COUNT(*) as count FROM public.leases;
SELECT 'Lease Tenants Count:' as info, COUNT(*) as count FROM public.lease_tenants;

-- 2. Check if units are properly linked to properties
SELECT 
  'Units with Properties:' as info,
  COUNT(*) as total_units,
  COUNT(property_id) as units_with_property_id,
  COUNT(*) - COUNT(property_id) as units_missing_property_id
FROM public.units;

-- 3. Check if leases are properly linked to units
SELECT 
  'Leases with Units:' as info,
  COUNT(*) as total_leases,
  COUNT(unit_id) as leases_with_unit_id,
  COUNT(*) - COUNT(unit_id) as leases_missing_unit_id
FROM public.leases;

-- 4. Check if lease_tenants junction table is populated
SELECT 
  'Lease-Tenant Relationships:' as info,
  COUNT(*) as total_relationships,
  COUNT(DISTINCT lease_id) as leases_with_tenants,
  COUNT(DISTINCT tenant_id) as tenants_with_leases
FROM public.lease_tenants;

-- 5. Show sample data with relationships
SELECT 
  'Sample Lease Data:' as section,
  l.id as lease_id,
  l.start_date,
  l.end_date,
  l.status,
  u.name as unit_name,
  p.name as property_name,
  p.address as property_address,
  COUNT(lt.tenant_id) as tenant_count
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
GROUP BY l.id, l.start_date, l.end_date, l.status, u.name, p.name, p.address
ORDER BY l.created_at DESC
LIMIT 10;

-- 6. Show tenants and their lease relationships
SELECT 
  'Sample Tenant Data:' as section,
  t.id as tenant_id,
  t.first_name,
  t.last_name,
  t.email,
  COUNT(lt.lease_id) as lease_count,
  STRING_AGG(u.name, ', ') as units,
  STRING_AGG(p.name, ', ') as properties
FROM public.tenants t
LEFT JOIN public.lease_tenants lt ON t.id = lt.tenant_id
LEFT JOIN public.leases l ON lt.lease_id = l.id
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
GROUP BY t.id, t.first_name, t.last_name, t.email
ORDER BY t.created_at DESC
LIMIT 10;

-- 7. Check for orphaned records
SELECT 'Orphaned Leases (no unit):' as issue, COUNT(*) as count
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
WHERE u.id IS NULL;

SELECT 'Orphaned Units (no property):' as issue, COUNT(*) as count
FROM public.units u
LEFT JOIN public.properties p ON u.property_id = p.id
WHERE p.id IS NULL;

SELECT 'Leases without tenants:' as issue, COUNT(*) as count
FROM public.leases l
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
WHERE lt.lease_id IS NULL;

-- 8. Check foreign key constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('leases', 'units', 'tenants', 'properties', 'lease_tenants')
ORDER BY tc.table_name, kcu.column_name;
