"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertyInsurance {
  id: string;
  property_id: string;
  company_name: string;
  company_website?: string;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  policy_number: string;
  effective_date: string;
  expiration_date: string;
  premium: number;
  notify_before_expiration: boolean;
  details?: string;
  created_at: string;
}

// Get all insurances for a property
export function useGetPropertyInsurances(propertyId: string) {
  return useQuery({
    queryKey: ["property-insurances", propertyId],
    queryFn: async (): Promise<PropertyInsurance[]> => {
      const { data, error } = await supabase
        .from("property_insurances")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Add a property insurance
export function useAddPropertyInsurance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      insurance 
    }: { 
      propertyId: string; 
      insurance: { 
        company_name: string;
        company_website?: string;
        agent_name?: string;
        agent_email?: string;
        agent_phone?: string;
        policy_number: string;
        effective_date: string;
        expiration_date: string;
        premium: number;
        notify_before_expiration: boolean;
        details?: string;
      } 
    }) => {
      const { data, error } = await supabase
        .from("property_insurances")
        .insert([
          { 
            property_id: propertyId,
            company_name: insurance.company_name,
            company_website: insurance.company_website || null,
            agent_name: insurance.agent_name || null,
            agent_email: insurance.agent_email || null,
            agent_phone: insurance.agent_phone || null,
            policy_number: insurance.policy_number,
            effective_date: insurance.effective_date,
            expiration_date: insurance.expiration_date,
            premium: insurance.premium,
            notify_before_expiration: insurance.notify_before_expiration,
            details: insurance.details || null
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Error adding insurance: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-insurances", variables.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding insurance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update a property insurance
export function useUpdatePropertyInsurance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      insuranceId, 
      insurance 
    }: { 
      insuranceId: string; 
      insurance: { 
        company_name: string;
        company_website?: string;
        agent_name?: string;
        agent_email?: string;
        agent_phone?: string;
        policy_number: string;
        effective_date: string;
        expiration_date: string;
        premium: number;
        notify_before_expiration: boolean;
        details?: string;
      } 
    }) => {
      // Get the property_id first
      const { data: existingInsurance, error: getError } = await supabase
        .from("property_insurances")
        .select("property_id")
        .eq("id", insuranceId)
        .single();

      if (getError) {
        throw new Error(`Error getting insurance: ${getError.message}`);
      }

      const propertyId = existingInsurance.property_id;

      // Update the insurance
      const { data, error } = await supabase
        .from("property_insurances")
        .update({ 
          company_name: insurance.company_name,
          company_website: insurance.company_website || null,
          agent_name: insurance.agent_name || null,
          agent_email: insurance.agent_email || null,
          agent_phone: insurance.agent_phone || null,
          policy_number: insurance.policy_number,
          effective_date: insurance.effective_date,
          expiration_date: insurance.expiration_date,
          premium: insurance.premium,
          notify_before_expiration: insurance.notify_before_expiration,
          details: insurance.details || null
        })
        .eq("id", insuranceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating insurance: ${error.message}`);
      }

      return { data, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-insurances", result.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating insurance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a property insurance
export function useDeletePropertyInsurance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (insuranceId: string) => {
      // Get the property_id first
      const { data: insurance, error: getError } = await supabase
        .from("property_insurances")
        .select("property_id")
        .eq("id", insuranceId)
        .single();

      if (getError) {
        throw new Error(`Error getting insurance: ${getError.message}`);
      }

      const propertyId = insurance.property_id;

      // Delete the insurance
      const { error } = await supabase
        .from("property_insurances")
        .delete()
        .eq("id", insuranceId);

      if (error) {
        throw new Error(`Error deleting insurance: ${error.message}`);
      }

      return { insuranceId, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-insurances", result.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting insurance",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
