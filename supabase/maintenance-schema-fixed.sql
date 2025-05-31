-- FIXED MAINTENANCE MODULE SETUP
-- Compatible with existing database structure

-- Step 1: Create maintenance tables only (skip base tables that already exist)

-- Team Members table (for internal staff)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Providers table (for external vendors)
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  specialties TEXT[], -- Array of maintenance types they handle
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'cancelled', 'rejected')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('plumbing', 'electrical', 'hvac', 'appliance', 'cleaning', 'landscaping', 'security', 'general', 'other')),

  -- Property/Unit references
  property_id UUID,
  unit_id UUID,

  -- People involved
  requested_by_id UUID NOT NULL, -- References tenants table
  assigned_to_id UUID, -- Can reference team_members OR service_providers
  assigned_to_type VARCHAR(20) CHECK (assigned_to_type IN ('internal', 'external')),

  -- Dates
  due_date DATE,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Cost tracking
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Additional info
  tags TEXT[],
  resolution_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Comments table
CREATE TABLE IF NOT EXISTS public.maintenance_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL, -- Can be tenant, team member, or service provider
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('tenant', 'team', 'vendor')),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs public comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Attachments table
CREATE TABLE IF NOT EXISTS public.maintenance_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by_id UUID NOT NULL,
  uploaded_by_type VARCHAR(20) NOT NULL CHECK (uploaded_by_type IN ('tenant', 'team', 'vendor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Status History table
CREATE TABLE IF NOT EXISTS public.maintenance_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by_id UUID NOT NULL,
  changed_by_type VARCHAR(20) NOT NULL CHECK (changed_by_type IN ('tenant', 'team', 'vendor')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add foreign key constraints safely
DO $fk$
BEGIN
  -- Add foreign key for maintenance_requests -> properties (only if properties table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
    BEGIN
      ALTER TABLE public.maintenance_requests
      ADD CONSTRAINT maintenance_requests_property_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key maintenance_requests_property_fkey already exists';
      WHEN others THEN
        RAISE NOTICE 'Error adding maintenance_requests_property_fkey: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Properties table does not exist, skipping foreign key';
  END IF;

  -- Add foreign key for maintenance_requests -> units (only if units table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units' AND table_schema = 'public') THEN
    BEGIN
      ALTER TABLE public.maintenance_requests
      ADD CONSTRAINT maintenance_requests_unit_fkey
      FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key maintenance_requests_unit_fkey already exists';
      WHEN others THEN
        RAISE NOTICE 'Error adding maintenance_requests_unit_fkey: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Units table does not exist, skipping foreign key';
  END IF;

  -- Add foreign key for maintenance_requests -> tenants (only if tenants table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
    BEGIN
      ALTER TABLE public.maintenance_requests
      ADD CONSTRAINT maintenance_requests_requested_by_fkey
      FOREIGN KEY (requested_by_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key maintenance_requests_requested_by_fkey already exists';
      WHEN others THEN
        RAISE NOTICE 'Error adding maintenance_requests_requested_by_fkey: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Tenants table does not exist, skipping foreign key';
  END IF;

  -- Add foreign key for maintenance_comments -> maintenance_requests
  BEGIN
    ALTER TABLE public.maintenance_comments
    ADD CONSTRAINT maintenance_comments_request_fkey
    FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key maintenance_comments_request_fkey already exists';
    WHEN others THEN
      RAISE NOTICE 'Error adding maintenance_comments_request_fkey: %', SQLERRM;
  END;

  -- Add foreign key for maintenance_attachments -> maintenance_requests
  BEGIN
    ALTER TABLE public.maintenance_attachments
    ADD CONSTRAINT maintenance_attachments_request_fkey
    FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key maintenance_attachments_request_fkey already exists';
    WHEN others THEN
      RAISE NOTICE 'Error adding maintenance_attachments_request_fkey: %', SQLERRM;
  END;

  -- Add foreign key for maintenance_status_history -> maintenance_requests
  BEGIN
    ALTER TABLE public.maintenance_status_history
    ADD CONSTRAINT maintenance_status_history_request_fkey
    FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key maintenance_status_history_request_fkey already exists';
    WHEN others THEN
      RAISE NOTICE 'Error adding maintenance_status_history_request_fkey: %', SQLERRM;
  END;
END
$fk$;

-- Step 3: Insert sample team members and service providers
INSERT INTO public.team_members (name, email, role, phone) VALUES
('Sarah Connor', 'sarah@property.com', 'Property Manager', '555-0101'),
('John Smith', 'john@property.com', 'Maintenance Supervisor', '555-0102'),
('Mike Johnson', 'mike@property.com', 'Maintenance Technician', '555-0103')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.service_providers (name, email, phone, specialties, hourly_rate) VALUES
('ABC Plumbing Services', 'contact@abcplumbing.com', '555-0201', ARRAY['plumbing'], 85.00),
('Electric Pro Services', 'service@electricpro.com', '555-0202', ARRAY['electrical'], 95.00),
('HVAC Masters', 'info@hvacmasters.com', '555-0203', ARRAY['hvac'], 90.00),
('All-Fix Maintenance', 'hello@allfix.com', '555-0204', ARRAY['general', 'appliance', 'cleaning'], 75.00),
('Green Thumb Landscaping', 'contact@greenthumb.com', '555-0205', ARRAY['landscaping'], 65.00)
ON CONFLICT DO NOTHING;

-- Step 4: Insert sample maintenance requests (only if we have the required data)
DO $sample_requests$
BEGIN
  -- Only insert sample requests if we have properties, units, and tenants
  IF EXISTS (SELECT 1 FROM public.properties LIMIT 1) AND
     EXISTS (SELECT 1 FROM public.units LIMIT 1) AND
     EXISTS (SELECT 1 FROM public.tenants LIMIT 1) THEN

    INSERT INTO public.maintenance_requests (
      title, description, status, priority, type, property_id, unit_id,
      requested_by_id, assigned_to_id, assigned_to_type, due_date, estimated_cost
    ) VALUES
    (
      'Leaking faucet in kitchen',
      'The kitchen faucet has been dripping constantly for the past week. Water is pooling under the sink and may cause damage.',
      'open',
      'medium',
      'plumbing',
      (SELECT id FROM public.properties LIMIT 1 OFFSET 0),
      (SELECT id FROM public.units LIMIT 1 OFFSET 0),
      (SELECT id FROM public.tenants LIMIT 1 OFFSET 0),
      NULL,
      NULL,
      CURRENT_DATE + INTERVAL '7 days',
      150.00
    ),
    (
      'Broken air conditioning unit',
      'AC unit in bedroom stopped working yesterday. It is getting very hot and uncomfortable.',
      'in_progress',
      'high',
      'hvac',
      (SELECT id FROM public.properties LIMIT 1 OFFSET 0),
      (SELECT id FROM public.units LIMIT 1 OFFSET 0),
      (SELECT id FROM public.tenants LIMIT 1 OFFSET 0),
      (SELECT id FROM public.service_providers WHERE 'hvac' = ANY(specialties) LIMIT 1),
      'external',
      CURRENT_DATE + INTERVAL '2 days',
      300.00
    ),
    (
      'Dishwasher not draining properly',
      'Water remains in the bottom of the dishwasher after cycles complete. Dishes are not getting clean.',
      'resolved',
      'low',
      'appliance',
      (SELECT id FROM public.properties LIMIT 1 OFFSET 0),
      (SELECT id FROM public.units LIMIT 1 OFFSET 0),
      (SELECT id FROM public.tenants LIMIT 1 OFFSET 0),
      (SELECT id FROM public.team_members LIMIT 1 OFFSET 1),
      'internal',
      CURRENT_DATE - INTERVAL '1 day',
      75.00
    )
    ON CONFLICT DO NOTHING;

    -- Update resolved request with resolution details
    UPDATE public.maintenance_requests
    SET resolved_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
        actual_cost = 85.00,
        resolution_notes = 'Cleared drain blockage and cleaned filter. Dishwasher working normally now.'
    WHERE status = 'resolved' AND resolution_notes IS NULL;

    RAISE NOTICE 'Sample maintenance requests inserted successfully';
  ELSE
    RAISE NOTICE 'Required tables (properties, units, tenants) not found, skipping sample requests';
  END IF;
END
$sample_requests$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON public.maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_type ON public.maintenance_requests(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_to ON public.maintenance_requests(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at ON public.maintenance_requests(created_at);

-- Step 6: Enable RLS and create policies
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_status_history ENABLE ROW LEVEL SECURITY;

-- Simple policies for testing (allow all operations for authenticated users)
DO $policies$
BEGIN
  -- Team members policies
  BEGIN
    CREATE POLICY "Allow all operations on team_members" ON public.team_members FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for team_members already exists';
  END;

  -- Service providers policies
  BEGIN
    CREATE POLICY "Allow all operations on service_providers" ON public.service_providers FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for service_providers already exists';
  END;

  -- Maintenance requests policies
  BEGIN
    CREATE POLICY "Allow all operations on maintenance_requests" ON public.maintenance_requests FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for maintenance_requests already exists';
  END;

  -- Maintenance comments policies
  BEGIN
    CREATE POLICY "Allow all operations on maintenance_comments" ON public.maintenance_comments FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for maintenance_comments already exists';
  END;

  -- Maintenance attachments policies
  BEGIN
    CREATE POLICY "Allow all operations on maintenance_attachments" ON public.maintenance_attachments FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for maintenance_attachments already exists';
  END;

  -- Maintenance status history policies
  BEGIN
    CREATE POLICY "Allow all operations on maintenance_status_history" ON public.maintenance_status_history FOR ALL USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy for maintenance_status_history already exists';
  END;
END
$policies$;

-- Step 7: Create storage bucket for maintenance attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance-files', 'maintenance-files', false)
ON CONFLICT DO NOTHING;

-- Storage policies for maintenance files
DO $storage_policies$
BEGIN
  BEGIN
    CREATE POLICY "Users can upload maintenance files" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'maintenance-files' AND auth.role() = 'authenticated');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Storage policy for upload already exists';
  END;

  BEGIN
    CREATE POLICY "Users can view maintenance files" ON storage.objects
      FOR SELECT USING (bucket_id = 'maintenance-files' AND auth.role() = 'authenticated');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Storage policy for view already exists';
  END;

  BEGIN
    CREATE POLICY "Users can delete maintenance files" ON storage.objects
      FOR DELETE USING (bucket_id = 'maintenance-files' AND auth.role() = 'authenticated');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Storage policy for delete already exists';
  END;
END
$storage_policies$;

-- Success message
SELECT 'Maintenance module setup completed successfully!' as message,
       (SELECT COUNT(*) FROM public.maintenance_requests) as sample_requests_created,
       (SELECT COUNT(*) FROM public.team_members) as team_members_created,
       (SELECT COUNT(*) FROM public.service_providers) as service_providers_created;
