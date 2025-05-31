-- Fix RLS policies for inspection_sections table

-- First, check if the inspection_sections table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inspection_sections'
  ) THEN
    -- Drop existing RLS policies for inspection_sections if they exist
    DROP POLICY IF EXISTS "Users can view their inspection sections" ON public.inspection_sections;
    DROP POLICY IF EXISTS "Users can insert inspection sections" ON public.inspection_sections;
    DROP POLICY IF EXISTS "Users can update inspection sections" ON public.inspection_sections;
    DROP POLICY IF EXISTS "Users can delete inspection sections" ON public.inspection_sections;

    -- Create new RLS policies for inspection_sections
    CREATE POLICY "Users can view their inspection sections"
    ON public.inspection_sections
    FOR SELECT
    USING (
      inspection_id IN (
        SELECT id FROM inspections WHERE created_by = auth.uid() OR
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      )
    );

    CREATE POLICY "Users can insert inspection sections"
    ON public.inspection_sections
    FOR INSERT
    WITH CHECK (
      inspection_id IN (
        SELECT id FROM inspections WHERE created_by = auth.uid() OR
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      )
    );

    CREATE POLICY "Users can update inspection sections"
    ON public.inspection_sections
    FOR UPDATE
    USING (
      inspection_id IN (
        SELECT id FROM inspections WHERE created_by = auth.uid() OR
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      )
    );

    CREATE POLICY "Users can delete inspection sections"
    ON public.inspection_sections
    FOR DELETE
    USING (
      inspection_id IN (
        SELECT id FROM inspections WHERE created_by = auth.uid() OR
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      )
    );

    RAISE NOTICE 'RLS policies for inspection_sections updated successfully.';
  ELSE
    RAISE NOTICE 'The inspection_sections table does not exist.';
  END IF;
END
$$;
