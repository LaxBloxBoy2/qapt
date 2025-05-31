import { z } from "zod";

export const propertyTypes = ["single_unit", "multi_unit"] as const;
export const propertyStatuses = ["active", "inactive", "archived"] as const;

export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  year_built: z.coerce.number().int().positive().optional(),
  mls_number: z.string().optional(),
  type: z.enum(propertyTypes),
  is_mobile_home: z.boolean().default(false),
  beds: z.coerce.number().int().nonnegative().optional(),
  baths: z.coerce.number().nonnegative().optional(),
  size: z.coerce.number().nonnegative().optional(),
  market_rent: z.coerce.number().nonnegative().optional(),
  deposit: z.coerce.number().nonnegative().optional(),
  status: z.enum(propertyStatuses).default("active"),
  description: z.string().optional(),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

export interface Property extends PropertyFormValues {
  id: string;
  user_id: string;
  created_at: string;
  image_url?: string;
}

export type PropertyCreateInput = Omit<PropertyFormValues, "status"> & {
  status?: string;
};

export type PropertyUpdateInput = Partial<PropertyFormValues>;
