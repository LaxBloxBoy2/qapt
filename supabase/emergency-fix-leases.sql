-- EMERGENCY FIX FOR LEASES INTERNAL SERVER ERROR

-- First, check if the leases table exists and has the required columns
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if leases table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leases'
  ) THEN
    -- Create the leases table with all required columns
    CREATE TABLE public.leases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
      rent_amount NUMERIC NOT NULL DEFAULT 0,
      deposit_amount NUMERIC,
      security_deposit NUMERIC, -- Alternative name
      deposit NUMERIC, -- Another alternative name
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created leases table with all required columns';
  ELSE
    RAISE NOTICE 'Leases table exists, checking for required columns...';
    
    -- Check and add rent_amount column if it doesn't exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases' 
      AND column_name = 'rent_amount'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE public.leases ADD COLUMN rent_amount NUMERIC NOT NULL DEFAULT 0;
      RAISE NOTICE 'Added rent_amount column';
    END IF;
    
    -- Check and add deposit_amount column if it doesn't exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases' 
      AND column_name = 'deposit_amount'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE public.leases ADD COLUMN deposit_amount NUMERIC;
      RAISE NOTICE 'Added deposit_amount column';
    END IF;
    
    -- Check and add security_deposit column if it doesn't exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases' 
      AND column_name = 'security_deposit'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE public.leases ADD COLUMN security_deposit NUMERIC;
      RAISE NOTICE 'Added security_deposit column';
    END IF;
    
    -- Check and add deposit column if it doesn't exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases' 
      AND column_name = 'deposit'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE public.leases ADD COLUMN deposit NUMERIC;
      RAISE NOTICE 'Added deposit column';
    END IF;
    
    -- Check and add notes column if it doesn't exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases' 
      AND column_name = 'notes'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE public.leases ADD COLUMN notes TEXT;
      RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Check and add status column if it doesn't exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leases' 
      AND column_name = 'status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE public.leases ADD COLUMN status TEXT DEFAULT 'active';
      
      -- Update status values
      UPDATE public.leases
      SET status = 
        CASE
          WHEN start_date > CURRENT_DATE THEN 'upcoming'
          WHEN end_date < CURRENT_DATE THEN 'expired'
          ELSE 'active'
        END;
        
      RAISE NOTICE 'Added status column and updated values';
    END IF;
  END IF;
END $$;

-- Make sure lease_tenants table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lease_tenants'
  ) THEN
    CREATE TABLE public.lease_tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
      tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(lease_id, tenant_id)
    );
    
    RAISE NOTICE 'Created lease_tenants table';
  END IF;
END $$;

-- Make sure lease_attachments table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lease_attachments'
  ) THEN
    CREATE TABLE public.lease_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created lease_attachments table';
  END IF;
END $$;

-- Enable RLS and create policies
DO $$
BEGIN
  -- Enable RLS on leases table
  ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view leases for their properties" ON public.leases;
  DROP POLICY IF EXISTS "Users can insert leases for their properties" ON public.leases;
  DROP POLICY IF EXISTS "Users can update leases for their properties" ON public.leases;
  DROP POLICY IF EXISTS "Users can delete leases for their properties" ON public.leases;
  
  -- Create policies
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
  
  RAISE NOTICE 'Created RLS policies for leases';
  
  -- Enable RLS on lease_tenants table
  ALTER TABLE public.lease_tenants ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view lease_tenants for their properties" ON public.lease_tenants;
  DROP POLICY IF EXISTS "Users can insert lease_tenants for their properties" ON public.lease_tenants;
  DROP POLICY IF EXISTS "Users can update lease_tenants for their properties" ON public.lease_tenants;
  DROP POLICY IF EXISTS "Users can delete lease_tenants for their properties" ON public.lease_tenants;
  
  -- Create policies
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
  
  RAISE NOTICE 'Created RLS policies for lease_tenants';
  
  -- Enable RLS on lease_attachments table
  ALTER TABLE public.lease_attachments ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view lease_attachments for their properties" ON public.lease_attachments;
  DROP POLICY IF EXISTS "Users can insert lease_attachments for their properties" ON public.lease_attachments;
  DROP POLICY IF EXISTS "Users can update lease_attachments for their properties" ON public.lease_attachments;
  DROP POLICY IF EXISTS "Users can delete lease_attachments for their properties" ON public.lease_attachments;
  
  -- Create policies
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
  
  RAISE NOTICE 'Created RLS policies for lease_attachments';
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_attachments TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS leases_unit_id_idx ON public.leases (unit_id);
CREATE INDEX IF NOT EXISTS leases_status_idx ON public.leases (status);
CREATE INDEX IF NOT EXISTS lease_tenants_lease_id_idx ON public.lease_tenants (lease_id);
CREATE INDEX IF NOT EXISTS lease_tenants_tenant_id_idx ON public.lease_tenants (tenant_id);
CREATE INDEX IF NOT EXISTS lease_attachments_lease_id_idx ON public.lease_attachments (lease_id);

-- Ensure storage bucket exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.buckets 
    WHERE id = 'lease-files'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('lease-files', 'lease-files', false);
    
    RAISE NOTICE 'Created lease-files storage bucket';
  END IF;
END $$;
