"use client";

import { supabase } from "@/lib/supabase";
import {
  Appliance,
  ApplianceCategory,
  ApplianceCreateInput,
  ApplianceUpdateInput,
  ApplianceCheckup,
  ApplianceAttachment,
  ApplianceCheckupFormValues
} from "@/types/appliance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// Get all appliances for the current user
export function useGetAppliances() {
  return useQuery({
    queryKey: ["appliances"],
    queryFn: async (): Promise<Appliance[]> => {
      const { data, error } = await supabase
        .from("appliances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

// Get all appliance categories
export function useGetApplianceCategories() {
  return useQuery({
    queryKey: ["appliance-categories"],
    queryFn: async (): Promise<ApplianceCategory[]> => {
      const { data, error } = await supabase
        .from("appliance_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

// Get a single appliance by ID
export function useGetAppliance(id: string) {
  return useQuery({
    queryKey: ["appliances", id],
    queryFn: async (): Promise<Appliance> => {
      const { data, error } = await supabase
        .from("appliances")
        .select("*")
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

// Get appliances for a specific property
export function useGetPropertyAppliances(propertyId: string) {
  return useQuery({
    queryKey: ["property-appliances", propertyId],
    queryFn: async (): Promise<Appliance[]> => {
      const { data, error } = await supabase
        .from("appliances")
        .select("*")
        .eq("property_id", propertyId)
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Create a new appliance
export function useCreateAppliance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (appliance: ApplianceCreateInput) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create an appliance");
      }

      // Add the user_id to the appliance
      const applianceWithUserId = {
        ...appliance,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from("appliances")
        .insert([applianceWithUserId])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appliances"] });
      queryClient.invalidateQueries({ queryKey: ["property-appliances", data.property_id] });
      toast({
        title: "Appliance created",
        description: "Your appliance has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating appliance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update an existing appliance
export function useUpdateAppliance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      appliance,
    }: {
      id: string;
      appliance: ApplianceUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("appliances")
        .update(appliance)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appliances"] });
      queryClient.invalidateQueries({ queryKey: ["appliances", data.id] });
      queryClient.invalidateQueries({ queryKey: ["property-appliances", data.property_id] });
      toast({
        title: "Appliance updated",
        description: "Your appliance has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating appliance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete an appliance
export function useDeleteAppliance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get the appliance first to get the property_id
      const { data: appliance, error: getError } = await supabase
        .from("appliances")
        .select("property_id")
        .eq("id", id)
        .single();

      if (getError) {
        throw new Error(getError.message);
      }

      const propertyId = appliance.property_id;

      // Delete the appliance
      const { error } = await supabase.from("appliances").delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appliances"] });
      queryClient.invalidateQueries({ queryKey: ["property-appliances", result.propertyId] });
      toast({
        title: "Appliance deleted",
        description: "Your appliance has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting appliance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get checkups for an appliance
export function useGetApplianceCheckups(applianceId: string) {
  return useQuery({
    queryKey: ["appliance-checkups", applianceId],
    queryFn: async (): Promise<ApplianceCheckup[]> => {
      const { data, error } = await supabase
        .from("appliance_checkups")
        .select("*")
        .eq("appliance_id", applianceId)
        .order("scheduled_date", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!applianceId,
  });
}

// Create a new checkup
export function useCreateApplianceCheckup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (checkup: ApplianceCheckupFormValues) => {
      const { data, error } = await supabase
        .from("appliance_checkups")
        .insert([checkup])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appliance-checkups", data.appliance_id] });
      toast({
        title: "Checkup scheduled",
        description: "Your checkup has been scheduled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error scheduling checkup",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get attachments for an appliance
export function useGetApplianceAttachments(applianceId: string) {
  return useQuery({
    queryKey: ["appliance-attachments", applianceId],
    queryFn: async (): Promise<ApplianceAttachment[]> => {
      const { data, error } = await supabase
        .from("appliance_attachments")
        .select("*")
        .eq("appliance_id", applianceId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!applianceId,
  });
}

// Upload an attachment for an appliance
export function useUploadApplianceAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      applianceId,
      file,
      name
    }: {
      applianceId: string;
      file: File;
      name?: string;
    }) => {
      // 1. Upload the file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `appliance-attachments/${applianceId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("appliance-files")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("appliance-files")
        .getPublicUrl(filePath);

      // 3. Insert the record in the database
      const { data, error } = await supabase
        .from("appliance_attachments")
        .insert([
          {
            appliance_id: applianceId,
            name: name || file.name,
            url: publicUrl,
            storage_path: filePath,
            file_type: file.type
          }
        ])
        .select()
        .single();

      if (error) {
        // If there was an error inserting the record, try to delete the uploaded file
        await supabase.storage
          .from("appliance-files")
          .remove([filePath]);

        throw new Error(`Error saving attachment record: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["appliance-attachments", variables.applianceId]
      });
      toast({
        title: "Attachment uploaded",
        description: "Your attachment has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error uploading attachment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
