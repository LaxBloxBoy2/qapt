-- Test script for finances module
-- Run this in Supabase SQL Editor to test the finances functionality

-- First, run the schema file: supabase/finances-schema-safe.sql

-- Then run this test script to create sample data

-- Insert sample vendors
INSERT INTO public.vendors (name, email, phone, address) VALUES
('ABC Plumbing Services', 'contact@abcplumbing.com', '555-0101', '123 Main St, City, State'),
('Electric Pro', 'info@electricpro.com', '555-0102', '456 Oak Ave, City, State'),
('Green Landscaping', 'hello@greenlandscape.com', '555-0103', '789 Pine Rd, City, State')
ON CONFLICT DO NOTHING;

-- Insert transactions with tenant references for balances
INSERT INTO public.transactions (
  type, subtype, category_id, tenant_id, amount, status, due_date, description
) VALUES
-- Tenant 1 - Outstanding rent (overdue)
(
  'income',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Rent' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 0),
  1500.00,
  'overdue',
  CURRENT_DATE - INTERVAL '15 days',
  'Monthly rent payment - January 2024'
),
-- Tenant 1 - Late fee (pending)
(
  'income',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Late Fees' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 0),
  75.00,
  'pending',
  CURRENT_DATE - INTERVAL '5 days',
  'Late payment fee'
),
-- Tenant 2 - Outstanding rent (overdue - 45 days)
(
  'income',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Rent' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 1),
  1200.00,
  'overdue',
  CURRENT_DATE - INTERVAL '45 days',
  'Monthly rent payment - December 2023'
),
-- Tenant 2 - Another overdue rent (75 days)
(
  'income',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Rent' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 1),
  1200.00,
  'overdue',
  CURRENT_DATE - INTERVAL '75 days',
  'Monthly rent payment - November 2023'
),
-- Tenant 3 - Recent overdue (95 days - critical aging)
(
  'income',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Rent' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 2),
  1800.00,
  'overdue',
  CURRENT_DATE - INTERVAL '95 days',
  'Monthly rent payment - October 2023'
),
-- Tenant 3 - Pet fee (pending)
(
  'income',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Pet Fees' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 2),
  300.00,
  'pending',
  CURRENT_DATE + INTERVAL '10 days',
  'Monthly pet fee'
),
-- Some paid transactions for summary
(
  'income',
  'payment',
  (SELECT id FROM public.transaction_categories WHERE name = 'Rent' AND type = 'income' LIMIT 1),
  (SELECT id FROM public.tenants LIMIT 1 OFFSET 0),
  1500.00,
  'paid',
  CURRENT_DATE - INTERVAL '30 days',
  'Monthly rent payment - December 2023'
),
-- Expense transactions
(
  'expense',
  'invoice',
  (SELECT id FROM public.transaction_categories WHERE name = 'Maintenance' AND type = 'expense' LIMIT 1),
  NULL,
  250.00,
  'pending',
  CURRENT_DATE + INTERVAL '30 days',
  'Kitchen sink repair'
),
(
  'expense',
  'payment',
  (SELECT id FROM public.transaction_categories WHERE name = 'Utilities' AND type = 'expense' LIMIT 1),
  NULL,
  120.00,
  'paid',
  CURRENT_DATE - INTERVAL '5 days',
  'Monthly electricity bill'
);

-- Update expense transactions with vendor references
UPDATE public.transactions
SET vendor_id = (SELECT id FROM public.vendors LIMIT 1)
WHERE type = 'expense' AND vendor_id IS NULL;

-- Check if data was inserted successfully
SELECT
  'Sample data created successfully!' as message,
  (SELECT COUNT(*) FROM public.vendors) as vendor_count,
  (SELECT COUNT(*) FROM public.transactions) as transaction_count,
  (SELECT COUNT(*) FROM public.transaction_categories) as category_count;
