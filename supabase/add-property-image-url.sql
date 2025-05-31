-- Add image_url column to properties table
DO $$
BEGIN
    -- Check if image_url column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'image_url'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.properties
        ADD COLUMN image_url TEXT;
        
        RAISE NOTICE 'Added image_url column to properties table';
    ELSE
        RAISE NOTICE 'image_url column already exists';
    END IF;

    -- Update existing properties to ensure they have image_url set
    UPDATE public.properties
    SET image_url = NULL
    WHERE image_url IS NULL;

    -- Specifically update Reinold AP property
    UPDATE public.properties
    SET image_url = NULL
    WHERE id = '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51';

    RAISE NOTICE 'Successfully updated properties table';
END;
$$;
