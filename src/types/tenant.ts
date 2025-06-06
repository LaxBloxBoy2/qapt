export interface Tenant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  secondary_email?: string;
  phone?: string;
  secondary_phone?: string;
  is_company: boolean;
  company_name?: string;
  date_of_birth?: string;
  forwarding_address?: string;
  unit_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantFormValues {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  secondary_email?: string;
  phone?: string;
  secondary_phone?: string;
  is_company: boolean;
  company_name?: string;
  date_of_birth?: string;
  forwarding_address?: string;
  unit_id?: string;
  avatar_url?: string;
}

export interface TenantWithUnit extends Tenant {
  units?: {
    id: string;
    name: string;
    property_id: string;
    properties?: {
      id: string;
      name: string;
    };
  };
}
