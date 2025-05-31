-- Diagnose Lease Status Issue
-- This script will check why lease status shows as "Unknown"

-- 1. Check the table structure
SELECT
  'Table Structure:' as section,
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leases'
ORDER BY ordinal_position;

-- 2. Check what status values currently exist
SELECT
  'Current Status Values:' as section,
  status,
  COUNT(*) as count
FROM public.leases
GROUP BY status
ORDER BY count DESC;

-- 3. Show sample leases with their actual vs calculated status
SELECT
  'Sample Leases:' as section,
  id,
  start_date,
  end_date,
  status as actual_status,
  CASE
    WHEN start_date > CURRENT_DATE THEN 'upcoming'
    WHEN end_date < CURRENT_DATE THEN 'expired'
    ELSE 'active'
  END as should_be_status,
  CASE
    WHEN status IS NULL THEN 'NULL'
    WHEN status = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE'
  END as status_type
FROM public.leases
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if the status column is properly set up as generated
SELECT
  'Status Column Info:' as section,
  column_name,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leases'
  AND column_name = 'status';

-- 5. If status is generated, check if the expression is working
SELECT
  'Generated Column Test:' as section,
  COUNT(*) as total_leases,
  COUNT(status) as leases_with_status,
  COUNT(*) - COUNT(status) as leases_with_null_status
FROM public.leases;
