-- Fix URLs in property_photos table
UPDATE public.property_photos
SET url = 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/' || storage_path
WHERE url LIKE '%/api/%' OR url NOT LIKE 'https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/%';
