import { z } from "zod";

export const applianceStatuses = ["active", "maintenance", "retired"] as const;
export const checkupStatuses = ["scheduled", "completed", "cancelled"] as const;

export interface ApplianceCategory {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
}

export const applianceSchema = z.object({
  name: z.string().min(1, "Appliance name is required"),
  property_id: z.string().uuid("Property ID is required"),
  category_id: z.string().uuid("Category is required"),
  sub_category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  status: z.enum(applianceStatuses),
  installation_date: z.string().optional(),
  warranty_expiration: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  image_url: z.string().optional(),
});

export type ApplianceFormValues = z.infer<typeof applianceSchema>;

export interface Appliance extends ApplianceFormValues {
  id: string;
  user_id: string;
  created_at: string;
  last_maintenance_date?: string;
  // Optional category relationship for when appliances are fetched with category data
  category?: ApplianceCategory;
}

export type ApplianceCreateInput = ApplianceFormValues & {
  user_id: string;
};

export type ApplianceUpdateInput = Partial<ApplianceFormValues>;

export const applianceCheckupSchema = z.object({
  appliance_id: z.string().uuid("Appliance ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(checkupStatuses).default("scheduled"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  completed_date: z.string().optional(),
  notes: z.string().optional(),
});

export type ApplianceCheckupFormValues = z.infer<typeof applianceCheckupSchema>;

export interface ApplianceCheckup extends ApplianceCheckupFormValues {
  id: string;
  created_at: string;
}

export interface ApplianceAttachment {
  id: string;
  appliance_id: string;
  name: string;
  url: string;
  storage_path?: string;
  file_type?: string;
  created_at: string;
}
