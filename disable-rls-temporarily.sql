-- TEMPORARY: Disable RLS to check if data exists
-- Run this in Supabase SQL editor to see if there's actually data

-- Disable RLS temporarily
ALTER TABLE public.leases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_attachments DISABLE ROW LEVEL SECURITY;

-- Check what data exists
SELECT 'LEASES' as table_name, count(*) as count FROM public.leases
UNION ALL
SELECT 'PROPERTIES' as table_name, count(*) as count FROM public.properties
UNION ALL
SELECT 'UNITS' as table_name, count(*) as count FROM public.units
UNION ALL
SELECT 'TENANTS' as table_name, count(*) as count FROM public.tenants
UNION ALL
SELECT 'LEASE_TENANTS' as table_name, count(*) as count FROM public.lease_tenants
UNION ALL
SELECT 'LEASE_ATTACHMENTS' as table_name, count(*) as count FROM public.lease_attachments;

-- Show actual lease data
SELECT * FROM public.leases LIMIT 10;

-- Show properties
SELECT * FROM public.properties LIMIT 10;

-- Show units
SELECT * FROM public.units LIMIT 10;

-- Re-enable RLS after checking
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_attachments ENABLE ROW LEVEL SECURITY;
