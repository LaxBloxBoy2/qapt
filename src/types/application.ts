export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type EmploymentStatus =
  | 'employed_full_time'
  | 'employed_part_time'
  | 'self_employed'
  | 'unemployed'
  | 'student'
  | 'retired';

export interface ApplicationAttachment {
  id: string;
  application_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export interface Application {
  id: string;
  // Basic Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_move_in_date: string;

  // Property & Unit
  unit_id: string;

  // Background Info
  monthly_income: number;
  employment_status: EmploymentStatus;
  has_pets: boolean;
  pets_description?: string;
  is_smoker: boolean;
  comments?: string;

  // Status & Metadata
  status: ApplicationStatus;
  submitted_at: string;
  created_at: string;
  updated_at: string;

  // Relations
  unit?: {
    id: string;
    name: string;
    market_rent: number;
    status: string;
    property_id: string;
    properties?: {
      id: string;
      name: string;
      address: string;
    };
  };
  attachments?: ApplicationAttachment[];
  notes?: ApplicationNote[];
}

export interface ApplicationWithRelations extends Application {
  unit: {
    id: string;
    name: string;
    market_rent: number;
    status: string;
    property_id: string;
    properties: {
      id: string;
      name: string;
      address: string;
    };
  };
  attachments: ApplicationAttachment[];
  notes: ApplicationNote[];
}

export interface ApplicationFormValues {
  // Basic Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_move_in_date: string;

  // Property & Unit
  property_id: string;
  unit_id: string;

  // Background Info
  monthly_income: number;
  employment_status: EmploymentStatus;
  has_pets: boolean;
  pets_description?: string;
  is_smoker: boolean;
  comments?: string;

  // Attachments
  attachments?: File[];
}

export interface ApplicationUpdateInput {
  status?: ApplicationStatus;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  preferred_move_in_date?: string;
  monthly_income?: number;
  employment_status?: EmploymentStatus;
  has_pets?: boolean;
  pets_description?: string;
  is_smoker?: boolean;
  comments?: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  property_id?: string;
  unit_id?: string;
  submitted_after?: string;
  submitted_before?: string;
  search?: string;
}

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed_full_time', label: 'Employed Full-Time' },
  { value: 'employed_part_time', label: 'Employed Part-Time' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
] as const;

export const APPLICATION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
] as const;
