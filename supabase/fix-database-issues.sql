-- Fix Database Issues

-- Check if the leases table exists and create it if it doesn't
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leases'
  ) THEN
    RAISE NOTICE 'Creating leases table...';
    
    CREATE TABLE public.leases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
      rent_amount NUMERIC NOT NULL DEFAULT 0,
      deposit_amount NUMERIC,
      notes TEXT,
      status TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Update the status values
    UPDATE public.leases
    SET status = 
      CASE
        WHEN start_date > CURRENT_DATE THEN 'upcoming'
        WHEN end_date < CURRENT_DATE THEN 'expired'
        ELSE 'active'
      END;
      
    RAISE NOTICE 'Leases table created successfully.';
  ELSE
    RAISE NOTICE 'Leases table already exists.';
  END IF;
END
$check$;

-- Check if the lease_tenants table exists and create it if it doesn't
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lease_tenants'
  ) THEN
    RAISE NOTICE 'Creating lease_tenants table...';
    
    CREATE TABLE public.lease_tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
      tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(lease_id, tenant_id)
    );
    
    RAISE NOTICE 'lease_tenants table created successfully.';
  ELSE
    RAISE NOTICE 'lease_tenants table already exists.';
  END IF;
END
$check$;

-- Check if the lease_attachments table exists and create it if it doesn't
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lease_attachments'
  ) THEN
    RAISE NOTICE 'Creating lease_attachments table...';
    
    CREATE TABLE public.lease_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'lease_attachments table created successfully.';
  ELSE
    RAISE NOTICE 'lease_attachments table already exists.';
  END IF;
END
$check$;

-- Check if the lease-files storage bucket exists and create it if it doesn't
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.buckets 
    WHERE id = 'lease-files'
  ) THEN
    RAISE NOTICE 'Creating lease-files storage bucket...';
    
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('lease-files', 'lease-files', false);
    
    RAISE NOTICE 'lease-files storage bucket created successfully.';
  ELSE
    RAISE NOTICE 'lease-files storage bucket already exists.';
  END IF;
END
$check$;

-- Check and fix RLS policies for leases
DO $check$
BEGIN
  -- Check if RLS is enabled for leases
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'leases'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Enabling RLS for leases...';
    
    ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS enabled for leases.';
  ELSE
    RAISE NOTICE 'RLS already enabled for leases.';
  END IF;
  
  -- Check if RLS policies exist for leases
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'leases'
  ) THEN
    RAISE NOTICE 'Creating RLS policies for leases...';
    
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
    
    RAISE NOTICE 'RLS policies created for leases.';
  ELSE
    RAISE NOTICE 'RLS policies already exist for leases.';
  END IF;
END
$check$;

-- Check and fix RLS policies for lease_tenants
DO $check$
BEGIN
  -- Check if RLS is enabled for lease_tenants
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'lease_tenants'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Enabling RLS for lease_tenants...';
    
    ALTER TABLE public.lease_tenants ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS enabled for lease_tenants.';
  ELSE
    RAISE NOTICE 'RLS already enabled for lease_tenants.';
  END IF;
  
  -- Check if RLS policies exist for lease_tenants
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'lease_tenants'
  ) THEN
    RAISE NOTICE 'Creating RLS policies for lease_tenants...';
    
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
    
    RAISE NOTICE 'RLS policies created for lease_tenants.';
  ELSE
    RAISE NOTICE 'RLS policies already exist for lease_tenants.';
  END IF;
END
$check$;

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
