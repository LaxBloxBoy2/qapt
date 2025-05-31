export type ContactType = 'vendor' | 'contractor' | 'service_provider' | 'supplier' | 'other';

export type ContactStatus = 'active' | 'inactive' | 'blacklisted';

export type PreferredContactMethod = 'email' | 'phone' | 'mobile' | 'text';

export interface ExternalContact {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Basic Information
  company_name: string;
  contact_person?: string;
  type: ContactType;
  category?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  
  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  
  // Business Information
  license_number?: string;
  insurance_info?: string;
  tax_id?: string;
  business_hours?: string;
  
  // Service Information
  services_offered?: string[];
  service_areas?: string[];
  hourly_rate?: number;
  emergency_rate?: number;
  minimum_charge?: number;
  
  // Status and Notes
  status: ContactStatus;
  rating?: number;
  notes?: string;
  
  // Emergency Contact
  emergency_contact: boolean;
  emergency_phone?: string;
  
  // Metadata
  created_by?: string;
  last_contacted?: string;
  preferred_contact_method?: PreferredContactMethod;
}

export interface CreateExternalContactData {
  company_name: string;
  contact_person?: string;
  type: ContactType;
  category?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  license_number?: string;
  insurance_info?: string;
  tax_id?: string;
  business_hours?: string;
  services_offered?: string[];
  service_areas?: string[];
  hourly_rate?: number;
  emergency_rate?: number;
  minimum_charge?: number;
  status?: ContactStatus;
  rating?: number;
  notes?: string;
  emergency_contact?: boolean;
  emergency_phone?: string;
  last_contacted?: string;
  preferred_contact_method?: PreferredContactMethod;
}

export interface UpdateExternalContactData extends Partial<CreateExternalContactData> {
  id: string;
}

export interface ExternalContactFilters {
  type?: ContactType;
  category?: string;
  status?: ContactStatus;
  emergency_contact?: boolean;
  rating?: number;
  search?: string;
}

// Common categories for different contact types
export const CONTACT_CATEGORIES = {
  contractor: [
    'plumbing',
    'electrical',
    'hvac',
    'roofing',
    'flooring',
    'painting',
    'carpentry',
    'masonry',
    'landscaping',
    'pest_control',
    'cleaning',
    'security',
    'general_contractor'
  ],
  vendor: [
    'appliances',
    'furniture',
    'supplies',
    'materials',
    'equipment',
    'software',
    'insurance',
    'legal',
    'accounting',
    'marketing'
  ],
  service_provider: [
    'maintenance',
    'property_management',
    'inspection',
    'appraisal',
    'photography',
    'staging',
    'moving',
    'storage',
    'utilities',
    'internet'
  ],
  supplier: [
    'building_materials',
    'hardware',
    'tools',
    'safety_equipment',
    'office_supplies',
    'cleaning_supplies',
    'landscaping_supplies'
  ],
  other: [
    'government',
    'association',
    'emergency_services',
    'utility_company',
    'bank',
    'real_estate'
  ]
} as const;

// US States for address dropdown
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;
