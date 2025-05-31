export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface AppPreferences {
  id?: string;
  user_id?: string;
  currency: 'USD' | 'EUR' | 'GBP';
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de';
  theme: 'light' | 'dark' | 'system';
  default_country: string;
  default_rent_status: 'active' | 'inactive';
  default_lease_term: number; // months
  default_currency_symbol: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationSettings {
  email_enabled: boolean;
  in_app_enabled: boolean;
  lease_renewals: boolean;
  rent_overdue: boolean;
  maintenance_updates: boolean;
  inspection_reminders: boolean;
  payment_confirmations: boolean;
  system_updates: boolean;
  marketing_emails: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member';
  permissions: {
    properties: boolean;
    tenants: boolean;
    leases: boolean;
    finances: boolean;
    maintenance: boolean;
    reports: boolean;
  };
  status: 'pending' | 'active' | 'inactive';
  invited_at: string;
  last_active?: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'calendar' | 'storage' | 'email' | 'payment' | 'communication';
  enabled: boolean;
  config?: Record<string, any>;
  last_sync?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    max_properties: number;
    max_units: number;
    max_tenants: number;
    storage_gb: number;
    team_members: number;
    advanced_reports: boolean;
    api_access: boolean;
    priority_support: boolean;
  };
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
}

export interface BillingInfo {
  customer_id: string;
  payment_method?: {
    type: 'card';
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  };
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: string;
  due_date: string;
  pdf_url?: string;
}
