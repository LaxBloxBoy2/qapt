-- Property Detail Tables for QAPT

-- Property Photos Table
CREATE TABLE IF NOT EXISTS public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Property Features Table
CREATE TABLE IF NOT EXISTS public.property_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- amenities, features, community, custom
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Property Specs Table
CREATE TABLE IF NOT EXISTS public.property_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- keys, doors, flooring, paints
  name TEXT NOT NULL,
  details TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Property Loans Table
CREATE TABLE IF NOT EXISTS public.property_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE,
  loan_amount NUMERIC,
  interest_rate NUMERIC,
  loan_type TEXT,
  period_years INTEGER,
  current_balance NUMERIC,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Property Purchases Table
CREATE TABLE IF NOT EXISTS public.property_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  purchase_date DATE,
  purchase_price NUMERIC,
  down_payment NUMERIC,
  depreciation_years NUMERIC,
  land_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Property Insurances Table
CREATE TABLE IF NOT EXISTS public.property_insurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  agent_name TEXT,
  agent_email TEXT,
  agent_phone TEXT,
  policy_number TEXT NOT NULL,
  effective_date DATE,
  expiration_date DATE,
  premium NUMERIC,
  notify_before_expiration BOOLEAN DEFAULT false,
  details TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Property Service Providers Table
CREATE TABLE IF NOT EXISTS public.property_service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- responsibility, utility
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_service_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_photos
CREATE POLICY "Users can view photos of own properties"
ON public.property_photos
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert photos to own properties"
ON public.property_photos
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update photos of own properties"
ON public.property_photos
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete photos of own properties"
ON public.property_photos
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for property_features
CREATE POLICY "Users can view features of own properties"
ON public.property_features
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert features to own properties"
ON public.property_features
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update features of own properties"
ON public.property_features
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete features of own properties"
ON public.property_features
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for property_specs
CREATE POLICY "Users can view specs of own properties"
ON public.property_specs
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert specs to own properties"
ON public.property_specs
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update specs of own properties"
ON public.property_specs
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete specs of own properties"
ON public.property_specs
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for property_loans
CREATE POLICY "Users can view loans of own properties"
ON public.property_loans
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert loans to own properties"
ON public.property_loans
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update loans of own properties"
ON public.property_loans
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete loans of own properties"
ON public.property_loans
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for property_purchases
CREATE POLICY "Users can view purchases of own properties"
ON public.property_purchases
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert purchases to own properties"
ON public.property_purchases
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update purchases of own properties"
ON public.property_purchases
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete purchases of own properties"
ON public.property_purchases
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for property_insurances
CREATE POLICY "Users can view insurances of own properties"
ON public.property_insurances
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert insurances to own properties"
ON public.property_insurances
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update insurances of own properties"
ON public.property_insurances
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete insurances of own properties"
ON public.property_insurances
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for property_service_providers
CREATE POLICY "Users can view service providers of own properties"
ON public.property_service_providers
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert service providers to own properties"
ON public.property_service_providers
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update service providers of own properties"
ON public.property_service_providers
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete service providers of own properties"
ON public.property_service_providers
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_specs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_loans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_insurances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_service_providers TO authenticated;

-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload and delete files in the property-photos bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Allow authenticated users to update files they own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-photos' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to delete files they own"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-photos' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'property-photos');

-- Allow public access to files in the property-photos bucket
CREATE POLICY "Allow public access to property photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-photos');
