"use client";

import { supabase } from "@/lib/supabase";
import { Tenant, TenantFormValues, TenantWithUnit } from "@/types/tenant";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// Fetch all tenants
export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async (): Promise<TenantWithUnit[]> => {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          units:unit_id (
            id,
            name,
            property_id,
            properties:property_id (
              id,
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

// Fetch a single tenant by ID
export function useTenant(id: string | null) {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: async (): Promise<TenantWithUnit | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          units:unit_id (
            id,
            name,
            property_id,
            properties:property_id (
              id,
              name
            )
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

// Create a new tenant
export function useCreateTenant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: TenantFormValues) => {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("tenants")
        .insert([{
          ...values,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({
        title: "Success",
        description: "Tenant created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create tenant: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update an existing tenant
export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: TenantFormValues;
    }) => {
      const { data, error } = await supabase
        .from("tenants")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.id] });
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update tenant: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete a tenant
export function useDeleteTenant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenants").delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete tenant: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
