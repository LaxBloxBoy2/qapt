-- Fix Supabase Storage CORS configuration
-- This script configures proper CORS settings for the property-photos bucket

-- First, let's update the bucket configuration to ensure it's public
UPDATE storage.buckets
SET public = true
WHERE id = 'property-photos';

-- Now, let's set up proper CORS configuration for the storage service
-- This will allow any origin to access the files (you can restrict this to your domain in production)
INSERT INTO storage.buckets_config (bucket_id, cors_origins, cors_methods, cors_allowed_headers, cors_max_age_seconds)
VALUES (
  'property-photos',
  ARRAY['*'],  -- Allow all origins
  ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  -- Allow all methods
  ARRAY['*'],  -- Allow all headers
  3600  -- Cache preflight requests for 1 hour
)
ON CONFLICT (bucket_id) 
DO UPDATE SET
  cors_origins = ARRAY['*'],
  cors_methods = ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  cors_allowed_headers = ARRAY['*'],
  cors_max_age_seconds = 3600;

-- Now let's fix the storage policies to ensure public access
-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow public access to property photos" ON storage.objects;

-- Create a policy to allow public access to the property-photos bucket
CREATE POLICY "Allow public access to property photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-photos');

-- Fix any existing property photos URLs in the database
DO $$
DECLARE
    photo_record RECORD;
    fixed_url TEXT;
    fixed_path TEXT;
BEGIN
    -- Get all property photos
    FOR photo_record IN 
        SELECT id, url, storage_path, property_id
        FROM public.property_photos
    LOOP
        -- Fix the storage path if needed
        IF photo_record.storage_path IS NOT NULL THEN
            -- Remove any duplicate 'property-photos/' prefix
            IF photo_record.storage_path LIKE 'property-photos/%' THEN
                fixed_path := REPLACE(photo_record.storage_path, 'property-photos/', '');
            ELSE
                fixed_path := photo_record.storage_path;
            END IF;
            
            -- Construct the correct URL
            fixed_url := 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/property-photos/' || fixed_path;
            
            -- Update the record
            UPDATE public.property_photos
            SET 
                url = fixed_url,
                storage_path = fixed_path
            WHERE id = photo_record.id;
            
            RAISE NOTICE 'Fixed photo %: path = %, url = %', photo_record.id, fixed_path, fixed_url;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Property photo URLs have been fixed';
END;
$$;
