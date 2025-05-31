-- EMERGENCY FIX FOR AUTHENTICATION ISSUES
-- Run this in Supabase SQL Editor to fix login problems

-- 1. Drop and recreate user_profiles table with correct structure
DROP TABLE IF EXISTS public.user_profiles CASCADE;

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL DEFAULT 'property_manager' CHECK (role IN ('admin', 'property_manager', 'team_member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies
DROP POLICY IF EXISTS "Allow select access to own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update access to own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert access to own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow full access to own profile" ON public.user_profiles;

-- 4. Create simple, working RLS policies
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- 6. Create or update trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'property_manager')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 7. Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Create profiles for existing users who don't have one
INSERT INTO public.user_profiles (id, full_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User') as full_name,
  'property_manager' as role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 9. Create a function to manually fix a user's profile
CREATE OR REPLACE FUNCTION public.fix_user_profile(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result TEXT;
BEGIN
  -- Find the user by email
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN 'User not found with email: ' || user_email;
  END IF;
  
  -- Delete existing profile
  DELETE FROM public.user_profiles WHERE id = user_id;
  
  -- Create new profile
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (user_id, 'User', 'property_manager');
  
  RETURN 'Profile fixed for user: ' || user_email || ' (ID: ' || user_id || ')';
END;
$$;

-- 10. Fix the specific user that's having issues
-- Replace 'anwarlaxiro@gmail.com' with your actual email if different
SELECT public.fix_user_profile('anwarlaxiro@gmail.com');

-- 11. Verify the fix
SELECT 
  au.email,
  au.id as user_id,
  up.full_name,
  up.role,
  up.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at;

-- 12. Test RLS policies
SELECT 'RLS Test: Can view profiles' as test,
       COUNT(*) as profile_count
FROM public.user_profiles;

NOTIFY pgrst, 'reload schema';
