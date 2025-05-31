-- Fix Preferences Setup
-- Run this in your Supabase SQL Editor to set up preferences functionality

-- 1. Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Regional Settings
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP')),
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),
    
    -- Appearance
    theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    
    -- Default Values
    default_country VARCHAR(2) DEFAULT 'US',
    default_rent_status VARCHAR(20) DEFAULT 'active' CHECK (default_rent_status IN ('active', 'inactive')),
    default_lease_term INTEGER DEFAULT 12 CHECK (default_lease_term BETWEEN 1 AND 60),
    default_currency_symbol VARCHAR(5) DEFAULT '$',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create helper function to get or create user preferences
CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id UUID)
RETURNS public.user_preferences AS $$
DECLARE
    preferences public.user_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO preferences
    FROM public.user_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO public.user_preferences (
            user_id, currency, date_format, timezone, language, theme,
            default_country, default_rent_status, default_lease_term, default_currency_symbol
        ) VALUES (
            p_user_id, 'USD', 'MM/DD/YYYY', 'America/New_York', 'en', 'system',
            'US', 'active', 12, '$'
        ) RETURNING * INTO preferences;
    END IF;
    
    RETURN preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences(UUID) TO authenticated;

-- 7. Create a test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_preferences_setup()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT := '';
    current_user_id UUID;
    test_prefs public.user_preferences;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN 'ERROR: No authenticated user found';
    END IF;
    
    -- Test the get_user_preferences function
    BEGIN
        SELECT * INTO test_prefs FROM public.get_user_preferences(current_user_id);
        test_result := test_result || 'SUCCESS: get_user_preferences works. ';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || 'ERROR: get_user_preferences failed - ' || SQLERRM || '. ';
    END;
    
    -- Test direct table access
    BEGIN
        SELECT * INTO test_prefs FROM public.user_preferences WHERE user_id = current_user_id;
        test_result := test_result || 'SUCCESS: Direct table access works. ';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || 'ERROR: Direct table access failed - ' || SQLERRM || '. ';
    END;
    
    -- Test update
    BEGIN
        UPDATE public.user_preferences 
        SET currency = 'EUR', updated_at = NOW()
        WHERE user_id = current_user_id;
        test_result := test_result || 'SUCCESS: Update works. ';
    EXCEPTION WHEN OTHERS THEN
        test_result := test_result || 'ERROR: Update failed - ' || SQLERRM || '. ';
    END;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission on test function
GRANT EXECUTE ON FUNCTION public.test_preferences_setup() TO authenticated;

-- Success message
SELECT 'Preferences setup completed! You can now test by calling: SELECT public.test_preferences_setup();' as setup_status;
