-- Calendar Module Schema for Supabase
-- Creates custom_events table for calendar functionality
-- Compatible with existing database structure

-- Custom Events table
CREATE TABLE IF NOT EXISTS public.custom_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  time TIME,
  all_day BOOLEAN DEFAULT TRUE,

  -- Property/Unit references (optional - links to existing tables)
  property_id UUID,
  unit_id UUID,

  -- Event metadata
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'overdue', 'completed', 'cancelled')),

  -- Recurring settings
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),

  -- Reminder settings
  reminder_minutes INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints safely (only if tables exist)
DO $fk$
BEGIN
  -- Check if properties table exists and add foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    BEGIN
      ALTER TABLE public.custom_events
      ADD CONSTRAINT custom_events_property_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key custom_events_property_fkey already exists';
      WHEN others THEN
        RAISE NOTICE 'Error adding custom_events_property_fkey: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Properties table does not exist, skipping foreign key';
  END IF;

  -- Check if units table exists and add foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units' AND table_schema = 'public') THEN
    BEGIN
      ALTER TABLE public.custom_events
      ADD CONSTRAINT custom_events_unit_fkey
      FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key custom_events_unit_fkey already exists';
      WHEN others THEN
        RAISE NOTICE 'Error adding custom_events_unit_fkey: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Units table does not exist, skipping foreign key';
  END IF;
END
$fk$;

-- Insert sample custom events (only if properties exist)
DO $sample_data$
BEGIN
  -- Check if we have any properties to reference
  IF EXISTS (SELECT 1 FROM public.properties LIMIT 1) THEN
    -- Insert events with property references
    INSERT INTO public.custom_events (
      title, description, date, end_date, all_day, property_id, status, tags
    ) VALUES
    (
      'Property Inspection Walkthrough',
      'Annual property inspection and maintenance review',
      CURRENT_DATE + INTERVAL '7 days',
      NULL,
      TRUE,
      (SELECT id FROM public.properties LIMIT 1 OFFSET 0),
      'upcoming',
      ARRAY['inspection', 'maintenance']
    ),
    (
      'Tenant Meeting',
      'Monthly tenant meeting to discuss property updates',
      CURRENT_DATE + INTERVAL '21 days',
      NULL,
      TRUE,
      (SELECT id FROM public.properties LIMIT 1 OFFSET 0),
      'upcoming',
      ARRAY['meeting', 'tenant']
    )
    ON CONFLICT DO NOTHING;

    -- Try to insert event with second property if it exists
    IF EXISTS (SELECT 1 FROM public.properties LIMIT 1 OFFSET 1) THEN
      INSERT INTO public.custom_events (
        title, description, date, end_date, all_day, property_id, status, tags
      ) VALUES
      (
        'Property Marketing Photos',
        'Professional photography session for vacant units',
        CURRENT_DATE + INTERVAL '5 days',
        NULL,
        TRUE,
        (SELECT id FROM public.properties LIMIT 1 OFFSET 1),
        'upcoming',
        ARRAY['marketing', 'photography']
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Insert general events (no property reference needed)
  INSERT INTO public.custom_events (
    title, description, date, end_date, all_day, property_id, status, tags
  ) VALUES
  (
    'Insurance Policy Renewal',
    'Review and renew property insurance policies',
    CURRENT_DATE + INTERVAL '30 days',
    NULL,
    TRUE,
    NULL,
    'upcoming',
    ARRAY['insurance', 'renewal']
  ),
  (
    'Quarterly Property Review',
    'Quarterly review of all properties and financial performance',
    CURRENT_DATE + INTERVAL '14 days',
    NULL,
    TRUE,
    NULL,
    'upcoming',
    ARRAY['review', 'quarterly']
  ),
  (
    'Monthly Team Meeting',
    'Regular team meeting to discuss operations and updates',
    CURRENT_DATE + INTERVAL '10 days',
    NULL,
    TRUE,
    NULL,
    'upcoming',
    ARRAY['meeting', 'team']
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Sample custom events inserted successfully';
END
$sample_data$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_events_date ON public.custom_events(date);
CREATE INDEX IF NOT EXISTS idx_custom_events_status ON public.custom_events(status);
CREATE INDEX IF NOT EXISTS idx_custom_events_property_id ON public.custom_events(property_id);
CREATE INDEX IF NOT EXISTS idx_custom_events_unit_id ON public.custom_events(unit_id);
CREATE INDEX IF NOT EXISTS idx_custom_events_created_at ON public.custom_events(created_at);

-- Enable RLS
ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DO $policies$
BEGIN
  BEGIN
    CREATE POLICY "Allow all operations on custom_events" ON public.custom_events FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for custom_events already exists';
  END;
END
$policies$;

-- Success message
SELECT 'Calendar module schema created successfully!' as message,
       (SELECT COUNT(*) FROM public.custom_events) as sample_events_created;
