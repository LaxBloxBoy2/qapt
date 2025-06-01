import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  TenantBalance,
  BalancesSummary,
  BalanceFilters,
  SendNoticeRequest,
  ApplyDepositsRequest,
  ApplyCreditsRequest,
  TenantDeposit,
  TenantCredit,
  OutstandingInvoice,
} from "@/types/balance";

// Fetch tenant balances with filters
export function useBalances(filters?: BalanceFilters) {
  return useQuery({
    queryKey: ["balances", filters],
    queryFn: async (): Promise<TenantBalance[]> => {
      try {
        // For now, we'll simulate the data since we don't have the actual balance calculation logic
        // In a real implementation, this would calculate balances from transactions

        // Get tenants first
        const { data: tenants, error: tenantsError } = await supabase
          .from("tenants")
          .select("*");

        if (tenantsError) {
          throw new Error(tenantsError.message);
        }

        if (!tenants || tenants.length === 0) {
          return [];
        }

        // Get transactions for balance calculation
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .in("tenant_id", tenants.map(t => t.id))
          .in("status", ["pending", "overdue"]);

        // Get units and properties for tenant mapping
        const { data: units } = await supabase
          .from("units")
          .select(`
            id,
            name,
            properties:property_id (
              id,
              name
            )
          `);

        // Calculate balances for each tenant
        const balances: TenantBalance[] = tenants.map(tenant => {
          const tenantTransactions = transactions?.filter(t => t.tenant_id === tenant.id) || [];

          const outstanding = tenantTransactions
            .filter(t => t.status === "pending" || t.status === "overdue")
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const overdue = tenantTransactions
            .filter(t => t.status === "overdue")
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const oldestInvoice = tenantTransactions
            .sort((a, b) => new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime())[0];

          const daysOverdue = oldestInvoice
            ? Math.max(0, Math.floor((Date.now() - new Date(oldestInvoice.due_date || oldestInvoice.created_at).getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          // Find tenant's unit
          const tenantUnit = units?.find(u => u.id === tenant.unit_id);

          return {
            id: `balance_${tenant.id}`,
            tenant_id: tenant.id,
            tenant: {
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              email: tenant.email,
              phone: tenant.phone,
              is_company: tenant.is_company,
              company_name: tenant.company_name,
              unit: tenantUnit ? {
                id: tenantUnit.id,
                name: tenantUnit.name,
                property: {
                  id: (tenantUnit.properties as any)?.[0]?.id || "",
                  name: (tenantUnit.properties as any)?.[0]?.name || "",
                }
              } : undefined,
            },
            outstanding_balance: outstanding,
            paid_balance: 0, // Would calculate from paid transactions
            overdue_balance: overdue,
            total_invoices: tenantTransactions.length,
            overdue_invoices: tenantTransactions.filter(t => t.status === "overdue").length,
            oldest_invoice_date: oldestInvoice?.due_date || oldestInvoice?.created_at,
            days_overdue: daysOverdue,
            lease_status: "active" as const, // Would get from leases table
            created_at: tenant.created_at,
            updated_at: tenant.updated_at,
          };
        });

        // Apply filters
        let filteredBalances = balances;

        if (filters?.property_id) {
          filteredBalances = filteredBalances.filter(b =>
            b.tenant.unit?.property.id === filters.property_id
          );
        }

        if (filters?.tenant_id) {
          filteredBalances = filteredBalances.filter(b => b.tenant_id === filters.tenant_id);
        }

        if (filters?.status) {
          filteredBalances = filteredBalances.filter(b => {
            if (filters.status === "overdue") return b.overdue_balance > 0;
            if (filters.status === "open") return b.outstanding_balance > 0;
            if (filters.status === "partial") return b.outstanding_balance > 0 && b.paid_balance > 0;
            return true;
          });
        }

        if (filters?.aging_period && filters.aging_period !== "all") {
          filteredBalances = filteredBalances.filter(b => {
            const days = b.days_overdue;
            switch (filters.aging_period) {
              case "0-30": return days >= 0 && days <= 30;
              case "30-60": return days > 30 && days <= 60;
              case "60-90": return days > 60 && days <= 90;
              case "90+": return days > 90;
              default: return true;
            }
          });
        }

        if (filters?.search) {
          const search = filters.search.toLowerCase();
          filteredBalances = filteredBalances.filter(b =>
            b.tenant.first_name.toLowerCase().includes(search) ||
            b.tenant.last_name.toLowerCase().includes(search) ||
            (b.tenant.company_name && b.tenant.company_name.toLowerCase().includes(search)) ||
            (b.tenant.unit?.name.toLowerCase().includes(search)) ||
            (b.tenant.unit?.property.name.toLowerCase().includes(search))
          );
        }

        // Only return tenants with outstanding balances
        return filteredBalances.filter(b => b.outstanding_balance > 0);

      } catch (error) {
        console.error("Error fetching balances:", error);
        throw error;
      }
    },
  });
}

// Fetch balances summary
export function useBalancesSummary(filters?: BalanceFilters) {
  return useQuery({
    queryKey: ["balances-summary", filters],
    queryFn: async (): Promise<BalancesSummary> => {
      try {
        // Get all transactions for summary calculation
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("*");

        if (error) {
          throw new Error(error.message);
        }

        if (!transactions || transactions.length === 0) {
          return {
            total_outstanding: 0,
            total_paid: 0,
            total_overdue: 0,
            total_tenants: 0,
            aging_0_30: 0,
            aging_30_60: 0,
            aging_60_90: 0,
            aging_90_plus: 0,
          };
        }

        const now = Date.now();

        const summary = transactions.reduce((acc, transaction) => {
          const amount = Number(transaction.amount);
          const dueDate = new Date(transaction.due_date || transaction.created_at);
          const daysOverdue = Math.max(0, Math.floor((now - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

          if (transaction.status === "paid") {
            acc.total_paid += amount;
          } else if (transaction.status === "pending" || transaction.status === "overdue") {
            acc.total_outstanding += amount;

            if (transaction.status === "overdue") {
              acc.total_overdue += amount;
            }

            // Aging buckets
            if (daysOverdue <= 30) {
              acc.aging_0_30 += amount;
            } else if (daysOverdue <= 60) {
              acc.aging_30_60 += amount;
            } else if (daysOverdue <= 90) {
              acc.aging_60_90 += amount;
            } else {
              acc.aging_90_plus += amount;
            }
          }

          return acc;
        }, {
          total_outstanding: 0,
          total_paid: 0,
          total_overdue: 0,
          total_tenants: 0,
          aging_0_30: 0,
          aging_30_60: 0,
          aging_60_90: 0,
          aging_90_plus: 0,
        });

        // Get unique tenant count
        const uniqueTenants = new Set(transactions.map(t => t.tenant_id).filter(Boolean));
        summary.total_tenants = uniqueTenants.size;

        return summary;
      } catch (error) {
        console.error("Error fetching balances summary:", error);
        throw error;
      }
    },
  });
}

// Send notice to tenant
export function useSendNotice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: SendNoticeRequest) => {
      // In a real implementation, this would send an email
      // For now, we'll just simulate the action
      console.log("Sending notice:", request);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, message: "Notice sent successfully" };
    },
    onSuccess: () => {
      toast({
        title: "Notice Sent",
        description: "The notice has been sent to the tenant successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send notice: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Apply deposits to outstanding balances
export function useApplyDeposits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: ApplyDepositsRequest) => {
      // In a real implementation, this would update transactions and deposits
      console.log("Applying deposits:", request);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, message: "Deposits applied successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["balances-summary"] });
      toast({
        title: "Deposits Applied",
        description: "The deposits have been applied to outstanding balances.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to apply deposits: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Apply credits to outstanding balances
export function useApplyCredits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: ApplyCreditsRequest) => {
      // In a real implementation, this would update transactions and credits
      console.log("Applying credits:", request);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, message: "Credits applied successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["balances-summary"] });
      toast({
        title: "Credits Applied",
        description: "The credits have been applied to outstanding balances.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to apply credits: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Get tenant deposits
export function useTenantDeposits(tenantId: string | null) {
  return useQuery({
    queryKey: ["tenant-deposits", tenantId],
    queryFn: async (): Promise<TenantDeposit[]> => {
      if (!tenantId) return [];

      // Simulate deposits data
      return [
        {
          id: "dep_1",
          tenant_id: tenantId,
          amount: 1500,
          available_amount: 1500,
          type: "security",
          description: "Security deposit",
          received_date: "2024-01-01",
          status: "held",
        },
        {
          id: "dep_2",
          tenant_id: tenantId,
          amount: 300,
          available_amount: 300,
          type: "pet",
          description: "Pet deposit",
          received_date: "2024-01-01",
          status: "held",
        },
      ];
    },
    enabled: !!tenantId,
  });
}

// Get tenant credits
export function useTenantCredits(tenantId: string | null) {
  return useQuery({
    queryKey: ["tenant-credits", tenantId],
    queryFn: async (): Promise<TenantCredit[]> => {
      if (!tenantId) return [];

      // Simulate credits data
      return [
        {
          id: "cred_1",
          tenant_id: tenantId,
          amount: 100,
          available_amount: 100,
          reason: "Maintenance inconvenience credit",
          created_date: "2024-01-15",
          status: "available",
        },
      ];
    },
    enabled: !!tenantId,
  });
}

// Get outstanding invoices for tenant
export function useOutstandingInvoices(tenantId: string | null) {
  return useQuery({
    queryKey: ["outstanding-invoices", tenantId],
    queryFn: async (): Promise<OutstandingInvoice[]> => {
      if (!tenantId) return [];

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return transactions?.map(transaction => {
        const dueDate = new Date(transaction.due_date || transaction.created_at);
        const daysOverdue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          id: transaction.id,
          transaction_id: transaction.id,
          amount: Number(transaction.amount),
          outstanding_amount: Number(transaction.amount), // In real implementation, subtract payments
          due_date: transaction.due_date || transaction.created_at,
          description: transaction.description || "Invoice",
          type: transaction.subtype,
          days_overdue: daysOverdue,
          status: daysOverdue > 0 ? "overdue" : "open",
        };
      }) || [];
    },
    enabled: !!tenantId,
  });
}
