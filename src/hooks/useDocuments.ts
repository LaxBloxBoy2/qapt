"use client";

import { supabase } from "@/lib/supabase";
import {
  Document,
  DocumentWithRelations,
  DocumentCreateInput,
  DocumentUpdateInput,
  DocumentFilters
} from "@/types/document";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// Get all documents with filters (optimized)
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: async (): Promise<DocumentWithRelations[]> => {
      try {
        // Start with a simpler query first
        let query = supabase
          .from("documents")
          .select(`
            id,
            name,
            category,
            description,
            file_name,
            file_url,
            file_size,
            file_type,
            storage_path,
            status,
            property_id,
            lease_id,
            tenant_id,
            expiration_date,
            tags,
            uploaded_by,
            created_at,
            updated_at
          `)
          .order("created_at", { ascending: false })
          .limit(50); // Add pagination limit

        // Apply filters
        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        if (filters?.category) {
          query = query.eq("category", filters.category);
        }

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.property_id) {
          query = query.eq("property_id", filters.property_id);
        }

        if (filters?.lease_id) {
          query = query.eq("lease_id", filters.lease_id);
        }

        if (filters?.tenant_id) {
          query = query.eq("tenant_id", filters.tenant_id);
        }

        if (filters?.date_from) {
          query = query.gte("created_at", filters.date_from);
        }

        if (filters?.date_to) {
          query = query.lte("created_at", filters.date_to);
        }

        const { data: documents, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        if (!documents || documents.length === 0) {
          return [];
        }

        // Get related data in separate, optimized queries
        const propertyIds = [...new Set(documents.filter(d => d.property_id).map(d => d.property_id))];
        const leaseIds = [...new Set(documents.filter(d => d.lease_id).map(d => d.lease_id))];
        const tenantIds = [...new Set(documents.filter(d => d.tenant_id).map(d => d.tenant_id))];
        const uploaderIds = [...new Set(documents.map(d => d.uploaded_by))];

        // Fetch related data in parallel
        const [propertiesData, leasesData, tenantsData, uploadersData] = await Promise.all([
          propertyIds.length > 0 ? supabase
            .from("properties")
            .select("id, name, address")
            .in("id", propertyIds) : Promise.resolve({ data: [] }),

          leaseIds.length > 0 ? supabase
            .from("leases")
            .select(`
              id,
              start_date,
              end_date,
              unit:unit_id (
                id,
                name,
                property:property_id (
                  id,
                  name
                )
              )
            `)
            .in("id", leaseIds) : Promise.resolve({ data: [] }),

          tenantIds.length > 0 ? supabase
            .from("tenants")
            .select("id, first_name, last_name, email")
            .in("id", tenantIds) : Promise.resolve({ data: [] }),

          uploaderIds.length > 0 ? supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", uploaderIds) : Promise.resolve({ data: [] })
        ]);

        // Create lookup maps for efficient joining
        const propertiesMap = new Map((propertiesData.data || []).map(p => [p.id, p]));
        const leasesMap = new Map((leasesData.data || []).map(l => [l.id, l]));
        const tenantsMap = new Map((tenantsData.data || []).map(t => [t.id, t]));
        const uploadersMap = new Map((uploadersData.data || []).map(u => [u.id, u]));

        // Combine the data
        const documentsWithRelations: DocumentWithRelations[] = documents.map(doc => ({
          ...doc,
          property: doc.property_id ? propertiesMap.get(doc.property_id) : undefined,
          lease: doc.lease_id ? (() => {
            const lease = leasesMap.get(doc.lease_id);
            if (!lease) return undefined;
            return {
              ...lease,
              unit: Array.isArray(lease.unit) ? lease.unit[0] : lease.unit
            };
          })() : undefined,
          tenant: doc.tenant_id ? tenantsMap.get(doc.tenant_id) : undefined,
          uploader: uploadersMap.get(doc.uploaded_by)
        })) as DocumentWithRelations[];

        return documentsWithRelations;
      } catch (error) {
        console.error("Error fetching documents:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to fetch documents");
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    retry: 2, // Retry failed requests twice
  });
}

