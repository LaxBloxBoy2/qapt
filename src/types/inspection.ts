import { z } from "zod";

// Inspection types
export const inspectionTypes = ["move_in", "move_out"] as const;

// Available section types
export const sectionTypes = [
  "bedroom",
  "bathroom",
  "kitchen",
  "living_room",
  "dining_room",
  "hallway",
  "laundry",
  "garage",
  "exterior",
  "other"
] as const;

// Inspection schema
export const inspectionSchema = z.object({
  property_id: z.string().uuid("Property ID is required"),
  type: z.enum(inspectionTypes, {
    required_error: "Inspection type is required",
  }),
  required_sections: z.array(z.enum(sectionTypes)).min(1, "At least one section is required"),
  expiration_date: z.string().min(1, "Expiration date is required"),
});

export type InspectionFormValues = z.infer<typeof inspectionSchema>;

export interface Inspection extends InspectionFormValues {
  id: string;
  created_by: string;
  created_at: string;
}

export type InspectionCreateInput = InspectionFormValues & {
  created_by: string;
};

export type InspectionUpdateInput = Partial<InspectionFormValues>;

// Inspection Section schema
export const inspectionSectionSchema = z.object({
  inspection_id: z.string().uuid("Inspection ID is required"),
  name: z.string().min(1, "Section name is required"),
  section_type: z.enum(sectionTypes, {
    required_error: "Section type is required",
  }),
  notes: z.string().optional(),
});

export type InspectionSectionFormValues = z.infer<typeof inspectionSectionSchema>;

export interface InspectionSection extends InspectionSectionFormValues {
  id: string;
  created_at: string;
}

// Inspection Condition schema
export const inspectionConditionSchema = z.object({
  section_id: z.string().uuid("Section ID is required"),
  title: z.string().min(1, "Condition title is required"),
  description: z.string().optional(),
  cost_estimate: z.coerce.number().nonnegative().optional(),
});

export type InspectionConditionFormValues = z.infer<typeof inspectionConditionSchema>;

export interface InspectionCondition extends InspectionConditionFormValues {
  id: string;
  created_at: string;
}

// Inspection Media schema
export const mediaTypes = ["image", "video"] as const;

export const inspectionMediaSchema = z.object({
  condition_id: z.string().uuid("Condition ID is required"),
  url: z.string().url("Valid URL is required"),
  storage_path: z.string().min(1, "Storage path is required"),
  media_type: z.enum(mediaTypes, {
    required_error: "Media type is required",
  }),
});

export type InspectionMediaFormValues = z.infer<typeof inspectionMediaSchema>;

export interface InspectionMedia extends InspectionMediaFormValues {
  id: string;
  created_at: string;
}

// Extended inspection type with related data
export interface InspectionWithDetails extends Inspection {
  // Both property and properties are included for backward compatibility
  property?: {
    id: string;
    name: string;
    address: string;
    image_url?: string;
  };
  properties?: {
    id: string;
    name: string;
    address: string;
    image_url?: string;
  };
  sections?: (InspectionSection & {
    conditions?: (InspectionCondition & {
      media?: InspectionMedia[];
    })[];
  })[];
}
