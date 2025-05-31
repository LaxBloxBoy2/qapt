"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertyFeature {
  id: string;
  property_id: string;
  category: string;
  name: string;
  created_at: string;
}

// Get all features for a property
export function useGetPropertyFeatures(propertyId: string) {
  return useQuery({
    queryKey: ["property-features", propertyId],
    queryFn: async (): Promise<PropertyFeature[]> => {
      const { data, error } = await supabase
        .from("property_features")
        .select("*")
        .eq("property_id", propertyId)
        .order("category", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Update property features (replace all features)
export function useUpdatePropertyFeatures() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      features 
    }: { 
      propertyId: string; 
      features: { category: string; name: string }[] 
    }) => {
      // 1. Delete all existing features for this property
      const { error: deleteError } = await supabase
        .from("property_features")
        .delete()
        .eq("property_id", propertyId);

      if (deleteError) {
        throw new Error(`Error deleting existing features: ${deleteError.message}`);
      }

      // 2. Insert new features
      if (features.length > 0) {
        const featuresToInsert = features.map(feature => ({
          property_id: propertyId,
          category: feature.category,
          name: feature.name
        }));

        const { data, error } = await supabase
          .from("property_features")
          .insert(featuresToInsert)
          .select();

        if (error) {
          throw new Error(`Error adding features: ${error.message}`);
        }

        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-features", variables.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating features",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
