-- Units Schema for QAPT

-- Units Table
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT CHECK (unit_type IN (
    'Room', 'Apartment', 'Multiplex', 'Single-Family', 'Townhouse', 'Condo', 'Commercial'
  )),
  status TEXT CHECK (status IN ('vacant', 'occupied', 'maintenance')) DEFAULT 'vacant',
  description TEXT,
  beds INTEGER,
  baths NUMERIC,
  size NUMERIC,
  market_rent NUMERIC,
  deposit NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Unit Specs Table (similar to property_specs but for units)
CREATE TABLE IF NOT EXISTS public.unit_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- keys, doors, flooring, paints
  name TEXT NOT NULL,
  details TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Unit Service Providers Table (similar to property_service_providers but for units)
CREATE TABLE IF NOT EXISTS public.unit_service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
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

-- Unit Equipment Table
CREATE TABLE IF NOT EXISTS public.unit_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiration DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Unit Maintenance Requests Table
CREATE TABLE IF NOT EXISTS public.unit_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  reported_date TIMESTAMP DEFAULT now(),
  completed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Unit Tenants Table (placeholder for future tenant management)
CREATE TABLE IF NOT EXISTS public.unit_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for units
CREATE POLICY "Users can view own units"
ON public.units
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own units"
ON public.units
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own units"
ON public.units
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own units"
ON public.units
FOR DELETE
USING (user_id = auth.uid());

-- Create RLS policies for unit_specs
CREATE POLICY "Users can view specs of own units"
ON public.unit_specs
FOR SELECT
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert specs to own units"
ON public.unit_specs
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update specs of own units"
ON public.unit_specs
FOR UPDATE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete specs of own units"
ON public.unit_specs
FOR DELETE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for unit_service_providers
CREATE POLICY "Users can view service providers of own units"
ON public.unit_service_providers
FOR SELECT
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert service providers to own units"
ON public.unit_service_providers
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update service providers of own units"
ON public.unit_service_providers
FOR UPDATE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete service providers of own units"
ON public.unit_service_providers
FOR DELETE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for unit_equipment
CREATE POLICY "Users can view equipment of own units"
ON public.unit_equipment
FOR SELECT
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert equipment to own units"
ON public.unit_equipment
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update equipment of own units"
ON public.unit_equipment
FOR UPDATE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete equipment of own units"
ON public.unit_equipment
FOR DELETE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for unit_maintenance
CREATE POLICY "Users can view maintenance of own units"
ON public.unit_maintenance
FOR SELECT
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert maintenance to own units"
ON public.unit_maintenance
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update maintenance of own units"
ON public.unit_maintenance
FOR UPDATE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete maintenance of own units"
ON public.unit_maintenance
FOR DELETE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for unit_tenants
CREATE POLICY "Users can view tenants of own units"
ON public.unit_tenants
FOR SELECT
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tenants to own units"
ON public.unit_tenants
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tenants of own units"
ON public.unit_tenants
FOR UPDATE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tenants of own units"
ON public.unit_tenants
FOR DELETE
USING (
  unit_id IN (
    SELECT id FROM public.units WHERE user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_specs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_service_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_equipment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_maintenance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_tenants TO authenticated;
