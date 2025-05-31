"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertySpec {
  id: string;
  property_id: string;
  type: string;
  name: string;
  details?: string;
  location?: string;
  created_at: string;
}

// Get all specs for a property
export function useGetPropertySpecs(propertyId: string) {
  return useQuery({
    queryKey: ["property-specs", propertyId],
    queryFn: async (): Promise<PropertySpec[]> => {
      const { data, error } = await supabase
        .from("property_specs")
        .select("*")
        .eq("property_id", propertyId)
        .order("type", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Add a property spec
export function useAddPropertySpec() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      spec 
    }: { 
      propertyId: string; 
      spec: { 
        type: string; 
        name: string; 
        details?: string; 
        location?: string; 
      } 
    }) => {
      const { data, error } = await supabase
        .from("property_specs")
        .insert([
          { 
            property_id: propertyId,
            type: spec.type,
            name: spec.name,
            details: spec.details || null,
            location: spec.location || null
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Error adding specification: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-specs", variables.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding specification",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a property spec
export function useDeletePropertySpec() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (specId: string) => {
      // Get the spec to get the property_id
      const { data: spec, error: getError } = await supabase
        .from("property_specs")
        .select("property_id")
        .eq("id", specId)
        .single();

      if (getError) {
        throw new Error(`Error getting specification: ${getError.message}`);
      }

      const propertyId = spec.property_id;

      // Delete the spec
      const { error } = await supabase
        .from("property_specs")
        .delete()
        .eq("id", specId);

      if (error) {
        throw new Error(`Error deleting specification: ${error.message}`);
      }

      return { specId, propertyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-specs", data.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting specification",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
