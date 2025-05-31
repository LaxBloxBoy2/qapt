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

interface TenantLeasesProps {
  tenantId: string;
}

interface LeaseData {
  id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount?: number;
  status?: string;
  unit: {
    id: string;
    name: string;
    properties: {
      id: string;
      name: string;
      address?: string;
    };
  };
}

export function TenantLeases({ tenantId }: TenantLeasesProps) {
  const router = useRouter();

  const { data: leases, isLoading, error: queryError } = useQuery({
    queryKey: ["tenant-leases", tenantId],
    queryFn: async (): Promise<LeaseData[]> => {
      if (!tenantId) {
        return [];
      }

      try {
        // Step 1: Get lease_tenants records for this tenant
        const { data: leaseTenants, error: ltError } = await supabase
          .from("lease_tenants")
          .select("*")
          .eq("tenant_id", tenantId);

        if (ltError) {
          throw new Error(`lease_tenants query failed: ${ltError.message}`);
        }

        if (!leaseTenants || leaseTenants.length === 0) {
          return [];
        }

        // Step 2: Get the lease IDs
        const leaseIds = leaseTenants.map(lt => lt.lease_id);

        // Step 3: Fetch leases directly with their relationships
        const { data: leaseData, error: leaseError } = await supabase
          .from("leases")
          .select(`
            id,
            start_date,
            end_date,
            rent_amount,
            status,
            unit_id,
            units:unit_id (
              id,
              name,
              property_id,
              properties:property_id (
                id,
                name,
                address
              )
            )
          `)
          .in("id", leaseIds);

        if (leaseError) {
          throw new Error(`Lease details query failed: ${leaseError.message}`);
        }

        // Step 4: Transform the data
        const transformedLeases = (leaseData || []).map((lease: any) => ({
          ...lease,
          unit: lease.units, // Rename units to unit for consistency
        }));

        return transformedLeases;

      } catch (error) {
        console.error("TenantLeases query error:", error);
        throw error;
      }
    },
    enabled: !!tenantId,
  });

  // Calculate status if missing
  const getLeaseStatus = (lease: LeaseData) => {
    if (!lease) return 'unknown';

    if (lease.status && lease.status !== 'unknown') {
      return lease.status;
    }

    if (!lease.start_date || !lease.end_date) {
      return 'unknown';
    }

    try {
      const today = new Date();
      const start = parseISO(lease.start_date);
      const end = parseISO(lease.end_date);

      if (start > today) return 'upcoming';
      if (end < today) return 'expired';
      return 'active';
    } catch (error) {
      console.error("Error parsing lease dates:", error);
      return 'unknown';
    }
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
            Lease history for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <div className="text-center">
            <i className="ri-file-list-line text-4xl text-muted-foreground"></i>
            <p className="mt-2 text-muted-foreground">No leases found</p>
            <p className="text-sm text-muted-foreground">This tenant has no lease history.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leases ({leases.length})</CardTitle>
        <CardDescription>
          Current and past leases for this tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leases.map((lease) => {
            if (!lease) return null;

            const status = getLeaseStatus(lease);
            const startDate = lease.start_date ? format(parseISO(lease.start_date), "MMM d, yyyy") : "Unknown";
            const endDate = lease.end_date ? format(parseISO(lease.end_date), "MMM d, yyyy") : "Unknown";

            return (
              <div
                key={lease.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{lease.unit?.name || "Unknown Unit"}</h4>
                    <Badge className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    {lease.unit?.properties?.name || "Unknown Property"}
                    {lease.unit?.properties?.address && ` • ${lease.unit.properties.address}`}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{startDate} → {endDate}</span>
                    <span>{formatCurrency(lease.rent_amount || 0)}/month</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/leases/${lease.id}`)}
                  >
                    <i className="ri-eye-line mr-1"></i>
                    View
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/units/${lease.unit?.id}`)}
                    disabled={!lease.unit?.id}
                  >
                    <i className="ri-home-line mr-1"></i>
                    Unit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
