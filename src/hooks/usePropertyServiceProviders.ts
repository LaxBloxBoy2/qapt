"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertyServiceProvider {
  id: string;
  property_id: string;
  type: string;
  category: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  notes?: string;
  created_at: string;
}

// Get all service providers for a property
export function useGetPropertyServiceProviders(propertyId: string) {
  return useQuery({
    queryKey: ["property-service-providers", propertyId],
    queryFn: async (): Promise<PropertyServiceProvider[]> => {
      const { data, error } = await supabase
        .from("property_service_providers")
        .select("*")
        .eq("property_id", propertyId)
        .order("type", { ascending: true })
        .order("category", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Add a property service provider
export function useAddPropertyServiceProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      provider 
    }: { 
      propertyId: string; 
      provider: { 
        type: string;
        category: string;
        name: string;
        contact_name?: string;
        contact_email?: string;
        contact_phone?: string;
        website?: string;
        notes?: string;
      } 
    }) => {
      const { data, error } = await supabase
        .from("property_service_providers")
        .insert([
          { 
            property_id: propertyId,
            type: provider.type,
            category: provider.category,
            name: provider.name,
            contact_name: provider.contact_name || null,
            contact_email: provider.contact_email || null,
            contact_phone: provider.contact_phone || null,
            website: provider.website || null,
            notes: provider.notes || null
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Error adding service provider: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-service-providers", variables.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding service provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update a property service provider
export function useUpdatePropertyServiceProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      providerId, 
      provider 
    }: { 
      providerId: string; 
      provider: { 
        type: string;
        category: string;
        name: string;
        contact_name?: string;
        contact_email?: string;
        contact_phone?: string;
        website?: string;
        notes?: string;
      } 
    }) => {
      // Get the property_id first
      const { data: existingProvider, error: getError } = await supabase
        .from("property_service_providers")
        .select("property_id")
        .eq("id", providerId)
        .single();

      if (getError) {
        throw new Error(`Error getting service provider: ${getError.message}`);
      }

      const propertyId = existingProvider.property_id;

      // Update the service provider
      const { data, error } = await supabase
        .from("property_service_providers")
        .update({ 
          type: provider.type,
          category: provider.category,
          name: provider.name,
          contact_name: provider.contact_name || null,
          contact_email: provider.contact_email || null,
          contact_phone: provider.contact_phone || null,
          website: provider.website || null,
          notes: provider.notes || null
        })
        .eq("id", providerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating service provider: ${error.message}`);
      }

      return { data, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-service-providers", result.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating service provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a property service provider
export function useDeletePropertyServiceProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (providerId: string) => {
      // Get the property_id first
      const { data: provider, error: getError } = await supabase
        .from("property_service_providers")
        .select("property_id")
        .eq("id", providerId)
        .single();

      if (getError) {
        throw new Error(`Error getting service provider: ${getError.message}`);
      }

      const propertyId = provider.property_id;

      // Delete the service provider
      const { error } = await supabase
        .from("property_service_providers")
        .delete()
        .eq("id", providerId);

      if (error) {
        throw new Error(`Error deleting service provider: ${error.message}`);
      }

      return { providerId, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-service-providers", result.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting service provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
