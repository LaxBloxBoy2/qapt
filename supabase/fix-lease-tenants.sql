-- Fix Lease Tenants Schema for QAPT

-- First, check if the lease_tenants table exists
DO $check$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if the lease_tenants table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lease_tenants'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'lease_tenants table exists, checking structure...';
    
    -- Check if the table has the correct structure
    BEGIN
      -- Try to insert and then immediately delete a test record to verify structure
      WITH test_insert AS (
        INSERT INTO public.lease_tenants (lease_id, tenant_id, is_primary)
        VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', true)
        RETURNING id
      )
      DELETE FROM public.lease_tenants
      WHERE id IN (SELECT id FROM test_insert);
      
      RAISE NOTICE 'lease_tenants table structure is correct.';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error testing lease_tenants table: %', SQLERRM;
        RAISE NOTICE 'Will drop and recreate the table...';
        
        -- Drop the table and recreate it
        DROP TABLE IF EXISTS public.lease_tenants;
        
        CREATE TABLE public.lease_tenants (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
          tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
          is_primary BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(lease_id, tenant_id)
        );
        
        -- Enable Row Level Security
        ALTER TABLE public.lease_tenants ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
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
        
        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_tenants TO authenticated;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS lease_tenants_lease_id_idx ON public.lease_tenants (lease_id);
        CREATE INDEX IF NOT EXISTS lease_tenants_tenant_id_idx ON public.lease_tenants (tenant_id);
        
        RAISE NOTICE 'lease_tenants table recreated successfully.';
    END;
  ELSE
    RAISE NOTICE 'lease_tenants table does not exist, creating it...';
    
    -- Create the lease_tenants table
    CREATE TABLE public.lease_tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
      tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(lease_id, tenant_id)
    );
    
    -- Enable Row Level Security
    ALTER TABLE public.lease_tenants ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
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
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_tenants TO authenticated;
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS lease_tenants_lease_id_idx ON public.lease_tenants (lease_id);
    CREATE INDEX IF NOT EXISTS lease_tenants_tenant_id_idx ON public.lease_tenants (tenant_id);
    
    RAISE NOTICE 'lease_tenants table created successfully.';
  END IF;
END
$check$;
