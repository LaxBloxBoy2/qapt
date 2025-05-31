-- Fix RLS policies for inspection_media table

-- First, check if the inspection_media table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inspection_media'
  ) THEN
    -- Drop existing RLS policies for inspection_media if they exist
    DROP POLICY IF EXISTS "Users can view their inspection media" ON public.inspection_media;
    DROP POLICY IF EXISTS "Users can insert inspection media" ON public.inspection_media;
    DROP POLICY IF EXISTS "Users can update inspection media" ON public.inspection_media;
    DROP POLICY IF EXISTS "Users can delete inspection media" ON public.inspection_media;

    -- Create new RLS policies for inspection_media
    CREATE POLICY "Users can view their inspection media"
    ON public.inspection_media
    FOR SELECT
    USING (
      condition_id IN (
        SELECT id FROM inspection_conditions WHERE section_id IN (
          SELECT id FROM inspection_sections WHERE inspection_id IN (
            SELECT id FROM inspections WHERE created_by = auth.uid() OR
            property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
          )
        )
      )
    );

    CREATE POLICY "Users can insert inspection media"
    ON public.inspection_media
    FOR INSERT
    WITH CHECK (
      condition_id IN (
        SELECT id FROM inspection_conditions WHERE section_id IN (
          SELECT id FROM inspection_sections WHERE inspection_id IN (
            SELECT id FROM inspections WHERE created_by = auth.uid() OR
            property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
          )
        )
      )
    );

    CREATE POLICY "Users can update inspection media"
    ON public.inspection_media
    FOR UPDATE
    USING (
      condition_id IN (
        SELECT id FROM inspection_conditions WHERE section_id IN (
          SELECT id FROM inspection_sections WHERE inspection_id IN (
            SELECT id FROM inspections WHERE created_by = auth.uid() OR
            property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
          )
        )
      )
    );

    CREATE POLICY "Users can delete inspection media"
    ON public.inspection_media
    FOR DELETE
    USING (
      condition_id IN (
        SELECT id FROM inspection_conditions WHERE section_id IN (
          SELECT id FROM inspection_sections WHERE inspection_id IN (
            SELECT id FROM inspections WHERE created_by = auth.uid() OR
            property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
          )
        )
      )
    );

    RAISE NOTICE 'RLS policies for inspection_media updated successfully.';
  ELSE
    RAISE NOTICE 'The inspection_media table does not exist.';
  END IF;
END
$$;
