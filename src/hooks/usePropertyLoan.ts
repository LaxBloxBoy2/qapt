"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertyLoan {
  id: string;
  property_id: string;
  start_date: string;
  loan_amount: number;
  interest_rate: number;
  loan_type: string;
  period_years: number;
  current_balance: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
}

// Get loan for a property
export function useGetPropertyLoan(propertyId: string) {
  return useQuery({
    queryKey: ["property-loan", propertyId],
    queryFn: async (): Promise<PropertyLoan | null> => {
      const { data, error } = await supabase
        .from("property_loans")
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

// Update or create property loan
export function useUpdatePropertyLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      loan 
    }: { 
      propertyId: string; 
      loan: { 
        start_date: string;
        loan_amount: number;
        interest_rate: number;
        loan_type: string;
        period_years: number;
        current_balance: number;
        contact_name?: string;
        contact_email?: string;
        contact_phone?: string;
      } 
    }) => {
      // Check if a loan already exists for this property
      const { data: existingLoan, error: checkError } = await supabase
        .from("property_loans")
        .select("id")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Error checking existing loan: ${checkError.message}`);
      }

      if (existingLoan) {
        // Update existing loan
        const { data, error } = await supabase
          .from("property_loans")
          .update({
            start_date: loan.start_date,
            loan_amount: loan.loan_amount,
            interest_rate: loan.interest_rate,
            loan_type: loan.loan_type,
            period_years: loan.period_years,
            current_balance: loan.current_balance,
            contact_name: loan.contact_name || null,
            contact_email: loan.contact_email || null,
            contact_phone: loan.contact_phone || null
          })
          .eq("id", existingLoan.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Error updating loan: ${error.message}`);
        }

        return data;
      } else {
        // Create new loan
        const { data, error } = await supabase
          .from("property_loans")
          .insert([
            {
              property_id: propertyId,
              start_date: loan.start_date,
              loan_amount: loan.loan_amount,
              interest_rate: loan.interest_rate,
              loan_type: loan.loan_type,
              period_years: loan.period_years,
              current_balance: loan.current_balance,
              contact_name: loan.contact_name || null,
              contact_email: loan.contact_email || null,
              contact_phone: loan.contact_phone || null
            }
          ])
          .select()
          .single();

        if (error) {
          throw new Error(`Error creating loan: ${error.message}`);
        }

        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["property-loan", variables.propertyId] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating loan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