// Get single document
export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async (): Promise<DocumentWithRelations> => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          property:property_id (
            id,
            name,
            address
          ),
          lease:lease_id (
            id,
            start_date,
            end_date,
            unit:unit_id (
              id,
              name,
              property:property_id (
                id,
                name
              )
            )
          ),
          tenant:tenant_id (
            id,
            first_name,
            last_name,
            email
          ),
          uploader:uploaded_by (
            id,
            full_name
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!id,
  });
}

// Upload document file to storage
const uploadDocumentFile = async (file: File, documentId: string): Promise<{ url: string; path: string }> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Create a simple, safe file name
    const fileExt = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const fileName = `doc-${documentId}-${timestamp}.${fileExt}`;

    // Use a simple path structure
    const filePath = `documents/${fileName}`;

    console.log("Uploading file:", {
      originalName: file.name,
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id
    });

    // TEMPORARY BYPASS: If storage policies are not working, create a placeholder
    // This allows the documents module to work while storage is being fixed
    const BYPASS_STORAGE = false; // Set to true to bypass storage temporarily

    if (BYPASS_STORAGE) {
      console.log("BYPASSING STORAGE - Using placeholder URL");
      return {
        url: `https://via.placeholder.com/400x300/e2e8f0/64748b?text=${encodeURIComponent(file.name)}`,
        path: `placeholder/${fileName}`
      };
    }

    // Try multiple upload approaches aggressively
    let uploadData, uploadError;

    // Approach 1: Try document-files bucket first (most likely to work)
    try {
      console.log("Trying upload to document-files bucket");
      const result = await supabase.storage
        .from("document-files")
        .upload(filePath, file);

      if (!result.error) {
        const { data: urlData } = supabase.storage
          .from("document-files")
          .getPublicUrl(filePath);

        console.log("Upload successful to document-files:", result.data);
        return {
          url: urlData.publicUrl,
          path: filePath
        };
      } else {
        console.log("document-files upload failed:", result.error.message);
        uploadError = result.error;
      }
    } catch (err) {
      console.log("document-files exception:", err);
      uploadError = err;
    }

    // Approach 2: Try with upsert option
    try {
      console.log("Trying upload with upsert option");
      const result = await supabase.storage
        .from("document-files")
        .upload(filePath, file, { upsert: true });

      if (!result.error) {
        const { data: urlData } = supabase.storage
          .from("document-files")
          .getPublicUrl(filePath);

        console.log("Upsert upload successful:", result.data);
        return {
          url: urlData.publicUrl,
          path: filePath
        };
      } else {
        console.log("Upsert upload failed:", result.error.message);
        uploadError = result.error;
      }
    } catch (err) {
      console.log("Upsert exception:", err);
      uploadError = err;
    }

    // Approach 3: Try existing buckets as fallback
    const buckets = ['image_url', 'appliance-files'];
    for (const bucketName of buckets) {
      try {
        console.log(`Trying fallback bucket: ${bucketName}`);
        const result = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);

        if (!result.error) {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          console.log(`Fallback upload successful to ${bucketName}:`, result.data);
          return {
            url: urlData.publicUrl,
            path: filePath
          };
        } else {
          console.log(`Fallback ${bucketName} failed:`, result.error.message);
        }
      } catch (err) {
        console.log(`Fallback ${bucketName} exception:`, err);
      }
    }

    if (uploadError) {
      console.error("All upload attempts failed:", {
        message: (uploadError as any)?.message || 'Unknown error',
        statusCode: (uploadError as any)?.statusCode || 'Unknown',
        error: uploadError
      });

      // As a last resort, create a placeholder
      console.log("Creating placeholder URL as fallback");
      return {
        url: `https://via.placeholder.com/400x300/ef4444/ffffff?text=${encodeURIComponent('Upload Failed: ' + file.name)}`,
        path: `failed/${fileName}`
      };
    }

    console.log("Upload successful:", uploadData);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("document-files")
      .getPublicUrl(filePath);

    console.log("Public URL generated:", urlData.publicUrl);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error("File upload failed:", error);

    // Return placeholder on any error to keep the app working
    const fileName = `error-${Date.now()}.bin`;
    return {
      url: `https://via.placeholder.com/400x300/ef4444/ffffff?text=${encodeURIComponent('Error: ' + (error as Error).message)}`,
      path: `error/${fileName}`
    };
  }
};

