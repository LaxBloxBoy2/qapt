-- Applications Schema
-- This handles tenant applications before they become leases

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Basic Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    preferred_move_in_date DATE NOT NULL,

    -- Property & Unit
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,

    -- Background Info
    monthly_income DECIMAL(10,2) NOT NULL,
    employment_status VARCHAR(50) NOT NULL CHECK (employment_status IN (
        'employed_full_time',
        'employed_part_time',
        'self_employed',
        'unemployed',
        'student',
        'retired'
    )),
    has_pets BOOLEAN DEFAULT FALSE,
    pets_description TEXT,
    is_smoker BOOLEAN DEFAULT FALSE,
    comments TEXT,

    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_attachments table
CREATE TABLE IF NOT EXISTS public.application_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_notes table
CREATE TABLE IF NOT EXISTS public.application_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_unit_id ON public.applications(unit_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON public.applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_application_attachments_application_id ON public.application_attachments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON public.application_notes(application_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
-- Users can view applications for their properties
CREATE POLICY "Users can view applications for their properties"
ON public.applications
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.units
        JOIN public.properties ON units.property_id = properties.id
        WHERE units.id = applications.unit_id
        AND properties.user_id = auth.uid()
    )
);

-- Users can insert applications for their properties
CREATE POLICY "Users can create applications for their properties"
ON public.applications
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.units
        JOIN public.properties ON units.property_id = properties.id
        WHERE units.id = applications.unit_id
        AND properties.user_id = auth.uid()
    )
);

-- Users can update applications for their properties
CREATE POLICY "Users can update applications for their properties"
ON public.applications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.units
        JOIN public.properties ON units.property_id = properties.id
        WHERE units.id = applications.unit_id
        AND properties.user_id = auth.uid()
    )
);

-- Users can delete applications for their properties
CREATE POLICY "Users can delete applications for their properties"
ON public.applications
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.units
        JOIN public.properties ON units.property_id = properties.id
        WHERE units.id = applications.unit_id
        AND properties.user_id = auth.uid()
    )
);

-- RLS Policies for application_attachments
CREATE POLICY "Users can view attachments for their applications"
ON public.application_attachments
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.applications
        JOIN public.units ON applications.unit_id = units.id
        JOIN public.properties ON units.property_id = properties.id
        WHERE applications.id = application_attachments.application_id
        AND properties.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage attachments for their applications"
ON public.application_attachments
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.applications
        JOIN public.units ON applications.unit_id = units.id
        JOIN public.properties ON units.property_id = properties.id
        WHERE applications.id = application_attachments.application_id
        AND properties.user_id = auth.uid()
    )
);

-- RLS Policies for application_notes
CREATE POLICY "Users can view notes for their applications"
ON public.application_notes
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.applications
        JOIN public.units ON applications.unit_id = units.id
        JOIN public.properties ON units.property_id = properties.id
        WHERE applications.id = application_notes.application_id
        AND properties.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage notes for their applications"
ON public.application_notes
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.applications
        JOIN public.units ON applications.unit_id = units.id
        JOIN public.properties ON units.property_id = properties.id
        WHERE applications.id = application_notes.application_id
        AND properties.user_id = auth.uid()
    )
);

-- Create a view for applications with related data
CREATE OR REPLACE VIEW applications_with_details AS
SELECT
    a.*,
    u.name as unit_name,
    u.market_rent,
    u.status as unit_status,
    p.name as property_name,
    p.address as property_address,
    COUNT(aa.id) as attachment_count,
    COUNT(an.id) as note_count
FROM public.applications a
JOIN public.units u ON a.unit_id = u.id
JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.application_attachments aa ON a.id = aa.application_id
LEFT JOIN public.application_notes an ON a.id = an.application_id
GROUP BY a.id, u.id, u.name, u.market_rent, u.status, p.name, p.address;

-- Create storage bucket for application files
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-files', 'application-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for application files
CREATE POLICY "Users can view application files for their properties"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'application-files' AND
    EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.units u ON a.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.user_id = auth.uid()
        AND (storage.foldername(objects.name))[1] = a.id::text
    )
);

CREATE POLICY "Users can upload application files for their properties"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'application-files' AND
    EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.units u ON a.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.user_id = auth.uid()
        AND (storage.foldername(objects.name))[1] = a.id::text
    )
);

CREATE POLICY "Users can delete application files for their properties"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'application-files' AND
    EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.units u ON a.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.user_id = auth.uid()
        AND (storage.foldername(objects.name))[1] = a.id::text
    )
);
