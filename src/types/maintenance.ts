export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  type: MaintenanceType;

  // Property/Unit references
  property_id: string;
  unit_id?: string;
  property?: {
    id: string;
    name: string;
    address: string;
  };
  unit?: {
    id: string;
    name: string;
  };

  // People involved
  requested_by_id: string;
  assigned_to_id?: string;
  requested_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_company?: boolean;
    company_name?: string;
  };
  assigned_to?: {
    id: string;
    name: string;
    email: string;
    type: 'internal' | 'external';
  };

  // Dates
  created_at: string;
  updated_at: string;
  due_date?: string;
  resolved_at?: string;

  // Additional info
  tags?: string[];
  estimated_cost?: number;
  actual_cost?: number;
  resolution_notes?: string;
  tenant_access_settings?: string | object; // JSON field for tenant access settings

  // Related data
  comments?: MaintenanceComment[];
  attachments?: MaintenanceAttachment[];
  status_history?: MaintenanceStatusHistory[];
}

export type MaintenanceStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'
  | 'rejected';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export type MaintenanceType =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'cleaning'
  | 'landscaping'
  | 'security'
  | 'general'
  | 'other';

export interface MaintenanceComment {
  id: string;
  request_id: string;
  user_id: string;
  user_type: 'tenant' | 'team' | 'vendor';
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MaintenanceAttachment {
  id: string;
  request_id: string;
  name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by_id: string;
  uploaded_by_type: 'tenant' | 'team' | 'vendor';
  created_at: string;
}

export interface MaintenanceStatusHistory {
  id: string;
  request_id: string;
  from_status?: MaintenanceStatus;
  to_status: MaintenanceStatus;
  changed_by_id: string;
  changed_by_type: 'tenant' | 'team' | 'vendor';
  notes?: string;
  created_at: string;
  changed_by?: {
    id: string;
    name: string;
  };
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  type?: MaintenanceType;
  property_id?: string;
  unit_id?: string;
  assigned_to_id?: string;
  requested_by_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  tags?: string[];
}

export interface MaintenanceSummary {
  total_requests: number;
  open_requests: number;
  in_progress_requests: number;
  resolved_this_month: number;
  overdue_requests: number;
  avg_resolution_time: number; // in days
}

export interface CreateMaintenanceRequest {
  title: string;
  description: string;
  property_id: string;
  unit_id?: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  requested_by_id: string;
  assigned_to_id?: string;
  due_date?: string;
  tags?: string[];
  estimated_cost?: number;
}

export interface UpdateMaintenanceRequest {
  title?: string;
  description?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  type?: MaintenanceType;
  assigned_to_id?: string;
  due_date?: string;
  tags?: string[];
  estimated_cost?: number;
  actual_cost?: number;
  resolution_notes?: string;
  tenant_access_settings?: string | object;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'internal';
}

export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: MaintenanceType[];
  type: 'external';
}

export type Assignee = TeamMember | ServiceProvider;
