export type NotificationType = 
  | 'maintenance' 
  | 'finance' 
  | 'inspection' 
  | 'lease' 
  | 'application' 
  | 'tenant' 
  | 'property' 
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  maintenance_enabled: boolean;
  finance_enabled: boolean;
  inspection_enabled: boolean;
  lease_enabled: boolean;
  application_enabled: boolean;
  tenant_enabled: boolean;
  property_enabled: boolean;
  system_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}
