-- Fix URLs in property_photos table
-- This script only fixes the URLs in the database

-- Update existing URLs to use the correct format
UPDATE public.property_photos
SET url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || storage_path
WHERE storage_path IS NOT NULL;

-- Log the current state
SELECT id, url, storage_path 
FROM public.property_photos 
WHERE url IS NOT NULL;
