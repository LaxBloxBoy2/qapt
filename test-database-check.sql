-- Quick database check to see what tables exist and their data

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (
  VALUES 
    ('transactions'),
    ('transaction_categories'),
    ('vendors'),
    ('transaction_attachments'),
    ('properties'),
    ('units'),
    ('tenants'),
    ('leases')
) AS t(table_name);

-- Check data counts
SELECT 'transactions' as table_name, COUNT(*) as count FROM public.transactions
UNION ALL
SELECT 'transaction_categories', COUNT(*) FROM public.transaction_categories
UNION ALL
SELECT 'vendors', COUNT(*) FROM public.vendors
UNION ALL
SELECT 'properties', COUNT(*) FROM public.properties
UNION ALL
SELECT 'units', COUNT(*) FROM public.units
UNION ALL
SELECT 'tenants', COUNT(*) FROM public.tenants;

-- Show sample transactions if any exist
SELECT 
  id,
  type,
  subtype,
  amount,
  status,
  description,
  property_id,
  category_id,
  vendor_id,
  created_at
FROM public.transactions 
LIMIT 5;

-- Show categories
SELECT id, name, type, parent_id FROM public.transaction_categories ORDER BY type, name;
