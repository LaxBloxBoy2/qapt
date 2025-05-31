-- Final fix for property photos
-- This script updates the URLs to match the format used in the inspections module

-- Make sure the bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'image_url';

-- Fix any existing property photos URLs in the database
DO $$
DECLARE
    photo_record RECORD;
    public_url TEXT;
BEGIN
    -- Get all property photos
    FOR photo_record IN
        SELECT id, url, storage_path, property_id
        FROM public.property_photos
    LOOP
        -- Get the public URL directly from Supabase
        SELECT storage.foldername(photo_record.storage_path) INTO public_url;
        
        -- If we couldn't get the URL, construct it manually
        IF public_url IS NULL THEN
            public_url := 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || photo_record.storage_path;
        END IF;
        
        -- Update the record with the public URL
        UPDATE public.property_photos
        SET url = public_url
        WHERE id = photo_record.id;
        
        RAISE NOTICE 'Updated URL for photo %: %', photo_record.id, public_url;
    END LOOP;
    
    RAISE NOTICE 'Property photo URLs have been updated';
END;
$$;
