-- Fix Tenant-Lease-Unit Correlation
-- This will ensure tenants show active leases and units show occupied status

-- 1. Check current state
SELECT 'CURRENT STATE ANALYSIS' as section;

-- Show tenants and their lease status
SELECT 
  'Tenants and their leases:' as info,
  t.id as tenant_id,
  t.first_name,
  t.last_name,
  t.email,
  COUNT(lt.lease_id) as total_leases,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_leases,
  STRING_AGG(DISTINCT u.name, ', ') as units,
  STRING_AGG(DISTINCT l.status, ', ') as lease_statuses
FROM public.tenants t
LEFT JOIN public.lease_tenants lt ON t.id = lt.tenant_id
LEFT JOIN public.leases l ON lt.lease_id = l.id
LEFT JOIN public.units u ON l.unit_id = u.id
GROUP BY t.id, t.first_name, t.last_name, t.email
ORDER BY t.created_at DESC;

-- Show units and their occupancy
SELECT 
  'Units and their occupancy:' as info,
  u.id as unit_id,
  u.name as unit_name,
  u.status as unit_status,
  p.name as property_name,
  COUNT(l.id) as total_leases,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_leases,
  STRING_AGG(DISTINCT t.first_name || ' ' || t.last_name, ', ') as tenants
FROM public.units u
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.leases l ON u.id = l.unit_id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
GROUP BY u.id, u.name, u.status, p.name
ORDER BY u.created_at DESC;

-- Show leases and their relationships
SELECT 
  'Leases and relationships:' as info,
  l.id as lease_id,
  l.start_date,
  l.end_date,
  l.status,
  u.name as unit_name,
  u.status as unit_status,
  COUNT(lt.tenant_id) as tenant_count,
  STRING_AGG(t.first_name || ' ' || t.last_name, ', ') as tenants
FROM public.leases l
LEFT JOIN public.units u ON l.unit_id = u.id
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
GROUP BY l.id, l.start_date, l.end_date, l.status, u.name, u.status
ORDER BY l.created_at DESC;

-- 2. Fix the correlations
DO $$
DECLARE
  lease_record RECORD;
  unit_record RECORD;
BEGIN
  RAISE NOTICE 'Starting correlation fixes...';
  
  -- Update unit status based on active leases
  FOR unit_record IN 
    SELECT 
      u.id as unit_id,
      u.status as current_status,
      COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_lease_count
    FROM public.units u
    LEFT JOIN public.leases l ON u.id = l.unit_id
    GROUP BY u.id, u.status
  LOOP
    IF unit_record.active_lease_count > 0 AND unit_record.current_status != 'occupied' THEN
      UPDATE public.units 
      SET status = 'occupied' 
      WHERE id = unit_record.unit_id;
      RAISE NOTICE 'Updated unit % to occupied (has % active leases)', unit_record.unit_id, unit_record.active_lease_count;
    ELSIF unit_record.active_lease_count = 0 AND unit_record.current_status = 'occupied' THEN
      UPDATE public.units 
      SET status = 'vacant' 
      WHERE id = unit_record.unit_id;
      RAISE NOTICE 'Updated unit % to vacant (no active leases)', unit_record.unit_id;
    END IF;
  END LOOP;
  
  -- Ensure all active leases have tenant relationships
  FOR lease_record IN 
    SELECT 
      l.id as lease_id,
      l.status,
      COUNT(lt.tenant_id) as tenant_count
    FROM public.leases l
    LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
    GROUP BY l.id, l.status
    HAVING COUNT(lt.tenant_id) = 0
  LOOP
    RAISE NOTICE 'Found lease % with no tenants - status: %', lease_record.lease_id, lease_record.status;
    
    -- If there are tenants available, try to assign one
    IF EXISTS (SELECT 1 FROM public.tenants LIMIT 1) THEN
      INSERT INTO public.lease_tenants (lease_id, tenant_id, is_primary)
      SELECT 
        lease_record.lease_id,
        t.id,
        true
      FROM public.tenants t
      LEFT JOIN public.lease_tenants lt ON t.id = lt.tenant_id
      WHERE lt.tenant_id IS NULL  -- Tenant not already assigned to a lease
      LIMIT 1
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Assigned tenant to lease %', lease_record.lease_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Correlation fixes completed';
END $$;

-- 3. Show results after fixes
SELECT 'RESULTS AFTER FIXES' as section;

-- Show updated tenant-lease relationships
SELECT 
  'Updated Tenants:' as info,
  t.id as tenant_id,
  t.first_name,
  t.last_name,
  COUNT(lt.lease_id) as total_leases,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_leases,
  STRING_AGG(DISTINCT u.name, ', ') as current_units
FROM public.tenants t
LEFT JOIN public.lease_tenants lt ON t.id = lt.tenant_id
LEFT JOIN public.leases l ON lt.lease_id = l.id AND l.status = 'active'
LEFT JOIN public.units u ON l.unit_id = u.id
GROUP BY t.id, t.first_name, t.last_name
ORDER BY active_leases DESC, t.created_at DESC;

-- Show updated unit occupancy
SELECT 
  'Updated Units:' as info,
  u.id as unit_id,
  u.name as unit_name,
  u.status as unit_status,
  p.name as property_name,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_leases,
  STRING_AGG(DISTINCT t.first_name || ' ' || t.last_name, ', ') as current_tenants
FROM public.units u
LEFT JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.leases l ON u.id = l.unit_id AND l.status = 'active'
LEFT JOIN public.lease_tenants lt ON l.id = lt.lease_id
LEFT JOIN public.tenants t ON lt.tenant_id = t.id
GROUP BY u.id, u.name, u.status, p.name
ORDER BY active_leases DESC, u.created_at DESC;
