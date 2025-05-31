-- Debug Lease Data - Check what's actually in the database
-- Run this to see what data exists and why leases aren't showing

-- 1. Check basic table counts
SELECT 'TABLE COUNTS' as section;
SELECT 'properties' as table_name, COUNT(*) as count FROM public.properties
UNION ALL
SELECT 'units' as table_name, COUNT(*) as count FROM public.units
UNION ALL
SELECT 'tenants' as table_name, COUNT(*) as count FROM public.tenants
UNION ALL
SELECT 'leases' as table_name, COUNT(*) as count FROM public.leases
UNION ALL
SELECT 'lease_tenants' as table_name, COUNT(*) as count FROM public.lease_tenants;

-- 2. Show all leases with their unit relationships
SELECT 'ALL LEASES WITH UNITS' as section;
SELECT 
  l.id as lease_id,
  l.unit_id,
  l.start_date,
  l.end_date,
  l.rent_amount,
  l.status,
  u.name as unit_name,
  u.property_id,
  p.name as property_name
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
ORDER BY l.created_at DESC;

-- 3. Show all lease_tenants relationships
SELECT 'LEASE-TENANT RELATIONSHIPS' as section;
SELECT 
  lt.id as relationship_id,
  lt.lease_id,
  lt.tenant_id,
  lt.is_primary,
  l.start_date,
  l.end_date,
  t.first_name,
  t.last_name,
  t.email
FROM public.lease_tenants lt
LEFT JOIN public.leases l ON lt.lease_id = l.id
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
ORDER BY lt.created_at DESC;

-- 4. Show tenants and their lease counts
SELECT 'TENANTS WITH LEASE COUNTS' as section;
SELECT 
  t.id as tenant_id,
  t.first_name,
  t.last_name,
  t.email,
  COUNT(lt.lease_id) as lease_count,
  STRING_AGG(l.id::text, ', ') as lease_ids
FROM public.tenants t
LEFT JOIN public.lease_tenants lt ON t.id = lt.tenant_id
LEFT JOIN public.leases l ON lt.lease_id = l.id
GROUP BY t.id, t.first_name, t.last_name, t.email
ORDER BY lease_count DESC, t.created_at DESC;

-- 5. Show units and their lease counts
SELECT 'UNITS WITH LEASE COUNTS' as section;
SELECT 
  u.id as unit_id,
  u.name as unit_name,
  u.status as unit_status,
  p.name as property_name,
  COUNT(l.id) as lease_count,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_lease_count,
  STRING_AGG(l.id::text, ', ') as lease_ids
FROM public.units u
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.leases l ON u.id = l.unit_id
GROUP BY u.id, u.name, u.status, p.name
ORDER BY lease_count DESC, u.created_at DESC;

-- 6. Check for orphaned records
SELECT 'ORPHANED RECORDS' as section;

-- Leases without units
SELECT 'Leases without units:' as issue, COUNT(*) as count
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
WHERE u.id IS NULL;

-- Leases without tenants
SELECT 'Leases without tenants:' as issue, COUNT(*) as count
FROM public.leases l
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
WHERE lt.lease_id IS NULL;

-- Lease_tenants without leases
SELECT 'Lease_tenants without leases:' as issue, COUNT(*) as count
FROM public.lease_tenants lt
LEFT JOIN public.leases l ON lt.lease_id = l.id
WHERE l.id IS NULL;

-- Lease_tenants without tenants
SELECT 'Lease_tenants without tenants:' as issue, COUNT(*) as count
FROM public.lease_tenants lt
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
WHERE t.id IS NULL;

-- 7. Sample data for debugging
SELECT 'SAMPLE DATA FOR DEBUGGING' as section;

-- Show first 3 leases with all relationships
SELECT 
  'Sample lease data:' as info,
  l.id,
  l.unit_id,
  l.start_date,
  l.end_date,
  l.status,
  u.name as unit_name,
  p.name as property_name,
  t.first_name || ' ' || t.last_name as tenant_name
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
ORDER BY l.created_at DESC
LIMIT 10;

-- 8. Check if there's any data at all
SELECT 'DATA EXISTS CHECK' as section;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public.leases) = 0 THEN 'NO LEASES EXIST'
    WHEN (SELECT COUNT(*) FROM public.lease_tenants) = 0 THEN 'NO LEASE-TENANT RELATIONSHIPS EXIST'
    WHEN (SELECT COUNT(*) FROM public.tenants) = 0 THEN 'NO TENANTS EXIST'
    WHEN (SELECT COUNT(*) FROM public.units) = 0 THEN 'NO UNITS EXIST'
    ELSE 'DATA EXISTS - CHECK RELATIONSHIPS'
  END as diagnosis;
