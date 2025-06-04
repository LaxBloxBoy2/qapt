"use client";

import { useState, useMemo } from "react";
import { useLeases } from "@/hooks/useLeases";
import { useGetUnits } from "@/hooks/useUnits";
import { useTenants } from "@/hooks/useTenants";
import { LeaseStatus, LeaseWithRelations, leaseStatuses } from "@/types/lease";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeaseCard } from "./LeaseCard";
import { LeaseForm } from "./LeaseForm";
import { format, parseISO } from "date-fns";

export function LeasesList() {
  const { data: leases, isLoading, isError } = useLeases();
  const { data: units } = useGetUnits();
  const { data: tenants } = useTenants();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // For debugging
  console.log("LeasesList render - leases:", leases, "isLoading:", isLoading, "isError:", isError);

  // Log lease IDs for debugging
  if (leases && leases.length > 0) {
    console.log("Available lease IDs:", leases.map(lease => ({ id: lease.id, unit: lease.unit?.name })));
  }

  // Filter leases based on search query and filters
  const filteredLeases = useMemo(() => {
    if (!leases) return [];

    return leases.filter((lease) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const unitName = lease.unit?.name?.toLowerCase() || "";
      const propertyName = lease.unit?.properties?.name?.toLowerCase() || "";
      const tenantNames = lease.tenants?.map(t =>
        t.is_company && t.company_name
          ? t.company_name.toLowerCase()
          : `${t.first_name} ${t.last_name}`.toLowerCase()
      ).join(" ") || "";

      const searchMatches = !searchQuery ||
        unitName.includes(searchLower) ||
        propertyName.includes(searchLower) ||
        tenantNames.includes(searchLower) ||
        lease.rent_amount.toString().includes(searchLower);

      // Status filter
      const statusMatches = statusFilter === "all" ||
        (lease.status ? lease.status === statusFilter : false);

      // Unit filter
      const unitMatches = unitFilter === "all" || lease.unit_id === unitFilter;

      // Tenant filter
      const tenantMatches = tenantFilter === "all" ||
        lease.tenants?.some(tenant => tenant.id === tenantFilter);

      return searchMatches && statusMatches && unitMatches && tenantMatches;
    });
  }, [leases, searchQuery, statusFilter, unitFilter, tenantFilter]);

  return (
    <div className="space-y-6">
      {/* Clean Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Centered Stats */}
        <div className="flex-1 flex justify-center">
          {leases && leases.length > 0 && (
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{leases.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Leases</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {leases.filter(l => l.status === 'active').length}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {leases.filter(l => l.status === 'upcoming').length}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {leases.filter(l => l.status === 'expired').length}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">Expired</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center lg:justify-end">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <i className="ri-add-line mr-2"></i>
            New Lease
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
            <Input
              placeholder="Search leases, tenants, units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {leaseStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'active' ? 'bg-green-500' :
                        status === 'upcoming' ? 'bg-blue-500' :
                        status === 'expired' ? 'bg-orange-500' : 'bg-gray-400'
                      }`}></div>
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} • {unit.properties?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white">
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.is_company && tenant.company_name
                      ? tenant.company_name
                      : `${tenant.first_name} ${tenant.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Leases Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading leases...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="inline-block rounded-full p-3 bg-red-100 dark:bg-red-900">
            <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-300"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium">Error loading leases</h3>
          <p className="mt-1 text-muted-foreground">
            There was a problem loading your leases. Please try again later.
          </p>
          <Button
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh Page
          </Button>
        </div>
      ) : filteredLeases && filteredLeases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeases.map((lease: LeaseWithRelations) => (
            <LeaseCard key={lease.id} lease={lease} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
            <i className="ri-file-list-3-line text-3xl text-muted-foreground"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium">No leases found</h3>
          <p className="mt-1 text-muted-foreground">
            {searchQuery || statusFilter !== "all" || unitFilter !== "all" || tenantFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by adding your first lease"}
          </p>
          {!searchQuery && statusFilter === "all" && unitFilter === "all" && tenantFilter === "all" && (
            <Button
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              <i className="ri-add-line mr-2"></i>
              Add Lease
            </Button>
          )}
        </div>
      )}

      {/* Add Lease Dialog */}
      <LeaseForm
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
