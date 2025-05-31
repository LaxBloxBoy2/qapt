"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertyPurchase {
  id: string;
  property_id: string;
  purchase_date: string;
  purchase_price: number;
  down_payment: number;
  depreciation_years: number;
  land_value: number;
  notes?: string;
  created_at: string;
}

// Get purchase for a property
export function useGetPropertyPurchase(propertyId: string) {
  return useQuery({
    queryKey: ["property-purchase", propertyId],
    queryFn: async (): Promise<PropertyPurchase | null> => {
      const { data, error } = await supabase
        .from("property_purchases")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!propertyId,
  });
}

// Update or create property purchase
export function useUpdatePropertyPurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      purchase 
    }: { 
      propertyId: string; 
      purchase: { 
        purchase_date: string;
        purchase_price: number;
        down_payment: number;
        depreciation_years: number;
        land_value: number;
        notes?: string;
      } 
    }) => {
      // Check if a purchase already exists for this property
      const { data: existingPurchase, error: checkError } = await supabase
        .from("property_purchases")
        .select("id")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Error checking existing purchase: ${checkError.message}`);
      }

      if (existingPurchase) {
        // Update existing purchase
        const { data, error } = await supabase
          .from("property_purchases")
          .update({
            purchase_date: purchase.purchase_date,
            purchase_price: purchase.purchase_price,
            down_payment: purchase.down_payment,
            depreciation_years: purchase.depreciation_years,
            land_value: purchase.land_value,
            notes: purchase.notes || null
          })
          .eq("id", existingPurchase.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Error updating purchase: ${error.message}`);
        }

        return data;
      } else {
        // Create new purchase
        const { data, error } = await supabase
          .from("property_purchases")
          .insert([
            {
              property_id: propertyId,
              purchase_date: purchase.purchase_date,
              purchase_price: purchase.purchase_price,
              down_payment: purchase.down_payment,
              depreciation_years: purchase.depreciation_years,
              land_value: purchase.land_value,
              notes: purchase.notes || null
            }
          ])
          .select()
          .single();

        if (error) {
          throw new Error(`Error creating purchase: ${error.message}`);
        }

        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-purchase", variables.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating purchase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
