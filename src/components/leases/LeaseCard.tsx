"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { LeaseWithRelations } from "@/types/lease";
import { useDeleteLease } from "@/hooks/useLeases";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { LeaseForm } from "./LeaseForm";
import { useCurrencyFormatter } from "@/lib/currency";

interface LeaseCardProps {
  lease: LeaseWithRelations;
}

export function LeaseCard({ lease }: LeaseCardProps) {
  const router = useRouter();
  const deleteLease = useDeleteLease();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();

  // Format dates
  const startDate = format(parseISO(lease.start_date), "MMM d, yyyy");
  const endDate = format(parseISO(lease.end_date), "MMM d, yyyy");

  // Calculate status if missing
  const getLeaseStatus = () => {
    // Check if it's a draft first
    if (lease.is_draft) {
      return 'draft';
    }

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

  const currentStatus = getLeaseStatus();

  // Helper function to get deposit amount regardless of column name
  const getDepositAmount = (lease: any) => {
    if (lease.deposit_amount !== undefined && lease.deposit_amount !== null) {
      return formatCurrency(lease.deposit_amount);
    } else if (lease.security_deposit !== undefined && lease.security_deposit !== null) {
      return formatCurrency(lease.security_deposit);
    } else if (lease.deposit !== undefined && lease.deposit !== null) {
      return formatCurrency(lease.deposit);
    } else {
      return "None";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }

    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get primary tenant name
  const getPrimaryTenantName = () => {
    const primaryTenant = lease.primary_tenant || lease.tenants?.[0];

    if (!primaryTenant) {
      return lease.is_draft ? "Draft - No tenant assigned" : "No tenant";
    }

    return primaryTenant.is_company && primaryTenant.company_name
      ? primaryTenant.company_name
      : `${primaryTenant.first_name} ${primaryTenant.last_name}`;
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      await deleteLease.mutateAsync(lease.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting lease:", error);
    }
  };

  // Navigate to lease detail page
  const handleViewDetails = () => {
    if (!lease.id) {
      console.error("Missing lease ID");
      return;
    }

    router.push(`/leases/${lease.id}`);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 dark:bg-white rounded-full"></div>
              <CardTitle className="text-base font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                {lease.unit?.name || "Unknown Unit"}
              </CardTitle>
              {lease.is_draft && (
                <i className="ri-draft-line text-orange-500 text-sm" title="Draft lease"></i>
              )}
            </div>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400 ml-4">
              {lease.unit?.properties?.name || "Unknown Property"}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(currentStatus)} text-xs font-medium`}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-4 space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tenant</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{getPrimaryTenantName()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Term</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{startDate} — {endDate}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monthly Rent</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(lease.rent_amount)}</span>
          </div>

          {getDepositAmount(lease) !== "None" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Deposit</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{getDepositAmount(lease)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <i className="ri-eye-line mr-1.5 text-sm"></i>
            View Details
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 h-8 w-8 p-0"
            >
              <i className="ri-edit-line text-sm"></i>
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 h-8 w-8 p-0"
                >
                  <i className="ri-delete-bin-line text-sm"></i>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lease Agreement</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the lease for {lease.unit?.name} and remove all associated records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                    Delete Lease
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardFooter>

      {/* Edit Lease Dialog */}
      <LeaseForm
        lease={lease}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </Card>
  );
}
