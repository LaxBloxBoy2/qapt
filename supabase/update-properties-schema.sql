-- Update Properties Table Schema

-- First, check if the properties table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
    -- Add new columns to the properties table
    BEGIN
      ALTER TABLE public.properties 
        ADD COLUMN IF NOT EXISTS city TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS zip TEXT,
        ADD COLUMN IF NOT EXISTS country TEXT,
        ADD COLUMN IF NOT EXISTS year_built INTEGER,
        ADD COLUMN IF NOT EXISTS mls_number TEXT,
        ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('single_unit', 'multi_unit')),
        ADD COLUMN IF NOT EXISTS is_mobile_home BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS beds INTEGER,
        ADD COLUMN IF NOT EXISTS baths NUMERIC,
        ADD COLUMN IF NOT EXISTS size NUMERIC,
        ADD COLUMN IF NOT EXISTS market_rent NUMERIC,
        ADD COLUMN IF NOT EXISTS deposit NUMERIC;
    EXCEPTION
      WHEN duplicate_column THEN
        RAISE NOTICE 'Column already exists in properties table.';
    END;

    -- Update the type column constraint if it exists
    BEGIN
      ALTER TABLE public.properties 
        DROP CONSTRAINT IF EXISTS properties_type_check;
      
      ALTER TABLE public.properties 
        ADD CONSTRAINT properties_type_check 
        CHECK (type IN ('single_unit', 'multi_unit'));
    EXCEPTION
      WHEN undefined_column THEN
        RAISE NOTICE 'Type column does not exist in properties table.';
    END;

    -- Update the status column constraint if it exists
    BEGIN
      ALTER TABLE public.properties 
        DROP CONSTRAINT IF EXISTS properties_status_check;
      
      ALTER TABLE public.properties 
        ADD CONSTRAINT properties_status_check 
        CHECK (status IN ('active', 'inactive', 'archived'));
    EXCEPTION
      WHEN undefined_column THEN
        RAISE NOTICE 'Status column does not exist in properties table.';
    END;

    -- Set default value for status column if it exists
    BEGIN
      ALTER TABLE public.properties 
        ALTER COLUMN status SET DEFAULT 'active';
    EXCEPTION
      WHEN undefined_column THEN
        RAISE NOTICE 'Status column does not exist in properties table.';
    END;

    RAISE NOTICE 'Properties table updated successfully.';
  ELSE
    -- Create the properties table if it doesn't exist
    CREATE TABLE public.properties (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      country TEXT,
      year_built INTEGER,
      mls_number TEXT,
      type TEXT CHECK (type IN ('single_unit', 'multi_unit')),
      is_mobile_home BOOLEAN DEFAULT false,
      beds INTEGER,
      baths NUMERIC,
      size NUMERIC,
      market_rent NUMERIC,
      deposit NUMERIC,
      status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
      description TEXT,
      created_at TIMESTAMP DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view own properties"
    ON public.properties
    FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own properties"
    ON public.properties
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own properties"
    ON public.properties
    FOR UPDATE
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own properties"
    ON public.properties
    FOR DELETE
    USING (auth.uid() = user_id);

    -- Grant permissions to authenticated users
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

    RAISE NOTICE 'Properties table created successfully.';
  END IF;
END
$$;
