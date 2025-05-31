-- Safe Finances Module Schema
-- Handles existing tables and missing columns

-- Drop existing tables if they exist (to ensure clean state)
DROP TABLE IF EXISTS public.transaction_attachments CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.transaction_categories CASCADE;

-- Transaction Categories
CREATE TABLE public.transaction_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id UUID,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors/Payees
CREATE TABLE public.vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Transactions
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  subtype VARCHAR(50) NOT NULL CHECK (subtype IN (
    'invoice', 'payment', 'deposit', 'credit_note', 'return_deposit', 'apply_deposit'
  )),
  
  -- References as UUIDs
  property_id UUID,
  unit_id UUID,
  tenant_id UUID,
  lease_id UUID,
  vendor_id UUID,
  category_id UUID,
  
  -- Financial Details
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status and Dates
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  
  -- Payment Details
  payment_method VARCHAR(50),
  reference_id VARCHAR(100),
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_end_date DATE,
  parent_transaction_id UUID,
  
  -- Additional Info
  description TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Attachments
CREATE TABLE public.transaction_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.transaction_categories (name, type, description) VALUES
-- Income categories
('Rent', 'income', 'Monthly rent payments'),
('Late Fees', 'income', 'Late payment fees'),
('Pet Fees', 'income', 'Pet-related fees'),
('Parking', 'income', 'Parking fees'),
('Utilities Reimbursement', 'income', 'Tenant utility reimbursements'),
('Other Income', 'income', 'Miscellaneous income'),

-- Expense categories
('Maintenance', 'expense', 'Property maintenance and repairs'),
('Utilities', 'expense', 'Utility payments'),
('Insurance', 'expense', 'Property insurance'),
('Property Tax', 'expense', 'Property taxes'),
('Management Fees', 'expense', 'Property management fees'),
('Legal & Professional', 'expense', 'Legal and professional services'),
('Marketing', 'expense', 'Property marketing and advertising'),
('Office Expenses', 'expense', 'Office and administrative expenses'),
('Other Expenses', 'expense', 'Miscellaneous expenses');

-- Add foreign key constraints
ALTER TABLE public.transaction_categories 
ADD CONSTRAINT transaction_categories_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES public.transaction_categories(id) ON DELETE CASCADE;

ALTER TABLE public.transaction_attachments 
ADD CONSTRAINT transaction_attachments_transaction_id_fkey 
FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id) ON DELETE SET NULL;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_parent_transaction_id_fkey 
FOREIGN KEY (parent_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Insert subcategories
INSERT INTO public.transaction_categories (name, parent_id, type, description) VALUES
-- Maintenance subcategories
('Plumbing', (SELECT id FROM public.transaction_categories WHERE name = 'Maintenance' AND type = 'expense'), 'expense', 'Plumbing repairs and maintenance'),
('Electrical', (SELECT id FROM public.transaction_categories WHERE name = 'Maintenance' AND type = 'expense'), 'expense', 'Electrical repairs and maintenance'),
('HVAC', (SELECT id FROM public.transaction_categories WHERE name = 'Maintenance' AND type = 'expense'), 'expense', 'Heating and cooling maintenance'),
('Landscaping', (SELECT id FROM public.transaction_categories WHERE name = 'Maintenance' AND type = 'expense'), 'expense', 'Landscaping and grounds maintenance'),

-- Utilities subcategories
('Water', (SELECT id FROM public.transaction_categories WHERE name = 'Utilities' AND type = 'expense'), 'expense', 'Water utility payments'),
('Electric', (SELECT id FROM public.transaction_categories WHERE name = 'Utilities' AND type = 'expense'), 'expense', 'Electric utility payments'),
('Gas', (SELECT id FROM public.transaction_categories WHERE name = 'Utilities' AND type = 'expense'), 'expense', 'Gas utility payments'),
('Internet', (SELECT id FROM public.transaction_categories WHERE name = 'Utilities' AND type = 'expense'), 'expense', 'Internet service payments');

-- Indexes for performance
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_due_date ON public.transactions(due_date);
CREATE INDEX idx_transactions_property_id ON public.transactions(property_id);
CREATE INDEX idx_transactions_tenant_id ON public.transactions(tenant_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- RLS Policies
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;

-- Simple policies that allow all operations for testing
CREATE POLICY "Allow all operations on transaction_categories" ON public.transaction_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on vendors" ON public.vendors FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_attachments" ON public.transaction_attachments FOR ALL USING (true);

-- Create storage bucket for transaction attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-files', 'transaction-files', false)
ON CONFLICT DO NOTHING;

-- Storage policies for transaction files
CREATE POLICY "Users can upload transaction files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'transaction-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their transaction files" ON storage.objects
  FOR SELECT USING (bucket_id = 'transaction-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their transaction files" ON storage.objects
  FOR DELETE USING (bucket_id = 'transaction-files' AND auth.role() = 'authenticated');

-- Success message
SELECT 'Safe finances module schema created successfully!' as message;
