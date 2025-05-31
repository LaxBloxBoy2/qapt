-- Inspections Schema for QAPT

-- Inspections Table
CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('move_in', 'move_out')) NOT NULL,
  required_sections TEXT[], -- e.g. ['bedroom', 'bathroom', 'kitchen']
  expiration_date DATE NOT NULL,
  created_by uuid REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Inspection Sections Table (for rooms and areas)
CREATE TABLE IF NOT EXISTS public.inspection_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES inspections(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Bedroom 1", "Kitchen"
  section_type TEXT NOT NULL, -- e.g. "bedroom", "bathroom", "kitchen"
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Inspection Conditions Table (for issues found in each section)
CREATE TABLE IF NOT EXISTS public.inspection_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES inspection_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost_estimate NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Inspection Media Table (for photos and videos of conditions)
CREATE TABLE IF NOT EXISTS public.inspection_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id uuid REFERENCES inspection_conditions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Add RLS Policies

-- Enable RLS on all tables
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_media ENABLE ROW LEVEL SECURITY;

-- Inspections table policies
CREATE POLICY "Users can view their own inspections"
ON public.inspections
FOR SELECT
USING (
  created_by = auth.uid() OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own inspections"
ON public.inspections
FOR INSERT
WITH CHECK (
  created_by = auth.uid() OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own inspections"
ON public.inspections
FOR UPDATE
USING (
  created_by = auth.uid() OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own inspections"
ON public.inspections
FOR DELETE
USING (
  created_by = auth.uid() OR
  property_id IN (
    SELECT id FROM properties WHERE user_id = auth.uid()
  )
);

-- Similar policies for inspection_sections
CREATE POLICY "Users can view their inspection sections"
ON public.inspection_sections
FOR SELECT
USING (
  inspection_id IN (
    SELECT id FROM inspections WHERE created_by = auth.uid() OR
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert inspection sections"
ON public.inspection_sections
FOR INSERT
WITH CHECK (
  inspection_id IN (
    SELECT id FROM inspections WHERE created_by = auth.uid() OR
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update inspection sections"
ON public.inspection_sections
FOR UPDATE
USING (
  inspection_id IN (
    SELECT id FROM inspections WHERE created_by = auth.uid() OR
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete inspection sections"
ON public.inspection_sections
FOR DELETE
USING (
  inspection_id IN (
    SELECT id FROM inspections WHERE created_by = auth.uid() OR
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  )
);

-- Grant permissions to authenticated users
GRANT ALL ON public.inspections TO authenticated;
GRANT ALL ON public.inspection_sections TO authenticated;
GRANT ALL ON public.inspection_conditions TO authenticated;
GRANT ALL ON public.inspection_media TO authenticated;
