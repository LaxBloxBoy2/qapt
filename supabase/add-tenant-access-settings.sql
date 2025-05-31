-- Add tenant_access_settings column to maintenance_requests table
-- This will store JSON data for tenant access preferences per maintenance request

-- Add the column if it doesn't exist
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'maintenance_requests'
    AND column_name = 'tenant_access_settings'
  ) THEN
    ALTER TABLE public.maintenance_requests
    ADD COLUMN tenant_access_settings JSONB;

    RAISE NOTICE 'Added tenant_access_settings column to maintenance_requests table';
  ELSE
    RAISE NOTICE 'tenant_access_settings column already exists in maintenance_requests table';
  END IF;
END
$do$;

-- Add a comment to document the column
COMMENT ON COLUMN public.maintenance_requests.tenant_access_settings IS
'JSON field storing tenant access preferences for maintenance requests including: canEnterIfNotHome, alarmCode, petsPresent, petDetails, preferredTimes';

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_access_settings
ON public.maintenance_requests USING GIN (tenant_access_settings);

-- Final completion notice
DO $final$
BEGIN
  RAISE NOTICE 'Tenant access settings column setup complete';
END
$final$;
