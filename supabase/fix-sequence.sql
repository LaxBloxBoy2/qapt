-- Fix the sequence issue in the user_profiles table

-- First, check if the sequence exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'user_profiles_id_seq') THEN
        DROP SEQUENCE public.user_profiles_id_seq;
    END IF;
END
$$;

-- Check if there are any grants on the sequence and revoke them if they exist
-- This is a safer approach that won't error if the sequence doesn't exist
DO $$
DECLARE
    grant_exists boolean;
BEGIN
    -- Check if the grant exists in pg_default_acl
    SELECT EXISTS (
        SELECT 1
        FROM pg_default_acl a
        JOIN pg_namespace n ON n.oid = a.defaclnamespace
        WHERE n.nspname = 'public'
        AND a.defaclacl::text LIKE '%authenticated%'
    ) INTO grant_exists;

    -- If the grant exists, try to revoke it
    IF grant_exists THEN
        BEGIN
            EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors
            RAISE NOTICE 'Could not revoke sequence grants: %', SQLERRM;
        END;
    END IF;
END
$$;

-- Re-create the trigger function to ensure it doesn't reference the sequence
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Disable RLS temporarily
  ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

  -- Insert the user profile
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (new.id, '', 'admin');

  -- Re-enable RLS
  ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Make sure RLS is re-enabled even if there's an error
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the grants to not reference the sequence
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Create a simplified function to manually create a profile for an existing user
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id UUID,
  user_full_name TEXT,
  user_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable RLS temporarily
  ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

  -- Delete any existing profile for this user
  DELETE FROM public.user_profiles WHERE id = user_id;

  -- Insert the user profile
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (user_id, user_full_name, user_role);

  -- Re-enable RLS
  ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    -- Make sure RLS is re-enabled even if there's an error
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    RAISE;
END;
$$;