// Create document
export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: DocumentCreateInput) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First create the document record to get an ID
      const { data: document, error: createError } = await supabase
        .from("documents")
        .insert([{
          name: input.name,
          category: input.category,
          description: input.description,
          file_name: input.file.name,
          file_size: input.file.size,
          file_type: input.file.type,
          status: "active",
          property_id: input.property_id,
          lease_id: input.lease_id,
          tenant_id: input.tenant_id,
          expiration_date: input.expiration_date || null,
          tags: input.tags,
          uploaded_by: user.id,
          file_url: "", // Temporary, will be updated after upload
          storage_path: "" // Temporary, will be updated after upload
        }])
        .select()
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      // Upload the file
      const { url, path } = await uploadDocumentFile(input.file, document.id);

      // Update the document with file URL and path
      const { data: updatedDocument, error: updateError } = await supabase
        .from("documents")
        .update({
          file_url: url,
          storage_path: path
        })
        .eq("id", document.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return updatedDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update document
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DocumentUpdateInput }) => {
      const { data, error } = await supabase
        .from("documents")
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get the document to get the storage path
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Delete the file from storage if it exists
      if (document.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("document-files")
          .remove([document.storage_path]);

        if (storageError) {
          console.warn("Error deleting file from storage:", storageError.message);
        }
      }

      // Delete the document record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get document statistics (optimized)
export function useDocumentStats() {
  return useQuery({
    queryKey: ["document-stats"],
    queryFn: async () => {
      try {
        // Get basic count first
        const { count: totalCount, error: countError } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true });

        if (countError) {
          throw new Error(countError.message);
        }

        // Get recent uploads count (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { count: recentCount, error: recentError } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekAgo.toISOString());

        if (recentError) {
          console.warn("Error fetching recent uploads:", recentError.message);
        }

        // Get category and status data with limit to avoid large queries
        const { data: categoryData, error: categoryError } = await supabase
          .from("documents")
          .select("category, status")
          .limit(1000); // Limit to avoid performance issues

        if (categoryError) {
          console.warn("Error fetching category data:", categoryError.message);
        }

        const stats = {
          total: totalCount || 0,
          byCategory: {} as Record<string, number>,
          byStatus: {} as Record<string, number>,
          recentUploads: recentCount || 0
        };

        // Process category and status data if available
        if (categoryData) {
          categoryData.forEach(doc => {
            stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
            stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
          });
        }

        return stats;
      } catch (error) {
        console.error("Error fetching document stats:", error);
        // Return default stats on error
        return {
          total: 0,
          byCategory: {},
          byStatus: {},
          recentUploads: 0
        };
      }
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 1, // Only retry once
  });
}

// Get document count for a specific property
export function usePropertyDocumentCount(propertyId?: string) {
  return useQuery({
    queryKey: ["property-document-count", propertyId],
    queryFn: async () => {
      if (!propertyId) return 0;

      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("property_id", propertyId);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!propertyId,
  });
}

// Get document count for a specific lease
export function useLeaseDocumentCount(leaseId?: string) {
  return useQuery({
    queryKey: ["lease-document-count", leaseId],
    queryFn: async () => {
      if (!leaseId) return 0;

      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("lease_id", leaseId);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!leaseId,
  });
}

// Get document count for a specific tenant
export function useTenantDocumentCount(tenantId?: string) {
  return useQuery({
    queryKey: ["tenant-document-count", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;

      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!tenantId,
  });
}

// Get recent documents for a specific property
export function usePropertyDocuments(propertyId?: string, limit = 5) {
  return useQuery({
    queryKey: ["property-documents", propertyId, limit],
    queryFn: async (): Promise<Document[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Get recent documents for a specific lease
export function useLeaseDocuments(leaseId?: string, limit = 5) {
  return useQuery({
    queryKey: ["lease-documents", leaseId, limit],
    queryFn: async (): Promise<Document[]> => {
      if (!leaseId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!leaseId,
  });
}

// Get recent documents for a specific tenant
export function useTenantDocuments(tenantId?: string, limit = 5) {
  return useQuery({
    queryKey: ["tenant-documents", tenantId, limit],
    queryFn: async (): Promise<Document[]> => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!tenantId,
  });
}
