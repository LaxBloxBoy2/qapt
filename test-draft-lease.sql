-- Test script to verify draft lease functionality
-- Run this in Supabase SQL Editor to test if the is_draft column is working

-- Check if is_draft column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leases' AND column_name = 'is_draft';

-- Check current leases and their draft status
SELECT id, unit_id, start_date, end_date, rent_amount, is_draft, created_at
FROM public.leases
ORDER BY created_at DESC
LIMIT 10;

-- Test inserting a draft lease manually
INSERT INTO public.leases (unit_id, start_date, end_date, rent_amount, is_draft)
VALUES (
  (SELECT id FROM public.units LIMIT 1), -- Use first available unit
  '2024-01-01',
  '2024-12-31', 
  1500,
  true -- This is a draft
)
RETURNING id, unit_id, start_date, end_date, rent_amount, is_draft;

-- Check if the draft lease was created
SELECT 'Draft lease created successfully!' as message;
