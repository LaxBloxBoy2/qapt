import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Application,
  ApplicationWithRelations,
  ApplicationFormValues,
  ApplicationUpdateInput,
  ApplicationFilters,
  ApplicationNote
} from "@/types/application";
import { useToast } from "./use-toast";

export function useApplications(filters?: ApplicationFilters) {
  return useQuery({
    queryKey: ["applications", filters],
    queryFn: async (): Promise<ApplicationWithRelations[]> => {
      try {
        console.log("Fetching applications with filters:", filters);

        let query = supabase
          .from("applications")
          .select(`
            *,
            unit:unit_id (
              id,
              name,
              market_rent,
              status,
              property_id,
              properties:property_id (
                id,
                name,
                address
              )
            ),
            attachments:application_attachments (
              id,
              name,
              file_url,
              file_type,
              file_size,
              created_at
            ),
            notes:application_notes (
              id,
              note,
              created_by,
              created_at
            )
          `)
          .order("submitted_at", { ascending: false });

        // Apply filters
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.property_id) {
          // Filter by property through the unit relationship
          query = query.eq("unit.properties.id", filters.property_id);
        }

        if (filters?.unit_id) {
          query = query.eq("unit_id", filters.unit_id);
        }

        if (filters?.submitted_after) {
          query = query.gte("submitted_at", filters.submitted_after);
        }

        if (filters?.submitted_before) {
          query = query.lte("submitted_at", filters.submitted_before);
        }

        if (filters?.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching applications:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
          return [];
        }

        console.log(`Found ${data.length} applications`);

        // Process the data to match our ApplicationWithRelations interface
        const processedApplications = data.map((app: any) => {
          const attachments = app.attachments || [];
          const notes = app.notes || [];

          return {
            ...app,
            attachments,
            notes,
          };
        });

        return processedApplications;
      } catch (error) {
        console.error("Error in useApplications:", error);
        throw error;
      }
    },
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: async (): Promise<ApplicationWithRelations | null> => {
      try {
        console.log("Fetching application with ID:", id);

        const { data: application, error } = await supabase
          .from("applications")
          .select(`
            *,
            unit:unit_id (
              id,
              name,
              market_rent,
              status,
              property_id,
              properties:property_id (
                id,
                name,
                address
              )
            ),
            attachments:application_attachments (
              id,
              name,
              file_url,
              file_type,
              file_size,
              created_at
            ),
            notes:application_notes (
              id,
              note,
              created_by,
              created_at
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching application:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!application) {
          throw new Error(`Application with ID ${id} not found`);
        }

        // Process the data to match our ApplicationWithRelations interface
        const attachments = application.attachments || [];
        const notes = application.notes || [];

        return {
          ...application,
          attachments,
          notes,
        };
      } catch (error) {
        console.error("Error in useApplication:", error);
        throw error;
      }
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: ApplicationFormValues): Promise<Application> => {
      try {
        console.log("Creating application:", values);

        const { attachments, property_id, ...applicationData } = values;

        // Create the application
        const { data: application, error } = await supabase
          .from("applications")
          .insert([applicationData])
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create application: ${error.message}`);
        }

        // Handle file uploads if any
        if (attachments && attachments.length > 0) {
          for (const file of attachments) {
            // Upload file to Supabase storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${application.id}/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('application-files')
              .upload(fileName, file);

            if (uploadError) {
              console.error("Error uploading file:", uploadError);
              continue; // Continue with other files
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('application-files')
              .getPublicUrl(fileName);

            // Save attachment record
            await supabase
              .from("application_attachments")
              .insert([{
                application_id: application.id,
                name: file.name,
                file_url: publicUrl,
                file_type: file.type,
                file_size: file.size,
              }]);
          }
        }

        return application;
      } catch (error) {
        console.error("Error creating application:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application submitted successfully",
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

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ApplicationUpdateInput }): Promise<Application> => {
      try {
        console.log("Updating application:", id, updates);

        const { data, error } = await supabase
          .from("applications")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update application: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error("Error updating application:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", data.id] });
      toast({
        title: "Success",
        description: "Application updated successfully",
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

export function useAddApplicationNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ applicationId, note }: { applicationId: string; note: string }): Promise<ApplicationNote> => {
      try {
        const { data, error } = await supabase
          .from("application_notes")
          .insert([{
            application_id: applicationId,
            note,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          }])
          .select(`*`)
          .single();

        if (error) {
          throw new Error(`Failed to add note: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error("Error adding note:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["application", data.application_id] });
      toast({
        title: "Success",
        description: "Note added successfully",
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
