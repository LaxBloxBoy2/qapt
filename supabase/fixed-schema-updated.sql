-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'team_member')),
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can access their own profile" ON public.user_profiles;
CREATE POLICY "Users can access their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policy to allow service role to access all profiles
CREATE POLICY "Allow service role full access" 
ON public.user_profiles 
USING (auth.role() = 'service_role');

-- Create trigger function to create user profile on signup
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

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions to authenticated users
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
