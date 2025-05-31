-- Fix all inspection-related tables and their RLS policies

-- 1. Fix the foreign key relationship between inspections and properties tables
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inspections'
  ) THEN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
      SELECT FROM information_schema.table_constraints 
      WHERE constraint_name = 'inspections_property_id_fkey' 
      AND table_name = 'inspections'
    ) THEN
      ALTER TABLE public.inspections DROP CONSTRAINT inspections_property_id_fkey;
    END IF;

    -- Add the foreign key constraint with ON DELETE CASCADE
    ALTER TABLE public.inspections
    ADD CONSTRAINT inspections_property_id_fkey
    FOREIGN KEY (property_id)
    REFERENCES public.properties(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Foreign key constraint updated successfully.';
  ELSE
    RAISE NOTICE 'The inspections table does not exist.';
  END IF;
END
$$;

-- 2. Fix RLS policies for inspections table
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inspections'
  ) THEN
    -- Drop existing RLS policies for inspections if they exist
    DROP POLICY IF EXISTS "Users can view their own inspections" ON public.inspections;
    DROP POLICY IF EXISTS "Users can insert their own inspections" ON public.inspections;
    DROP POLICY IF EXISTS "Users can update their own inspections" ON public.inspections;
    DROP POLICY IF EXISTS "Users can delete their own inspections" ON public.inspections;

    -- Create new RLS policies for inspections
    CREATE POLICY "Users can view their own inspections"
    ON public.inspections
    FOR SELECT
    USING (
      created_by = auth.uid() OR
      property_id IN (
        SELECT id FROM properties WHERE user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can insert their own inspections"
    ON public.inspections
    FOR INSERT
    WITH CHECK (
      created_by = auth.uid() OR
      property_id IN (
        SELECT id FROM properties WHERE user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can update their own inspections"
    ON public.inspections
    FOR UPDATE
    USING (
      created_by = auth.uid() OR
      property_id IN (
        SELECT id FROM properties WHERE user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can delete their own inspections"
    ON public.inspections
    FOR DELETE
    USING (
      created_by = auth.uid() OR
      property_id IN (
        SELECT id FROM properties WHERE user_id = auth.uid()
      )
    );

    RAISE NOTICE 'RLS policies for inspections updated successfully.';
  ELSE
    RAISE NOTICE 'The inspections table does not exist.';
  END IF;
END
$$;

-- 3. Fix RLS policies for inspection_sections table
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

-- 4. Fix RLS policies for inspection_conditions table
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

-- 5. Fix RLS policies for inspection_media table
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
