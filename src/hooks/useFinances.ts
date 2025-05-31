import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Transaction,
  TransactionWithRelations,
  TransactionFormValues,
  TransactionFilters,
  FinancialSummary,
  TransactionCategory,
  Vendor,
  VendorFormValues,
  CategoryFormValues,
} from "@/types/finance";

// Fetch all transactions with filters
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async (): Promise<TransactionWithRelations[]> => {
      try {
        // First, get transactions without relationships
        let query = supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false });

        // Apply filters
        if (filters?.type) {
          query = query.eq("type", filters.type);
        }
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.property_id) {
          query = query.eq("property_id", filters.property_id);
        }
        if (filters?.unit_id) {
          query = query.eq("unit_id", filters.unit_id);
        }
        if (filters?.tenant_id) {
          query = query.eq("tenant_id", filters.tenant_id);
        }
        if (filters?.vendor_id) {
          query = query.eq("vendor_id", filters.vendor_id);
        }
        if (filters?.category_id) {
          query = query.eq("category_id", filters.category_id);
        }
        if (filters?.date_from) {
          query = query.gte("due_date", filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte("due_date", filters.date_to);
        }
        if (filters?.payment_method) {
          query = query.eq("payment_method", filters.payment_method);
        }

        const { data: transactions, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        if (!transactions || transactions.length === 0) {
          return [];
        }

        // Manually fetch related data (with error handling for missing tables)
        const [
          propertiesResult,
          unitsResult,
          tenantsResult,
          vendorsResult,
          categoriesResult,
          attachmentsResult
        ] = await Promise.allSettled([
          supabase.from("properties").select("id, name, address"),
          supabase.from("units").select("id, name"),
          supabase.from("tenants").select("id, first_name, last_name, email, is_company, company_name"),
          supabase.from("vendors").select("id, name, email, phone"),
          supabase.from("transaction_categories").select("id, name, type, parent_id"),
          supabase.from("transaction_attachments").select("id, transaction_id, name, file_url, file_type, file_size, created_at")
        ]);

        // Extract data safely
        const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data : [];
        const units = unitsResult.status === 'fulfilled' ? unitsResult.value.data : [];
        const tenants = tenantsResult.status === 'fulfilled' ? tenantsResult.value.data : [];
        const vendors = vendorsResult.status === 'fulfilled' ? vendorsResult.value.data : [];
        const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : [];
        const attachments = attachmentsResult.status === 'fulfilled' ? attachmentsResult.value.data : [];

        // Map transactions with related data
        return transactions.map((transaction) => ({
          ...transaction,
          property: properties?.find(p => p.id === transaction.property_id) || null,
          unit: units?.find(u => u.id === transaction.unit_id) || null,
          tenant: tenants?.find(t => t.id === transaction.tenant_id) || null,
          vendor: vendors?.find(v => v.id === transaction.vendor_id) || null,
          category: categories?.find(c => c.id === transaction.category_id) || null,
          attachments: attachments?.filter(a => a.transaction_id === transaction.id) || [],
        }));
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
    },
  });
}

// Fetch transactions for a specific maintenance request
export function useMaintenanceTransactions(maintenanceRequestId: string) {
  return useQuery({
    queryKey: ["maintenance-transactions", maintenanceRequestId],
    queryFn: async (): Promise<TransactionWithRelations[]> => {
      try {
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("maintenance_request_id", maintenanceRequestId)
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        if (!transactions || transactions.length === 0) {
          return [];
        }

        // Manually fetch related data (with error handling for missing tables)
        const [
          propertiesResult,
          unitsResult,
          tenantsResult,
          vendorsResult,
          categoriesResult,
          attachmentsResult
        ] = await Promise.allSettled([
          supabase.from("properties").select("id, name, address"),
          supabase.from("units").select("id, name"),
          supabase.from("tenants").select("id, first_name, last_name, email, is_company, company_name"),
          supabase.from("vendors").select("id, name, email, phone"),
          supabase.from("transaction_categories").select("id, name, type, parent_id"),
          supabase.from("transaction_attachments").select("id, transaction_id, name, file_url, file_type, file_size, created_at")
        ]);

        // Extract data safely
        const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data : [];
        const units = unitsResult.status === 'fulfilled' ? unitsResult.value.data : [];
        const tenants = tenantsResult.status === 'fulfilled' ? tenantsResult.value.data : [];
        const vendors = vendorsResult.status === 'fulfilled' ? vendorsResult.value.data : [];
        const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : [];
        const attachments = attachmentsResult.status === 'fulfilled' ? attachmentsResult.value.data : [];

        // Map transactions with related data
        return transactions.map((transaction) => ({
          ...transaction,
          property: properties?.find(p => p.id === transaction.property_id) || null,
          unit: units?.find(u => u.id === transaction.unit_id) || null,
          tenant: tenants?.find(t => t.id === transaction.tenant_id) || null,
          vendor: vendors?.find(v => v.id === transaction.vendor_id) || null,
          category: categories?.find(c => c.id === transaction.category_id) || null,
          attachments: attachments?.filter(a => a.transaction_id === transaction.id) || [],
        }));
      } catch (error) {
        console.error("Error fetching maintenance transactions:", error);
        return [];
      }
    },
    enabled: !!maintenanceRequestId,
  });
}

