"use client";

import { supabase } from "@/lib/supabase";
import { Lease, LeaseAttachment, LeaseCreateInput, LeaseFormValues, LeaseUpdateInput, LeaseWithRelations } from "@/types/lease";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { format } from "date-fns";

// Fetch all leases with related data
export function useLeases() {
  return useQuery({
    queryKey: ["leases"],
    queryFn: async (): Promise<LeaseWithRelations[]> => {
      try {
        console.log("Fetching all leases");

        // Log authentication status for debugging
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        console.log("useLeases hook - Auth session:", session ? "Authenticated" : "Not authenticated", "Error:", authError);

        console.log("Attempting to fetch all leases");

        // Try to get all leases directly using property-based query
        const { data, error } = await supabase
          .from("leases")
          .select(`
            *,
            unit:unit_id (
              id,
              name,
              property_id,
              properties:property_id (
                id,
                name,
                address,
                user_id
              )
            ),
            lease_tenants!lease_id (
              id,
              tenant_id,
              is_primary,
              tenants:tenant_id (
                id,
                first_name,
                last_name,
                email,
                is_company,
                company_name
              )
            ),
            lease_attachments!lease_id (
              id,
              name,
              file_url,
              file_type,
              created_at
            )
          `)
          .order("created_at", { ascending: false });

        console.log("All leases query using property-based approach");

        // Log the query details
        console.log("All leases query details:", {
          table: "leases",
          select: "*",
          order: "created_at DESC"
        });

        console.log("All leases query result:", data, "Error:", error);

        if (error) {
          console.error("Error fetching leases:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (data && data.length > 0) {
          console.log(`Found ${data.length} leases in database`);

          // Process the data to match our LeaseWithRelations interface
          return data.map((lease) => {
            try {
              // Handle case where lease_tenants or lease_attachments might be null
              const lease_tenants = lease.lease_tenants || [];
              const lease_attachments = lease.lease_attachments || [];

              // Filter out any null tenants
              const tenants = lease_tenants
                .map((lt: any) => lt?.tenants)
                .filter(Boolean);

              const primaryTenant = lease_tenants.find((lt: any) => lt?.is_primary)?.tenants;

              return {
                ...lease,
                tenants,
                primary_tenant: primaryTenant,
                attachments: lease_attachments,
                // Use the status as is or default to "unknown"
                status: lease.status || "unknown"
              };
            } catch (error) {
              console.error("Error processing lease:", error, "Lease data:", lease);
              // Return a minimal valid lease object
              return {
                ...lease,
                tenants: [],
                primary_tenant: undefined,
                attachments: [],
                status: "unknown"
              };
            }
          });
        }

        console.log("No leases found in database");
        return [];
      } catch (error) {
        console.error("Unexpected error in useLeases:", error);
        return [];
      }
    },
  });
}

// Fetch a single lease by ID
export function useLease(id: string) {
  return useQuery({
    queryKey: ["lease", id],
    queryFn: async (): Promise<LeaseWithRelations | null> => {
      try {
        console.log("Fetching lease with ID:", id);

        // Log authentication status for debugging
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        console.log("useLease hook - Auth session:", session ? "Authenticated" : "Not authenticated", "Error:", authError);

        console.log("Attempting to fetch lease with ID:", id);

        // First try to get the specific lease directly using property-based query
        const { data: directLease, error: directError } = await supabase
          .from("leases")
          .select(`
            *,
            unit:unit_id (
              id,
              name,
              property_id,
              properties:property_id (
                id,
                name,
                address,
                user_id
              )
            ),
            lease_tenants!lease_id (
              id,
              tenant_id,
              is_primary,
              tenants:tenant_id (
                id,
                first_name,
                last_name,
                email,
                is_company,
                company_name
              )
            ),
            lease_attachments!lease_id (
              id,
              name,
              file_url,
              file_type,
              created_at
            )
          `)
          .eq("id", id)
          .maybeSingle();

        console.log("Direct lease query using property-based approach");

        console.log("Direct lease query result:", directLease, "Error:", directError);

        if (directError) {
          console.error("Error fetching lease:", directError);
          throw new Error(`Database error: ${directError.message}`);
        }

        if (!directLease) {
          throw new Error(`Lease with ID ${id} not found`);
        }

        // Process the data to match our LeaseWithRelations interface
        const lease_tenants = directLease.lease_tenants || [];
        const lease_attachments = directLease.lease_attachments || [];

        const tenants = lease_tenants
          .map((lt: any) => lt?.tenants)
          .filter(Boolean);

        const primaryTenant = lease_tenants.find((lt: any) => lt?.is_primary)?.tenants;

        return {
          ...directLease,
          tenants,
          primary_tenant: primaryTenant,
          attachments: lease_attachments,
        };
      } catch (error) {
        console.error("Unexpected error in useLease:", error);
        return null;
      }
    },
    enabled: !!id,
  });
}

// Create a new lease
export function useCreateLease() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: LeaseFormValues) => {
      // Get the current user's ID - not needed for insert but useful for validation
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Start a transaction
      // Create an object with the values we want to insert
      const leaseData: any = {};

      // Check which columns exist in the leases table
      try {
        // First, check if the leases table exists and what columns it has
        const { data: columns, error: columnsError } = await supabase
          .from('leases')
          .select('*')
          .limit(1);

        if (columnsError) {
          console.error("Error checking leases table:", columnsError);
          // If we can't check, assume all columns exist
          leaseData.unit_id = values.unit_id;
          leaseData.start_date = values.start_date;
          leaseData.end_date = values.end_date;
          leaseData.rent_amount = values.rent_amount;
          leaseData.is_draft = values.is_draft || false;
        } else {
          // If we got data back, check which columns exist
          if (columns && columns.length > 0) {
            const sampleRow = columns[0];

            // Add each field only if the column exists
            if ('unit_id' in sampleRow) {
              leaseData.unit_id = values.unit_id;
            }

            if ('start_date' in sampleRow) {
              leaseData.start_date = values.start_date;
            }

            if ('end_date' in sampleRow) {
              leaseData.end_date = values.end_date;
            }

            if ('rent_amount' in sampleRow) {
              leaseData.rent_amount = values.rent_amount;
            }

            if ('notes' in sampleRow && values.notes) {
              leaseData.notes = values.notes;
            }

            if ('is_draft' in sampleRow) {
              leaseData.is_draft = values.is_draft || false;
            }
          } else {
            // No data returned, assume all columns exist
            leaseData.unit_id = values.unit_id;
            leaseData.start_date = values.start_date;
            leaseData.end_date = values.end_date;
            leaseData.rent_amount = values.rent_amount;
            leaseData.is_draft = values.is_draft || false;
          }
        }
      } catch (error) {
        console.error("Error determining columns:", error);
        // If we can't check, assume all columns exist
        leaseData.unit_id = values.unit_id;
        leaseData.start_date = values.start_date;
        leaseData.end_date = values.end_date;
        leaseData.rent_amount = values.rent_amount;
        leaseData.is_draft = values.is_draft || false;
      }

      // We've already checked for notes column above

      // Add deposit_amount if it's provided and we found the column
      if (values.deposit_amount !== undefined && values.deposit_amount !== null) {
        try {
          // We already checked the columns above, so we can use the same approach
          const { data: columns, error: columnsError } = await supabase
            .from('leases')
            .select('*')
            .limit(1);

          if (columnsError) {
            console.error("Error checking leases table for deposit column:", columnsError);
          } else if (columns && columns.length > 0) {
            const sampleRow = columns[0];

            // Check for different possible deposit column names
            if ('deposit_amount' in sampleRow) {
              leaseData.deposit_amount = values.deposit_amount;
            } else if ('security_deposit' in sampleRow) {
              leaseData.security_deposit = values.deposit_amount;
            } else if ('deposit' in sampleRow) {
              leaseData.deposit = values.deposit_amount;
            } else {
              console.warn("No deposit column found in leases table");
            }
          }
        } catch (error) {
          console.error("Error determining deposit column name:", error);
        }
      }

      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .insert([leaseData])
        .select()
        .single();

      if (leaseError) {
        throw new Error(leaseError.message);
      }

      // Create lease-tenant relationships (only if tenants are provided)
      console.log("Creating lease-tenant relationships for lease:", lease.id);
      console.log("Tenant IDs:", values.tenant_ids);
      console.log("Is draft:", values.is_draft);

      // Only require tenants for non-draft leases
      if (!values.is_draft && (!values.tenant_ids || values.tenant_ids.length === 0)) {
        throw new Error("No tenants selected for the lease");
      }

      // Insert tenants if provided
      if (values.tenant_ids && values.tenant_ids.length > 0) {
        for (let i = 0; i < values.tenant_ids.length; i++) {
          const tenantId = values.tenant_ids[i];
          const isPrimary = i === 0; // First tenant is primary by default

          console.log(`Adding tenant ${tenantId} to lease ${lease.id}, isPrimary: ${isPrimary}`);

          const { error: tenantError } = await supabase
            .from("lease_tenants")
            .insert({
              lease_id: lease.id,
              tenant_id: tenantId,
              is_primary: isPrimary
            });

          if (tenantError) {
            console.error(`Error adding tenant ${tenantId}:`, tenantError);
            throw new Error(`Failed to add tenant: ${tenantError.message}`);
          }
        }
        console.log("All tenants added successfully");
      } else {
        console.log("No tenants to add - this is a draft lease");
      }

      return lease;
    },
    onSuccess: (lease, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast({
        title: "Success",
        description: variables.is_draft
          ? "Draft lease saved successfully"
          : "Lease created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create lease: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update an existing lease
export function useUpdateLease() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: LeaseUpdateInput;
    }) => {
      // Create an object with the values we want to update
      const updateData: any = {};

      // Get the current lease to see what columns it has
      try {
        const { data: currentLease, error: leaseError } = await supabase
          .from('leases')
          .select('*')
          .eq('id', id)
          .single();

        if (leaseError) {
          console.error("Error checking lease:", leaseError);
          // If we can't check, assume all columns exist
          updateData.unit_id = values.unit_id;
          updateData.start_date = values.start_date;
          updateData.end_date = values.end_date;
          updateData.rent_amount = values.rent_amount;
        } else if (currentLease) {
          // Check which columns exist
          if ('unit_id' in currentLease && values.unit_id !== undefined) {
            updateData.unit_id = values.unit_id;
          }

          if ('start_date' in currentLease && values.start_date !== undefined) {
            updateData.start_date = values.start_date;
          }

          if ('end_date' in currentLease && values.end_date !== undefined) {
            updateData.end_date = values.end_date;
          }

          if ('rent_amount' in currentLease && values.rent_amount !== undefined) {
            updateData.rent_amount = values.rent_amount;
          }

          if ('notes' in currentLease && values.notes !== undefined) {
            updateData.notes = values.notes;
          }

          if ('is_draft' in currentLease && values.is_draft !== undefined) {
            updateData.is_draft = values.is_draft;
          }

          // Check for deposit column
          if (values.deposit_amount !== undefined && values.deposit_amount !== null) {
            if ('deposit_amount' in currentLease) {
              updateData.deposit_amount = values.deposit_amount;
            } else if ('security_deposit' in currentLease) {
              updateData.security_deposit = values.deposit_amount;
            } else if ('deposit' in currentLease) {
              updateData.deposit = values.deposit_amount;
            } else {
              console.warn("No deposit column found in leases table");
            }
          }
        }
      } catch (error) {
        console.error("Error determining lease columns:", error);
        // If we can't check, assume all columns exist
        updateData.unit_id = values.unit_id;
        updateData.start_date = values.start_date;
        updateData.end_date = values.end_date;
        updateData.rent_amount = values.rent_amount;
      }

      // Remove any undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { data, error } = await supabase
        .from("leases")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["lease", variables.id] });
      toast({
        title: "Success",
        description: variables.values.is_draft === false
          ? "Lease finalized and activated successfully"
          : variables.values.is_draft === true
          ? "Lease saved as draft"
          : "Lease updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update lease: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete a lease
export function useDeleteLease() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leases")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast({
        title: "Success",
        description: "Lease deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete lease: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Upload a lease attachment
export function useUploadLeaseAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      leaseId,
      file,
      fileName,
    }: {
      leaseId: string;
      file: File;
      fileName?: string;
    }) => {
      // Generate a unique file path
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const filePath = `${leaseId}/${timestamp}-${fileName || file.name}`;

      // Upload the file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lease-files')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lease-files')
        .getPublicUrl(filePath);

      // Create the attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from('lease_attachments')
        .insert({
          lease_id: leaseId,
          name: fileName || file.name,
          file_url: publicUrl,
          file_type: file.type,
        })
        .select()
        .single();

      if (attachmentError) {
        throw new Error(attachmentError.message);
      }

      return attachment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lease", variables.leaseId] });
      toast({
        title: "Success",
        description: "Attachment uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload attachment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete a lease attachment
export function useDeleteLeaseAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      leaseId,
      filePath,
    }: {
      id: string;
      leaseId: string;
      filePath: string;
    }) => {
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('lease-files')
        .remove([filePath]);

      if (storageError) {
        throw new Error(storageError.message);
      }

      // Delete the attachment record
      const { error: recordError } = await supabase
        .from('lease_attachments')
        .delete()
        .eq('id', id);

      if (recordError) {
        throw new Error(recordError.message);
      }

      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lease", variables.leaseId] });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete attachment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
