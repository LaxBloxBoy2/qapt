"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormatter } from "@/lib/currency";

interface UnitLeasesProps {
  unitId: string;
}

interface LeaseData {
  id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount?: number;
  status?: string;
  tenants: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_company: boolean;
    company_name?: string;
  }>;
}

export function UnitLeases({ unitId }: UnitLeasesProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrencyFormatter();

  const { data: leases, isLoading, error: queryError } = useQuery({
    queryKey: ["unit-leases", unitId],
    queryFn: async (): Promise<LeaseData[]> => {
      console.log("Fetching leases for unit:", unitId);

      // First, let's try a simple query to see if there are any leases for this unit
      const { data: simpleLeases, error: simpleError } = await supabase
        .from("leases")
        .select("*")
        .eq("unit_id", unitId);

      console.log("Simple leases query result:", simpleLeases, "Error:", simpleError);

      if (simpleError) {
        console.error("Simple query failed:", simpleError);
        throw new Error(simpleError.message);
      }

      if (!simpleLeases || simpleLeases.length === 0) {
        console.log("No leases found for unit:", unitId);
        return [];
      }

      // Now try the complex query with relationships
      const { data, error } = await supabase
        .from("leases")
        .select(`
          id,
          start_date,
          end_date,
          rent_amount,
          status,
          lease_tenants!lease_id (
            tenant_id,
            is_primary,
            tenants:tenant_id (
              id,
              first_name,
              last_name,
              email,
              is_company,
              company_name
            )
          )
        `)
        .eq("unit_id", unitId)
        .order("start_date", { ascending: false });

      console.log("Complex leases query result:", data, "Error:", error);

      if (error) {
        console.error("Complex query failed, falling back to simple data:", error);
        // Fallback to simple data without tenant relationships
        return simpleLeases.map((lease: any) => ({
          ...lease,
          tenants: [] // Empty tenants array as fallback
        }));
      }

      // Transform the data to include tenants array
      return (data || []).map((lease: any) => ({
        ...lease,
        tenants: (lease.lease_tenants || [])
          .map((lt: any) => lt.tenants)
          .filter(Boolean)
      }));
    },
  });

  // Calculate status if missing
  const getLeaseStatus = (lease: LeaseData) => {
    if (lease.status && lease.status !== 'unknown') {
      return lease.status;
    }

    const today = new Date();
    const start = parseISO(lease.start_date);
    const end = parseISO(lease.end_date);

    if (start > today) return 'upcoming';
    if (end < today) return 'expired';
    return 'active';
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get tenant names
  const getTenantNames = (tenants: LeaseData['tenants']) => {
    if (!tenants || tenants.length === 0) return "No tenants";

    return tenants.map(tenant => {
      if (tenant.is_company && tenant.company_name) {
        return tenant.company_name;
      }
      return `${tenant.first_name} ${tenant.last_name}`;
    }).join(", ");
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading leases...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Leases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
            <p className="text-red-600 mb-2">Failed to load leases</p>
            <p className="text-sm text-muted-foreground">{queryError.message}</p>
            <p className="text-xs text-muted-foreground mt-2">Check console for details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leases || leases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leases</CardTitle>
          <CardDescription>
            Lease history for this unit.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <div className="text-center">
            <i className="ri-file-list-line text-4xl text-muted-foreground"></i>
            <p className="mt-2 text-muted-foreground">No leases found</p>
            <p className="text-sm text-muted-foreground">This unit has no lease history.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate active and past leases
  const activeLeases = leases.filter(lease => getLeaseStatus(lease) === 'active');
  const pastLeases = leases.filter(lease => getLeaseStatus(lease) !== 'active');

  return (
    <div className="space-y-6">
      {/* Current Lease */}
      {activeLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Lease</CardTitle>
            <CardDescription>
              Active lease for this unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeLeases.map((lease) => {
              const status = getLeaseStatus(lease);
              const startDate = format(parseISO(lease.start_date), "MMM d, yyyy");
              const endDate = format(parseISO(lease.end_date), "MMM d, yyyy");

              return (
                <div
                  key={lease.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{getTenantNames(lease.tenants)}</h4>
                      <Badge className={getStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{startDate} → {endDate}</span>
                      <span>{formatCurrency(lease.rent_amount)}/month</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/leases/${lease.id}`)}
                  >
                    <i className="ri-eye-line mr-1"></i>
                    View Lease
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Lease History */}
      {pastLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lease History ({pastLeases.length})</CardTitle>
            <CardDescription>
              Past leases for this unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastLeases.map((lease) => {
                const status = getLeaseStatus(lease);
                const startDate = format(parseISO(lease.start_date), "MMM d, yyyy");
                const endDate = format(parseISO(lease.end_date), "MMM d, yyyy");

                return (
                  <div
                    key={lease.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-sm">{getTenantNames(lease.tenants)}</h4>
                        <Badge className={getStatusColor(status)} variant="outline">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{startDate} → {endDate}</span>
                        <span>{formatCurrency(lease.rent_amount)}/month</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/leases/${lease.id}`)}
                    >
                      <i className="ri-eye-line mr-1"></i>
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
