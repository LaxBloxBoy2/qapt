-- Tenants Schema for QAPT

-- First, check if the units table exists
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'units'
  ) THEN
    RAISE EXCEPTION 'public.units table does not exist - please create it first';
  END IF;
END
$check$;

-- Drop existing tenants table if it exists (to avoid conflicts)
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Tenants Table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT NOT NULL,
  secondary_email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  is_company BOOLEAN DEFAULT false,
  company_name TEXT,
  date_of_birth DATE,
  forwarding_address TEXT,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy for selecting tenants (users can only see their own tenants)
CREATE POLICY "Users can view their own tenants"
ON public.tenants
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for inserting tenants (authenticated users can insert)
CREATE POLICY "Users can insert their own tenants"
ON public.tenants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for updating tenants (users can only update their own tenants)
CREATE POLICY "Users can update their own tenants"
ON public.tenants
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for deleting tenants (users can only delete their own tenants)
CREATE POLICY "Users can delete their own tenants"
ON public.tenants
FOR DELETE
USING (auth.uid() = user_id);

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

-- Create trigger on tenants table
CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS tenants_user_id_idx ON public.tenants (user_id);

-- Create index on unit_id for faster joins
CREATE INDEX IF NOT EXISTS tenants_unit_id_idx ON public.tenants (unit_id);

-- Create index on email for faster searches
CREATE INDEX IF NOT EXISTS tenants_email_idx ON public.tenants (email);

-- Create index on name fields for faster searches
CREATE INDEX IF NOT EXISTS tenants_name_idx ON public.tenants (first_name, last_name);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
