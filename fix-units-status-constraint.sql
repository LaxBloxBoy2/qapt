-- First, let's drop the existing constraint
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_status_check;

-- Then add the correct constraint
ALTER TABLE public.units ADD CONSTRAINT units_status_check 
  CHECK (status IN ('vacant', 'occupied', 'maintenance'));

-- Let's also make sure the default value is set correctly
ALTER TABLE public.units ALTER COLUMN status SET DEFAULT 'vacant';

-- Check if there are any existing rows with invalid status values
SELECT id, status FROM public.units WHERE status NOT IN ('vacant', 'occupied', 'maintenance');

-- Update any rows with invalid status values to 'vacant'
UPDATE public.units SET status = 'vacant' WHERE status NOT IN ('vacant', 'occupied', 'maintenance');
