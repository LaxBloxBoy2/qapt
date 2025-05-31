-- Fix RLS policies for inspection_conditions table

-- First, check if the inspection_conditions table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inspection_conditions'
  ) THEN
    -- Drop existing RLS policies for inspection_conditions if they exist
    DROP POLICY IF EXISTS "Users can view their inspection conditions" ON public.inspection_conditions;
    DROP POLICY IF EXISTS "Users can insert inspection conditions" ON public.inspection_conditions;
    DROP POLICY IF EXISTS "Users can update inspection conditions" ON public.inspection_conditions;
    DROP POLICY IF EXISTS "Users can delete inspection conditions" ON public.inspection_conditions;

    -- Create new RLS policies for inspection_conditions
    CREATE POLICY "Users can view their inspection conditions"
    ON public.inspection_conditions
    FOR SELECT
    USING (
      section_id IN (
        SELECT id FROM inspection_sections WHERE inspection_id IN (
          SELECT id FROM inspections WHERE created_by = auth.uid() OR
          property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
        )
      )
    );

    CREATE POLICY "Users can insert inspection conditions"
    ON public.inspection_conditions
    FOR INSERT
    WITH CHECK (
      section_id IN (
        SELECT id FROM inspection_sections WHERE inspection_id IN (
          SELECT id FROM inspections WHERE created_by = auth.uid() OR
          property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
        )
      )
    );

    CREATE POLICY "Users can update inspection conditions"
    ON public.inspection_conditions
    FOR UPDATE
    USING (
      section_id IN (
        SELECT id FROM inspection_sections WHERE inspection_id IN (
          SELECT id FROM inspections WHERE created_by = auth.uid() OR
          property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
        )
      )
    );

    CREATE POLICY "Users can delete inspection conditions"
    ON public.inspection_conditions
    FOR DELETE
    USING (
      section_id IN (
        SELECT id FROM inspection_sections WHERE inspection_id IN (
          SELECT id FROM inspections WHERE created_by = auth.uid() OR
          property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
        )
      )
    );

    RAISE NOTICE 'RLS policies for inspection_conditions updated successfully.';
  ELSE
    RAISE NOTICE 'The inspection_conditions table does not exist.';
  END IF;
END
$$;
