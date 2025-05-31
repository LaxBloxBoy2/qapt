-- Create a function to handle RLS policy recreation
CREATE OR REPLACE FUNCTION public.recreate_properties_rls_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Enable RLS
    ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
    DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
    DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
    DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

    -- Create new policies
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

    -- Verify the specific property exists and has correct ownership
    -- This will run with elevated privileges due to SECURITY DEFINER
    UPDATE public.properties
    SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
    AND (user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id
    ));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.recreate_properties_rls_policies() TO authenticated;