// Fetch single transaction
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: async (): Promise<TransactionWithRelations | null> => {
      try {
        const { data: transaction, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (!transaction) {
          return null;
        }

        // Manually fetch related data (with error handling for missing tables)
        const [
          propertiesResult,
          unitsResult,
          tenantsResult,
          vendorsResult,
          categoriesResult,
          attachmentsResult
        ] = await Promise.allSettled([
          supabase.from("properties").select("id, name, address"),
          supabase.from("units").select("id, name"),
          supabase.from("tenants").select("id, first_name, last_name, email, is_company, company_name"),
          supabase.from("vendors").select("id, name, email, phone"),
          supabase.from("transaction_categories").select("id, name, type, parent_id"),
          supabase.from("transaction_attachments").select("id, transaction_id, name, file_url, file_type, file_size, created_at").eq("transaction_id", id)
        ]);

        // Extract data safely
        const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data : [];
        const units = unitsResult.status === 'fulfilled' ? unitsResult.value.data : [];
        const tenants = tenantsResult.status === 'fulfilled' ? tenantsResult.value.data : [];
        const vendors = vendorsResult.status === 'fulfilled' ? vendorsResult.value.data : [];
        const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : [];
        const attachments = attachmentsResult.status === 'fulfilled' ? attachmentsResult.value.data : [];

        return {
          ...transaction,
          property: properties?.find(p => p.id === transaction.property_id) || null,
          unit: units?.find(u => u.id === transaction.unit_id) || null,
          tenant: tenants?.find(t => t.id === transaction.tenant_id) || null,
          vendor: vendors?.find(v => v.id === transaction.vendor_id) || null,
          category: categories?.find(c => c.id === transaction.category_id) || null,
          attachments: attachments || [],
        };
      } catch (error) {
        console.error("Error fetching transaction:", error);
        return null;
      }
    },
    enabled: !!id,
  });
}

// Fetch financial summary
export function useFinancialSummary(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["financial-summary", filters],
    queryFn: async (): Promise<FinancialSummary> => {
      try {
        let query = supabase.from("transactions").select("amount, type, status");

        // Apply same filters as transactions
        if (filters?.type) {
          query = query.eq("type", filters.type);
        }
        if (filters?.property_id) {
          query = query.eq("property_id", filters.property_id);
        }
        if (filters?.date_from) {
          query = query.gte("due_date", filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte("due_date", filters.date_to);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        const summary = data?.reduce(
          (acc, transaction) => {
            const amount = Number(transaction.amount);

            if (transaction.status === 'paid') {
              acc.paid += amount;
            } else if (transaction.status === 'overdue') {
              acc.overdue += amount;
            } else {
              acc.outstanding += amount;
            }

            if (transaction.type === 'income') {
              acc.total_income += amount;
            } else {
              acc.total_expenses += amount;
            }

            return acc;
          },
          {
            outstanding: 0,
            paid: 0,
            overdue: 0,
            total_income: 0,
            total_expenses: 0,
            net_income: 0,
          }
        ) || {
          outstanding: 0,
          paid: 0,
          overdue: 0,
          total_income: 0,
          total_expenses: 0,
          net_income: 0,
        };

        summary.net_income = summary.total_income - summary.total_expenses;

        return summary;
      } catch (error) {
        console.error("Error fetching financial summary:", error);
        throw error;
      }
    },
  });
}

// Create transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Clean up empty string values
      const cleanValues = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => value !== "")
      );

      const transactionData = {
        ...cleanValues,
        status: values.paid_date ? 'paid' : 'pending',
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      // Also invalidate maintenance transactions if this transaction is linked to a maintenance request
      if (data.maintenance_request_id) {
        queryClient.invalidateQueries({ queryKey: ["maintenance-transactions", data.maintenance_request_id] });
      }
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<TransactionFormValues> }) => {
      // Clean up empty string values
      const cleanValues = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => value !== "")
      );

      const { data, error } = await supabase
        .from("transactions")
        .update(cleanValues)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Fetch transaction categories
export function useTransactionCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ["transaction-categories", type],
    queryFn: async (): Promise<TransactionCategory[]> => {
      try {
        let query = supabase
          .from("transaction_categories")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        return data || [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    },
  });
}

// Fetch vendors
export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<Vendor[]> => {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (error) {
          throw new Error(error.message);
        }

        return data || [];
      } catch (error) {
        console.error("Error fetching vendors:", error);
        throw error;
      }
    },
  });
}

// Create vendor
export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorFormValues) => {
      const { data, error } = await supabase
        .from("vendors")
        .insert([values])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create vendor: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .insert([values])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}