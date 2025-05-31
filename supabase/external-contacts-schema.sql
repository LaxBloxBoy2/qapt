-- External Contacts Schema for Supabase
-- Run this in Supabase SQL Editor

-- Create external_contacts table
CREATE TABLE IF NOT EXISTS external_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic Information
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  type VARCHAR(50) NOT NULL CHECK (type IN ('vendor', 'contractor', 'service_provider', 'supplier', 'other')),
  category VARCHAR(100), -- e.g., 'plumbing', 'electrical', 'hvac', 'landscaping', 'maintenance', etc.
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  fax VARCHAR(50),
  website VARCHAR(255),
  
  -- Address Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  
  -- Business Information
  license_number VARCHAR(100),
  insurance_info TEXT,
  tax_id VARCHAR(50),
  business_hours VARCHAR(255),
  
  -- Service Information
  services_offered TEXT[], -- Array of services
  service_areas TEXT[], -- Array of areas they serve
  hourly_rate DECIMAL(10,2),
  emergency_rate DECIMAL(10,2),
  minimum_charge DECIMAL(10,2),
  
  -- Status and Notes
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  
  -- Emergency Contact
  emergency_contact BOOLEAN DEFAULT false,
  emergency_phone VARCHAR(50),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  last_contacted DATE,
  preferred_contact_method VARCHAR(20) CHECK (preferred_contact_method IN ('email', 'phone', 'mobile', 'text'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_external_contacts_type ON external_contacts(type);
CREATE INDEX IF NOT EXISTS idx_external_contacts_category ON external_contacts(category);
CREATE INDEX IF NOT EXISTS idx_external_contacts_status ON external_contacts(status);
CREATE INDEX IF NOT EXISTS idx_external_contacts_company_name ON external_contacts(company_name);
CREATE INDEX IF NOT EXISTS idx_external_contacts_emergency ON external_contacts(emergency_contact);

-- Enable RLS (Row Level Security)
ALTER TABLE external_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view external contacts" ON external_contacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert external contacts" ON external_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update external contacts" ON external_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete external contacts" ON external_contacts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_external_contacts_updated_at 
  BEFORE UPDATE ON external_contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO external_contacts (
  company_name, contact_person, type, category, email, phone, 
  address_line1, city, state, zip_code, services_offered, 
  emergency_contact, status, rating
) VALUES 
(
  'ABC Plumbing Services', 'John Smith', 'contractor', 'plumbing',
  'john@abcplumbing.com', '(555) 123-4567',
  '123 Main St', 'Anytown', 'CA', '12345',
  ARRAY['emergency plumbing', 'pipe repair', 'drain cleaning', 'water heater installation'],
  true, 'active', 5
),
(
  'Electric Pro Services', 'Sarah Johnson', 'contractor', 'electrical',
  'sarah@electricpro.com', '(555) 234-5678',
  '456 Oak Ave', 'Anytown', 'CA', '12345',
  ARRAY['electrical repair', 'wiring', 'panel upgrades', 'lighting installation'],
  true, 'active', 4
),
(
  'HVAC Masters', 'Mike Wilson', 'contractor', 'hvac',
  'mike@hvacmasters.com', '(555) 345-6789',
  '789 Pine St', 'Anytown', 'CA', '12345',
  ARRAY['ac repair', 'heating repair', 'duct cleaning', 'system installation'],
  true, 'active', 5
),
(
  'All-Fix Maintenance', 'Lisa Brown', 'service_provider', 'maintenance',
  'lisa@allfix.com', '(555) 456-7890',
  '321 Elm St', 'Anytown', 'CA', '12345',
  ARRAY['general maintenance', 'handyman services', 'painting', 'minor repairs'],
  false, 'active', 4
),
(
  'Green Thumb Landscaping', 'David Garcia', 'contractor', 'landscaping',
  'david@greenthumb.com', '(555) 567-8901',
  '654 Maple Dr', 'Anytown', 'CA', '12345',
  ARRAY['lawn maintenance', 'tree trimming', 'irrigation', 'landscape design'],
  false, 'active', 4
);

-- Success message
SELECT 'External contacts schema created successfully!' as status;
