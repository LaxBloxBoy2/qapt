-- Create function to fix photo URLs
CREATE OR REPLACE FUNCTION fix_property_photo_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update URLs to use the correct format
    UPDATE property_photos
    SET url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || storage_path
    WHERE storage_path IS NOT NULL;
END;
$$;
