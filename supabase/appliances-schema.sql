-- Appliances Schema for QAPT

-- Appliances Categories Table
CREATE TABLE IF NOT EXISTS public.appliance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id uuid REFERENCES public.appliance_categories(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Appliances Table
CREATE TABLE IF NOT EXISTS public.appliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id uuid REFERENCES public.appliance_categories(id),
  sub_category TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT CHECK (status IN ('active', 'maintenance', 'retired')) DEFAULT 'active',
  installation_date DATE,
  warranty_expiration DATE,
  price NUMERIC,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Appliance Attachments Table
CREATE TABLE IF NOT EXISTS public.appliance_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id uuid REFERENCES public.appliances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Appliance Check-ups Table
CREATE TABLE IF NOT EXISTS public.appliance_checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id uuid REFERENCES public.appliances(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create storage bucket for appliance files
INSERT INTO storage.buckets (id, name, public) VALUES ('appliance-files', 'appliance-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.appliance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_checkups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appliance_categories
CREATE POLICY "Users can view appliance categories"
ON public.appliance_categories
FOR SELECT
TO authenticated
USING (true);

-- Create RLS policies for appliances
CREATE POLICY "Users can view their own appliances"
ON public.appliances
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own appliances"
ON public.appliances
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own appliances"
ON public.appliances
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own appliances"
ON public.appliances
FOR DELETE
USING (user_id = auth.uid());

-- Create RLS policies for appliance_attachments
CREATE POLICY "Users can access attachments of their own appliances"
ON public.appliance_attachments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.appliances a
    WHERE a.id = appliance_id
    AND a.user_id = auth.uid()
  )
);

-- Create RLS policies for appliance_checkups
CREATE POLICY "Users can access checkups of their own appliances"
ON public.appliance_checkups
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.appliances a
    WHERE a.id = appliance_id
    AND a.user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appliance_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appliances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appliance_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appliance_checkups TO authenticated;

-- Insert default appliance categories
INSERT INTO public.appliance_categories (name) VALUES 
('Kitchen'), 
('Laundry'), 
('HVAC'), 
('Bathroom'),
('Electronics')
ON CONFLICT DO NOTHING;

-- Insert subcategories
INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Refrigerator', id FROM public.appliance_categories WHERE name = 'Kitchen'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Stove', id FROM public.appliance_categories WHERE name = 'Kitchen'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Dishwasher', id FROM public.appliance_categories WHERE name = 'Kitchen'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Microwave', id FROM public.appliance_categories WHERE name = 'Kitchen'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Washer', id FROM public.appliance_categories WHERE name = 'Laundry'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Dryer', id FROM public.appliance_categories WHERE name = 'Laundry'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Air Conditioner', id FROM public.appliance_categories WHERE name = 'HVAC'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Heater', id FROM public.appliance_categories WHERE name = 'HVAC'
ON CONFLICT DO NOTHING;

INSERT INTO public.appliance_categories (name, parent_id) 
SELECT 'Water Heater', id FROM public.appliance_categories WHERE name = 'Bathroom'
ON CONFLICT DO NOTHING;
