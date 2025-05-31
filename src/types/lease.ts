import { z } from "zod";
import { Tenant } from "./tenant";
import { Unit } from "./unit";

// Lease status types
export const leaseStatuses = ["active", "upcoming", "expired", "unknown"] as const;
export type LeaseStatus = typeof leaseStatuses[number];

// Base lease schema for form validation
export const leaseSchema = z.object({
  unit_id: z.string().uuid("Please select a unit"),
  tenant_ids: z.array(z.string().uuid()).optional(), // Made optional for draft leases
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  rent_amount: z.coerce.number().positive("Rent amount must be greater than 0"),
  deposit_amount: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  is_draft: z.boolean().optional(), // Add draft status
});

// Form values type
export type LeaseFormValues = z.infer<typeof leaseSchema>;

// Lease interface
export interface Lease {
  id: string;
  user_id?: string; // Made optional since we're not using it directly
  unit_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount?: number;
  security_deposit?: number; // Alternative name for deposit_amount
  deposit?: number; // Another alternative name for deposit_amount
  status?: LeaseStatus; // Made optional in case it's missing
  notes?: string;
  is_draft?: boolean; // Add draft status
  created_at: string;
  updated_at: string;
}

// Lease tenant junction interface
export interface LeaseTenant {
  id: string;
  lease_id: string;
  tenant_id: string;
  is_primary: boolean;
  created_at: string;
}

// Lease attachment interface
export interface LeaseAttachment {
  id: string;
  lease_id: string;
  name: string;
  file_url: string;
  file_type?: string;
  created_at: string;
}

// Extended lease with related data
export interface LeaseWithRelations extends Lease {
  unit?: Unit;
  tenants?: Tenant[];
  primary_tenant?: Tenant;
  attachments?: LeaseAttachment[];
}

// Lease creation input
export type LeaseCreateInput = LeaseFormValues;

// Lease update input
export type LeaseUpdateInput = Partial<Omit<LeaseFormValues, "tenant_ids">> & {
  is_draft?: boolean;
};
