"use client";

import { supabase } from "@/lib/supabase";
import { Property, PropertyCreateInput, PropertyUpdateInput } from "@/types/property";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// Get all properties for the current user
export function useGetProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

// Get a single property by ID
export function useGetProperty(id: string) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: async (): Promise<Property> => {
      const { data, error } = await supabase
        .from("properties")
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

// Create a new property
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (property: PropertyCreateInput) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a property");
      }

      // Add the user_id to the property
      const propertyWithUserId = {
        ...property,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyWithUserId])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: "Property created",
        description: "Your property has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating property",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update an existing property
export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      property,
    }: {
      id: string;
      property: PropertyUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(property)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.id],
      });
      toast({
        title: "Property updated",
        description: "Your property has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating property",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a property
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: "Property deleted",
        description: "Your property has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting property",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
