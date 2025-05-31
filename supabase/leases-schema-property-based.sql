-- Leases Schema for QAPT (Property-based RLS version)

-- Leases Table - Using property relationship for RLS instead of direct user_id
CREATE TABLE IF NOT EXISTS public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC,
  status TEXT GENERATED ALWAYS AS (
    CASE
      WHEN start_date > CURRENT_DATE THEN 'upcoming'
      WHEN end_date < CURRENT_DATE THEN 'expired'
      ELSE 'active'
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lease Tenants Junction Table
CREATE TABLE IF NOT EXISTS public.lease_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lease_id, tenant_id)
);

-- Lease Attachments Table
CREATE TABLE IF NOT EXISTS public.lease_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage bucket for lease files
INSERT INTO storage.buckets (id, name, public) VALUES ('lease-files', 'lease-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create trigger to update the updated_at column
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    EXECUTE $func$
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    $func$;
  END IF;
END
$do$;

-- Create trigger on leases table
CREATE TRIGGER set_leases_updated_at
BEFORE UPDATE ON public.leases
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leases based on property ownership
CREATE POLICY "Users can view leases for their properties"
ON public.leases
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.units
    JOIN public.properties ON units.property_id = properties.id
    WHERE units.id = leases.unit_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert leases for their properties"
ON public.leases
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.units
    JOIN public.properties ON units.property_id = properties.id
    WHERE units.id = unit_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update leases for their properties"
ON public.leases
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.units
    JOIN public.properties ON units.property_id = properties.id
    WHERE units.id = leases.unit_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete leases for their properties"
ON public.leases
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.units
    JOIN public.properties ON units.property_id = properties.id
    WHERE units.id = leases.unit_id
    AND properties.user_id = auth.uid()
  )
);

-- Create RLS policies for lease_tenants
CREATE POLICY "Users can view lease_tenants for their properties"
ON public.lease_tenants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_tenants.lease_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert lease_tenants for their properties"
ON public.lease_tenants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update lease_tenants for their properties"
ON public.lease_tenants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_tenants.lease_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete lease_tenants for their properties"
ON public.lease_tenants
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_tenants.lease_id
    AND properties.user_id = auth.uid()
  )
);

-- Create RLS policies for lease_attachments
CREATE POLICY "Users can view lease_attachments for their properties"
ON public.lease_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_attachments.lease_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert lease_attachments for their properties"
ON public.lease_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update lease_attachments for their properties"
ON public.lease_attachments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_attachments.lease_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete lease_attachments for their properties"
ON public.lease_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.leases
    JOIN public.units ON leases.unit_id = units.id
    JOIN public.properties ON units.property_id = properties.id
    WHERE leases.id = lease_attachments.lease_id
    AND properties.user_id = auth.uid()
  )
);

-- Allow authenticated users to upload and delete files in the lease-files bucket
CREATE POLICY "Allow authenticated users to upload lease files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lease-files' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to view lease files they own"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lease-files' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to update lease files they own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lease-files' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to delete lease files they own"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lease-files' AND owner = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_attachments TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS leases_unit_id_idx ON public.leases (unit_id);
CREATE INDEX IF NOT EXISTS leases_status_idx ON public.leases (status);
CREATE INDEX IF NOT EXISTS lease_tenants_lease_id_idx ON public.lease_tenants (lease_id);
CREATE INDEX IF NOT EXISTS lease_tenants_tenant_id_idx ON public.lease_tenants (tenant_id);
CREATE INDEX IF NOT EXISTS lease_attachments_lease_id_idx ON public.lease_attachments (lease_id);
