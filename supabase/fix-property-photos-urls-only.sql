-- Fix property photos URLs only
-- This script only fixes the URLs in the database without modifying policies

-- Make sure the bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'image_url';

-- Fix any existing property photos URLs in the database
DO $$
DECLARE
    photo_record RECORD;
BEGIN
    -- Get all property photos
    FOR photo_record IN
        SELECT id, url, storage_path, property_id
        FROM public.property_photos
    LOOP
        -- Update the record to ensure it has the correct URL format
        UPDATE public.property_photos
        SET url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || photo_record.storage_path
        WHERE id = photo_record.id;
        
        RAISE NOTICE 'Updated URL for photo %', photo_record.id;
    END LOOP;
    
    RAISE NOTICE 'Property photo URLs have been updated';
END;
$$;
