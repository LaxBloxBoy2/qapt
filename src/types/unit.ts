import { z } from "zod";

export const unitTypes = [
  "Room",
  "Apartment",
  "Multiplex",
  "Single-Family",
  "Townhouse",
  "Condo",
  "Commercial"
] as const;

export const unitStatuses = ["vacant", "occupied", "maintenance"] as const;

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  property_id: z.string().uuid("Property ID is required"),
  unit_type: z.enum(unitTypes),
  status: z.enum(unitStatuses),
  description: z.string().optional(),
  beds: z.coerce.number().int().nonnegative().optional(),
  baths: z.coerce.number().nonnegative().optional(),
  size: z.coerce.number().nonnegative().optional(),
  market_rent: z.coerce.number().nonnegative().optional(),
  deposit: z.coerce.number().nonnegative().optional(),
  image_url: z.string().optional(),
});

export type UnitFormValues = z.infer<typeof unitSchema>;

export interface Unit extends UnitFormValues {
  id: string;
  user_id: string;
  created_at: string;
  // Optional property relationship for when units are fetched with property data
  properties?: {
    id: string;
    name: string;
    address?: string;
    user_id?: string;
  };
}

export type UnitCreateInput = {
  name: string;
  property_id: string;
  unit_type: typeof unitTypes[number];
  status: typeof unitStatuses[number]; // Make this required, not optional
  description?: string;
  beds?: number;
  baths?: number;
  size?: number;
  market_rent?: number;
  deposit?: number;
  image_url?: string;
  user_id: string;
};

export type UnitUpdateInput = Partial<UnitFormValues>;

// Unit Specs
export const unitSpecTypes = ["keys", "doors", "flooring", "paints"] as const;

export const unitSpecSchema = z.object({
  unit_id: z.string().uuid("Unit ID is required"),
  type: z.enum(unitSpecTypes),
  name: z.string().min(1, "Name is required"),
  details: z.string().optional(),
  location: z.string().optional(),
});

export type UnitSpecFormValues = z.infer<typeof unitSpecSchema>;

export interface UnitSpec extends UnitSpecFormValues {
  id: string;
  created_at: string;
}

// Unit Service Providers
export const unitServiceProviderTypes = ["responsibility", "utility"] as const;

export const unitServiceProviderSchema = z.object({
  unit_id: z.string().uuid("Unit ID is required"),
  type: z.enum(unitServiceProviderTypes),
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  contact_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type UnitServiceProviderFormValues = z.infer<typeof unitServiceProviderSchema>;

export interface UnitServiceProvider extends UnitServiceProviderFormValues {
  id: string;
  created_at: string;
}

// Unit Equipment
export const unitEquipmentSchema = z.object({
  unit_id: z.string().uuid("Unit ID is required"),
  name: z.string().min(1, "Name is required"),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_expiration: z.string().optional(),
  notes: z.string().optional(),
});

export type UnitEquipmentFormValues = z.infer<typeof unitEquipmentSchema>;

export interface UnitEquipment extends UnitEquipmentFormValues {
  id: string;
  created_at: string;
}

// Unit Maintenance
export const maintenanceStatuses = ["open", "in_progress", "completed", "cancelled"] as const;
export const maintenancePriorities = ["low", "medium", "high", "emergency"] as const;

export const unitMaintenanceSchema = z.object({
  unit_id: z.string().uuid("Unit ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(maintenanceStatuses).default("open"),
  priority: z.enum(maintenancePriorities).default("medium"),
  reported_date: z.string().optional(),
  completed_date: z.string().optional(),
});

export type UnitMaintenanceFormValues = z.infer<typeof unitMaintenanceSchema>;

export interface UnitMaintenance extends UnitMaintenanceFormValues {
  id: string;
  created_at: string;
}

// Unit Tenants
export const unitTenantSchema = z.object({
  unit_id: z.string().uuid("Unit ID is required"),
  tenant_id: z.string().uuid("Tenant ID is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  is_current: z.boolean().default(true),
});

export type UnitTenantFormValues = z.infer<typeof unitTenantSchema>;

export interface UnitTenant extends UnitTenantFormValues {
  id: string;
  created_at: string;
}
