-- Fix property photos URLs
DO $$
DECLARE
    supabase_url TEXT := 'https://auaytfzunufzzkurjlol.supabase.co'; -- Replace with your actual Supabase URL
    photo_record RECORD;
    fixed_url TEXT;
    fixed_path TEXT;
BEGIN
    -- Get all property photos
    FOR photo_record IN 
        SELECT id, url, storage_path, property_id
        FROM public.property_photos
    LOOP
        -- Case 1: Fix the duplicate 'property-photos' in the path
        IF photo_record.storage_path IS NOT NULL AND photo_record.storage_path LIKE 'property-photos/%' THEN
            -- Remove the duplicate 'property-photos/' prefix
            fixed_path := REPLACE(photo_record.storage_path, 'property-photos/', '');
            
            -- Construct the correct URL
            fixed_url := supabase_url || '/storage/v1/object/public/property-photos/' || fixed_path;
            
            -- Update the record
            UPDATE public.property_photos
            SET 
                url = fixed_url,
                storage_path = fixed_path
            WHERE id = photo_record.id;
            
            RAISE NOTICE 'Fixed duplicate path for photo %: % -> %', photo_record.id, photo_record.storage_path, fixed_path;
        
        -- Case 2: Handle missing property_id in the path
        ELSIF photo_record.storage_path IS NOT NULL AND photo_record.property_id IS NOT NULL 
              AND photo_record.storage_path NOT LIKE photo_record.property_id || '/%' THEN
            
            -- Add property_id to the path if it's missing
            fixed_path := photo_record.property_id || '/' || photo_record.storage_path;
            
            -- Construct the correct URL
            fixed_url := supabase_url || '/storage/v1/object/public/property-photos/' || fixed_path;
            
            -- Update the record
            UPDATE public.property_photos
            SET 
                url = fixed_url,
                storage_path = fixed_path
            WHERE id = photo_record.id;
            
            RAISE NOTICE 'Added property_id to path for photo %: % -> %', photo_record.id, photo_record.storage_path, fixed_path;
        
        -- Case 3: Ensure URL is correct even if path is correct
        ELSIF photo_record.storage_path IS NOT NULL THEN
            -- Construct the correct URL
            fixed_url := supabase_url || '/storage/v1/object/public/property-photos/' || photo_record.storage_path;
            
            -- Update the URL if it's different
            IF photo_record.url <> fixed_url THEN
                UPDATE public.property_photos
                SET url = fixed_url
                WHERE id = photo_record.id;
                
                RAISE NOTICE 'Fixed URL for photo %: % -> %', photo_record.id, photo_record.url, fixed_url;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Property photo URLs have been fixed';
END;
$$;
