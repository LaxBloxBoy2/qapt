import { z } from "zod";

// Enums
export type TransactionType = 'income' | 'expense';
export type TransactionSubtype = 'invoice' | 'payment' | 'deposit' | 'credit_note' | 'return_deposit' | 'apply_deposit';
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'online' | 'other';

// Transaction Category
export interface TransactionCategory {
  id: string;
  name: string;
  parent_id?: string;
  type: TransactionType;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  parent?: TransactionCategory;
  children?: TransactionCategory[];
}

// Vendor
export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Transaction
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  subtype: TransactionSubtype;

  // References
  property_id?: string;
  unit_id?: string;
  tenant_id?: string;
  lease_id?: string;
  vendor_id?: string;
  category_id?: string;
  maintenance_request_id?: string;

  // Financial Details
  amount: number;
  balance: number;
  currency: string;

  // Status and Dates
  status: TransactionStatus;
  due_date?: string;
  paid_date?: string;

  // Payment Details
  payment_method?: PaymentMethod;
  reference_id?: string;

  // Recurring
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  recurring_end_date?: string;
  parent_transaction_id?: string;

  // Additional Info
  description?: string;
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Transaction with Relations
export interface TransactionWithRelations extends Transaction {
  property?: {
    id: string;
    name: string;
    address?: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    is_company: boolean;
    company_name?: string;
  };
  lease?: {
    id: string;
    start_date: string;
    end_date: string;
  };
  vendor?: Vendor;
  category?: TransactionCategory;
  attachments?: TransactionAttachment[];
}

// Transaction Attachment
export interface TransactionAttachment {
  id: string;
  transaction_id: string;
  name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

// Form Schemas
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  subtype: z.enum(['invoice', 'payment', 'deposit', 'credit_note', 'return_deposit', 'apply_deposit']),
  property_id: z.string().uuid().optional().or(z.literal("")),
  unit_id: z.string().uuid().optional().or(z.literal("")),
  tenant_id: z.string().uuid().optional().or(z.literal("")),
  lease_id: z.string().uuid().optional().or(z.literal("")),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  maintenance_request_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  due_date: z.string().optional().or(z.literal("")),
  paid_date: z.string().optional().or(z.literal("")),
  payment_method: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'online', 'other']).optional(),
  reference_id: z.string().optional(),
  is_recurring: z.boolean(),
  recurring_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurring_end_date: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.coerce.number().min(0).default(30),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parent_id: z.string().uuid().optional(),
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
});

// Form Types
export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type VendorFormValues = z.infer<typeof vendorSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;

// Filter Types
export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  property_id?: string;
  unit_id?: string;
  tenant_id?: string;
  vendor_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_method?: PaymentMethod;
  has_attachments?: boolean;
  search?: string;
}

// Summary Types
export interface FinancialSummary {
  outstanding: number;
  paid: number;
  overdue: number;
  total_income: number;
  total_expenses: number;
  net_income: number;
}

// Dashboard KPI Types
export interface FinanceKPI {
  label: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: string;
  color: string;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'pdf';
  date_range: {
    from: string;
    to: string;
  };
  filters?: TransactionFilters;
  columns: string[];
}
