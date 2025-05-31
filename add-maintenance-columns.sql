-- Add materials and equipment columns to maintenance_requests table
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have empty arrays
UPDATE public.maintenance_requests 
SET materials = '[]'::jsonb, equipment = '[]'::jsonb 
WHERE materials IS NULL OR equipment IS NULL;
