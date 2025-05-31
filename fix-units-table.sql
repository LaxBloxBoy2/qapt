-- Drop the existing units table and related tables
DROP TABLE IF EXISTS public.unit_maintenance;
DROP TABLE IF EXISTS public.unit_equipment;
DROP TABLE IF EXISTS public.unit_service_providers;
DROP TABLE IF EXISTS public.unit_specs;
DROP TABLE IF EXISTS public.units;

-- Create the units table with the correct structure
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT CHECK (
    unit_type IN ('Room', 'Apartment', 'Multiplex', 'Single-Family', 'Townhouse', 'Condo', 'Commercial')
  ) NOT NULL,
  status TEXT CHECK (
    status IN ('vacant', 'occupied', 'maintenance')
  ) DEFAULT 'vacant',
  description TEXT,
  beds INTEGER,
  baths NUMERIC,
  size NUMERIC,
  market_rent NUMERIC,
  deposit NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own units"
ON public.units FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE public.properties.id = public.units.property_id
    AND public.properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own units"
ON public.units FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE public.properties.id = property_id
    AND public.properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own units"
ON public.units FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE public.properties.id = public.units.property_id
    AND public.properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own units"
ON public.units FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE public.properties.id = public.units.property_id
    AND public.properties.user_id = auth.uid()
  )
);

-- Add index
CREATE INDEX idx_units_property_id ON public.units (property_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;

-- Create supporting tables
-- Unit Specs Table
CREATE TABLE IF NOT EXISTS public.unit_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- keys, doors, flooring, paints
  name TEXT NOT NULL,
  details TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Unit Service Providers Table
CREATE TABLE IF NOT EXISTS public.unit_service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
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
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
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
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  reported_date TIMESTAMP DEFAULT now(),
  completed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on supporting tables
ALTER TABLE public.unit_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supporting tables
-- For unit_specs
CREATE POLICY "Users can access specs of their own units"
ON public.unit_specs
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE u.id = unit_id
    AND p.user_id = auth.uid()
  )
);

-- For unit_service_providers
CREATE POLICY "Users can access service providers of their own units"
ON public.unit_service_providers
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE u.id = unit_id
    AND p.user_id = auth.uid()
  )
);

-- For unit_equipment
CREATE POLICY "Users can access equipment of their own units"
ON public.unit_equipment
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE u.id = unit_id
    AND p.user_id = auth.uid()
  )
);

-- For unit_maintenance
CREATE POLICY "Users can access maintenance of their own units"
ON public.unit_maintenance
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    WHERE u.id = unit_id
    AND p.user_id = auth.uid()
  )
);

-- Grant permissions for supporting tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_specs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_service_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_equipment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_maintenance TO authenticated;
