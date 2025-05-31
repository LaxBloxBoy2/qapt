  -- Complete Schema for QAPT Property Management System

-- User Profiles Table (already exists, but included for completeness)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'team_member')),
  created_at TIMESTAMP DEFAULT now()
);

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT,
  type TEXT, -- e.g., residential, commercial
  status TEXT CHECK (status IN ('active', 'inactive', 'archived')),
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Units Table
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT,
  floor TEXT,
  size INTEGER,
  rent NUMERIC,
  status TEXT CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMP DEFAULT now()
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Leases Table
CREATE TABLE IF NOT EXISTS public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  tenant_id uuid REFERENCES tenants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent NUMERIC,
  deposit NUMERIC,
  status TEXT CHECK (status IN ('upcoming', 'active', 'expired')),
  created_at TIMESTAMP DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid REFERENCES leases(id),
  property_id uuid REFERENCES properties(id),
  type TEXT CHECK (type IN ('income', 'expense')),
  amount NUMERIC,
  date DATE,
  description TEXT,
  category TEXT, -- rent, maintenance, utilities, etc.
  created_at TIMESTAMP DEFAULT now()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  lease_id uuid REFERENCES leases(id),
  tenant_id uuid REFERENCES tenants(id),
  file_name TEXT,
  file_url TEXT,
  uploaded_by uuid REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Properties
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
CREATE POLICY "Users can view own properties"
ON public.properties
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
CREATE POLICY "Users can insert own properties"
ON public.properties
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
CREATE POLICY "Users can update own properties"
ON public.properties
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties"
ON public.properties
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for Units (based on property ownership)
DROP POLICY IF EXISTS "Users can view units of own properties" ON public.units;
CREATE POLICY "Users can view units of own properties"
ON public.units
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert units to own properties" ON public.units;
CREATE POLICY "Users can insert units to own properties"
ON public.units
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update units of own properties" ON public.units;
CREATE POLICY "Users can update units of own properties"
ON public.units
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete units of own properties" ON public.units;
CREATE POLICY "Users can delete units of own properties"
ON public.units
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- RLS Policies for Tenants (all users can access tenants)
DROP POLICY IF EXISTS "Users can access tenants" ON public.tenants;
CREATE POLICY "Users can access tenants"
ON public.tenants
FOR ALL
USING (true);

-- RLS Policies for Leases (based on property ownership via units)
DROP POLICY IF EXISTS "Users can view leases of own properties" ON public.leases;
CREATE POLICY "Users can view leases of own properties"
ON public.leases
FOR SELECT
USING (
  unit_id IN (
    SELECT u.id FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert leases to own properties" ON public.leases;
CREATE POLICY "Users can insert leases to own properties"
ON public.leases
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT u.id FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update leases of own properties" ON public.leases;
CREATE POLICY "Users can update leases of own properties"
ON public.leases
FOR UPDATE
USING (
  unit_id IN (
    SELECT u.id FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete leases of own properties" ON public.leases;
CREATE POLICY "Users can delete leases of own properties"
ON public.leases
FOR DELETE
USING (
  unit_id IN (
    SELECT u.id FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for Transactions (based on property ownership)
DROP POLICY IF EXISTS "Users can view transactions of own properties" ON public.transactions;
CREATE POLICY "Users can view transactions of own properties"
ON public.transactions
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert transactions to own properties" ON public.transactions;
CREATE POLICY "Users can insert transactions to own properties"
ON public.transactions
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update transactions of own properties" ON public.transactions;
CREATE POLICY "Users can update transactions of own properties"
ON public.transactions
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete transactions of own properties" ON public.transactions;
CREATE POLICY "Users can delete transactions of own properties"
ON public.transactions
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )
);

-- RLS Policies for Documents (based on property, lease, or tenant ownership)
DROP POLICY IF EXISTS "Users can view documents of own properties" ON public.documents;
CREATE POLICY "Users can view documents of own properties"
ON public.documents
FOR SELECT
USING (
  (property_id IS NULL OR property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) AND
  (lease_id IS NULL OR lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can insert documents to own properties" ON public.documents;
CREATE POLICY "Users can insert documents to own properties"
ON public.documents
FOR INSERT
WITH CHECK (
  (property_id IS NULL OR property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) AND
  (lease_id IS NULL OR lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can update documents of own properties" ON public.documents;
CREATE POLICY "Users can update documents of own properties"
ON public.documents
FOR UPDATE
USING (
  (property_id IS NULL OR property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) AND
  (lease_id IS NULL OR lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can delete documents of own properties" ON public.documents;
CREATE POLICY "Users can delete documents of own properties"
ON public.documents
FOR DELETE
USING (
  (property_id IS NULL OR property_id IN (
    SELECT id FROM public.properties WHERE user_id = auth.uid()
  )) AND
  (lease_id IS NULL OR lease_id IN (
    SELECT l.id FROM public.leases l
    JOIN public.units u ON l.unit_id = u.id
    JOIN public.properties p ON u.property_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
