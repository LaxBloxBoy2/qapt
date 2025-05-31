-- Fix User Profiles Table
-- Run this in your Supabase SQL Editor to set up user profiles functionality

-- 1. Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    avatar_url TEXT,
    
    -- Role and Status
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = id);

-- 5. Create or replace function to get/create user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS public.user_profiles AS $$
DECLARE
    profile public.user_profiles;
    user_email TEXT;
BEGIN
    -- Try to get existing profile
    SELECT * INTO profile
    FROM public.user_profiles
    WHERE id = p_user_id;
    
    -- If no profile exists, create one with user's email
    IF NOT FOUND THEN
        -- Get user's email from auth.users
        SELECT email INTO user_email
        FROM auth.users
        WHERE id = p_user_id;
        
        INSERT INTO public.user_profiles (
            id, email, full_name, role, status
        ) VALUES (
            p_user_id, user_email, user_email, 'user', 'active'
        ) RETURNING * INTO profile;
    END IF;
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;

-- 8. Create storage bucket for user files if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', true)
ON CONFLICT DO NOTHING;

-- 9. Storage policies for user files
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-files' AND auth.role() = 'authenticated');

-- 10. Test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_user_profile_setup()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT := '';
    current_user_id UUID;
    test_profile public.user_profiles;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN 'ERROR: No authenticated user found';
    END IF;
    
    -- Test the get_user_profile function
    BEGIN
        SELECT * INTO test_profile FROM public.get_user_profile(current_user_id);
        test_result := test_result || 'SUCCESS: get_user_profile works. ';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || 'ERROR: get_user_profile failed - ' || SQLERRM || '. ';
    END;
    
    -- Test direct table access
    BEGIN
        SELECT * INTO test_profile FROM public.user_profiles WHERE id = current_user_id;
        test_result := test_result || 'SUCCESS: Direct table access works. ';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || 'ERROR: Direct table access failed - ' || SQLERRM || '. ';
    END;
    
    -- Test update
    BEGIN
        UPDATE public.user_profiles 
        SET full_name = COALESCE(full_name, 'Test User'), updated_at = NOW()
        WHERE id = current_user_id;
        test_result := test_result || 'SUCCESS: Update works. ';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || 'ERROR: Update failed - ' || SQLERRM || '. ';
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION public.test_user_profile_setup() TO authenticated;

-- Success message
SELECT 'User profiles setup completed! You can test by calling: SELECT public.test_user_profile_setup();' as setup_status;
