-- Fix property photo URLs to use just the filename
-- This script updates existing photo URLs to use just the filename without any path

-- Make sure the bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'image_url';

-- Fix any existing property photos URLs in the database
DO $$
DECLARE
    photo_record RECORD;
    filename TEXT;
BEGIN
    -- Get all property photos
    FOR photo_record IN
        SELECT id, url, storage_path, property_id
        FROM public.property_photos
    LOOP
        -- Extract just the filename from the storage_path
        filename := split_part(photo_record.storage_path, '/', array_length(string_to_array(photo_record.storage_path, '/'), 1));

        -- If we couldn't extract a filename, try another method
        IF filename IS NULL OR filename = '' THEN
            -- Try to get the last part of the path
            filename := substring(photo_record.storage_path from '([^/]+)$');
        END IF;

        -- If we still don't have a filename, skip this record
        IF filename IS NULL OR filename = '' THEN
            RAISE NOTICE 'Could not extract filename from storage_path: %', photo_record.storage_path;
            CONTINUE;
        END IF;

        -- Update the record to use direct Supabase URL
        UPDATE public.property_photos
        SET
            url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || replace(filename, ' ', '%20'),
            storage_path = filename
        WHERE id = photo_record.id;

        RAISE NOTICE 'Updated photo %: filename = %, new URL = %',
            photo_record.id,
            filename,
            'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || filename;
    END LOOP;

    RAISE NOTICE 'Property photo URLs have been updated';
END;
$$;
