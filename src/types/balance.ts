export interface TenantBalance {
  id: string;
  tenant_id: string;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    is_company: boolean;
    company_name?: string;
    unit?: {
      id: string;
      name: string;
      property: {
        id: string;
        name: string;
      };
    };
  };
  outstanding_balance: number;
  paid_balance: number;
  overdue_balance: number;
  total_invoices: number;
  overdue_invoices: number;
  oldest_invoice_date?: string;
  days_overdue: number;
  lease_status?: "active" | "pending" | "expired";
  lease_end_date?: string;
  last_payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BalancesSummary {
  total_outstanding: number;
  total_paid: number;
  total_overdue: number;
  total_tenants: number;
  aging_0_30: number;
  aging_30_60: number;
  aging_60_90: number;
  aging_90_plus: number;
}

export interface BalanceFilters {
  property_id?: string;
  tenant_id?: string;
  status?: "open" | "overdue" | "partial";
  lease_status?: "active" | "pending" | "expired";
  aging_period?: AgingPeriod;
  search?: string;
  min_balance?: number;
  max_balance?: number;
}

export type AgingPeriod = "0-30" | "30-60" | "60-90" | "90+" | "all";

export interface NoticeTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "overdue" | "reminder" | "final_notice";
}

export interface SendNoticeRequest {
  tenant_id: string;
  template_id?: string;
  subject: string;
  message: string;
  include_invoice_summary: boolean;
  send_copy_to_self: boolean;
}

export interface DepositApplication {
  deposit_id: string;
  amount: number;
  invoice_id: string;
}

export interface ApplyDepositsRequest {
  tenant_id: string;
  applications: DepositApplication[];
}

export interface CreditApplication {
  credit_id: string;
  amount: number;
  invoice_id: string;
}

export interface ApplyCreditsRequest {
  tenant_id: string;
  applications: CreditApplication[];
}

export interface TenantDeposit {
  id: string;
  tenant_id: string;
  amount: number;
  available_amount: number;
  type: "security" | "pet" | "key" | "other";
  description?: string;
  received_date: string;
  status: "held" | "applied" | "returned";
}

export interface TenantCredit {
  id: string;
  tenant_id: string;
  amount: number;
  available_amount: number;
  reason: string;
  created_date: string;
  expires_date?: string;
  status: "available" | "applied" | "expired";
}

export interface OutstandingInvoice {
  id: string;
  transaction_id: string;
  amount: number;
  outstanding_amount: number;
  due_date: string;
  description: string;
  type: string;
  days_overdue: number;
  status: "open" | "overdue" | "partial";
}
