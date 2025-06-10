import { z } from "zod";

// Document categories
export const documentCategories = [
  "lease_agreement",
  "tenant_application",
  "maintenance_report",
  "inspection_report",
  "insurance_document",
  "property_deed",
  "tax_document",
  "utility_bill",
  "vendor_contract",
  "legal_document",
  "financial_statement",
  "other"
] as const;

export type DocumentCategory = typeof documentCategories[number];

// Document status
export const documentStatuses = [
  "active",
  "archived",
  "expired",
  "pending_review"
] as const;

export type DocumentStatus = typeof documentStatuses[number];

// Document form schema
export const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  category: z.enum(documentCategories, {
    required_error: "Category is required",
  }),
  description: z.string().optional(),
  property_id: z.string().uuid().optional(),
  lease_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  expiration_date: z.string().optional().refine((date) => {
    if (!date || date === "") return true; // Allow empty dates
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()); // Validate date format
  }, "Invalid date format"),
  tags: z.array(z.string()).optional(),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;

// Document interface
export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  description?: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  storage_path?: string;
  status: DocumentStatus;
  property_id?: string;
  lease_id?: string;
  tenant_id?: string;
  expiration_date?: string;
  tags?: string[];
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// Document with relations
export interface DocumentWithRelations extends Document {
  property?: {
    id: string;
    name: string;
    address: string;
  };
  lease?: {
    id: string;
    start_date: string;
    end_date: string;
    unit?: {
      id: string;
      name: string;
      property?: {
        id: string;
        name: string;
      };
    };
  };
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  uploader?: {
    id: string;
    full_name: string;
  };
}

// Document filters
export interface DocumentFilters {
  search?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  property_id?: string;
  lease_id?: string;
  tenant_id?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
}

// Document create input
export interface DocumentCreateInput {
  name: string;
  category: DocumentCategory;
  description?: string;
  file: File;
  property_id?: string;
  lease_id?: string;
  tenant_id?: string;
  expiration_date?: string;
  tags?: string[];
}

// Document update input
export interface DocumentUpdateInput {
  name?: string;
  category?: DocumentCategory;
  description?: string;
  status?: DocumentStatus;
  property_id?: string;
  lease_id?: string;
  tenant_id?: string;
  expiration_date?: string;
  tags?: string[];
}

// Document category config
export const documentCategoryConfig = {
  lease_agreement: {
    label: "Lease Agreement",
    icon: "ri-file-text-line",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  tenant_application: {
    label: "Tenant Application",
    icon: "ri-user-add-line",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  maintenance_report: {
    label: "Maintenance Report",
    icon: "ri-tools-line",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  inspection_report: {
    label: "Inspection Report",
    icon: "ri-search-line",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  insurance_document: {
    label: "Insurance Document",
    icon: "ri-shield-check-line",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  property_deed: {
    label: "Property Deed",
    icon: "ri-home-line",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  tax_document: {
    label: "Tax Document",
    icon: "ri-calculator-line",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  utility_bill: {
    label: "Utility Bill",
    icon: "ri-flashlight-line",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  vendor_contract: {
    label: "Vendor Contract",
    icon: "ri-handshake-line",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  legal_document: {
    label: "Legal Document",
    icon: "ri-scales-line",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  financial_statement: {
    label: "Financial Statement",
    icon: "ri-line-chart-line",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  other: {
    label: "Other",
    icon: "ri-file-line",
    color: "bg-slate-100 text-slate-800 border-slate-200",
  },
} as const;

// Document status config
export const documentStatusConfig = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  archived: {
    label: "Archived",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  expired: {
    label: "Expired",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  pending_review: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
} as const;
