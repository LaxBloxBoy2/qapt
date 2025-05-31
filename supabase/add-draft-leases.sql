-- Add draft functionality to leases table
-- This allows creating draft leases without requiring tenants

-- Add is_draft column to leases table
ALTER TABLE public.leases 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN public.leases.is_draft IS 'Indicates if this is a draft lease that can be saved without tenants';

-- Update existing leases to not be drafts (they already have tenants)
UPDATE public.leases 
SET is_draft = FALSE 
WHERE is_draft IS NULL;

-- Create an index for better performance when filtering by draft status
CREATE INDEX IF NOT EXISTS idx_leases_is_draft ON public.leases(is_draft);

-- Update RLS policies to allow draft leases
-- (Assuming the existing policies already handle user access correctly)

-- Optional: Create a view for active (non-draft) leases
CREATE OR REPLACE VIEW public.active_leases AS
SELECT * FROM public.leases 
WHERE is_draft = FALSE OR is_draft IS NULL;

-- Optional: Create a view for draft leases
CREATE OR REPLACE VIEW public.draft_leases AS
SELECT * FROM public.leases 
WHERE is_draft = TRUE;

-- Grant permissions on the views
GRANT SELECT ON public.active_leases TO authenticated;
GRANT SELECT ON public.draft_leases TO authenticated;

-- Add a check constraint to ensure draft leases have valid data
-- (We'll allow draft leases to have minimal data but still require basic fields)
ALTER TABLE public.leases 
ADD CONSTRAINT check_draft_lease_data 
CHECK (
  -- Non-draft leases must have all required fields
  (is_draft = FALSE AND unit_id IS NOT NULL AND start_date IS NOT NULL AND end_date IS NOT NULL AND rent_amount IS NOT NULL)
  OR
  -- Draft leases only need unit_id and rent_amount
  (is_draft = TRUE AND unit_id IS NOT NULL AND rent_amount IS NOT NULL)
);

-- Create a function to convert draft lease to active lease
CREATE OR REPLACE FUNCTION public.finalize_draft_lease(lease_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_count INTEGER;
BEGIN
  -- Check if lease exists and is a draft
  IF NOT EXISTS (
    SELECT 1 FROM public.leases 
    WHERE id = lease_id AND is_draft = TRUE
  ) THEN
    RAISE EXCEPTION 'Lease not found or is not a draft';
  END IF;
  
  -- Check if lease has at least one tenant
  SELECT COUNT(*) INTO tenant_count
  FROM public.lease_tenants
  WHERE lease_tenants.lease_id = finalize_draft_lease.lease_id;
  
  IF tenant_count = 0 THEN
    RAISE EXCEPTION 'Cannot finalize draft lease without tenants';
  END IF;
  
  -- Update the lease to not be a draft
  UPDATE public.leases
  SET is_draft = FALSE, updated_at = NOW()
  WHERE id = lease_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.finalize_draft_lease(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.finalize_draft_lease(UUID) IS 'Converts a draft lease to an active lease after validating it has tenants';
COMMENT ON VIEW public.active_leases IS 'View of all non-draft leases';
COMMENT ON VIEW public.draft_leases IS 'View of all draft leases';

-- Success message
SELECT 'Draft lease functionality added successfully!' as message;
