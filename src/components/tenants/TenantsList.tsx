"use client";

import { useState, useMemo } from "react";
import { useTenants } from "@/hooks/useTenants";
import { useGetProperties } from "@/hooks/useProperties";
import { TenantWithUnit } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TenantCard } from "./TenantCard";
import { TenantForm } from "./TenantForm";

export function TenantsList() {
  const { data: tenants, isLoading } = useTenants();
  const { data: properties } = useGetProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filter tenants based on search query and property filter
  const filteredTenants = useMemo(() => {
    if (!tenants) return [];

    return tenants.filter((tenant) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = tenant.is_company
        ? tenant.company_name?.toLowerCase().includes(searchLower)
        : `${tenant.first_name} ${tenant.middle_name || ""} ${tenant.last_name}`
            .toLowerCase()
            .includes(searchLower);
      const emailMatch = tenant.email.toLowerCase().includes(searchLower);
      const searchMatches = !searchQuery || nameMatch || emailMatch;

      // Property filter
      const propertyMatches =
        propertyFilter === "all" ||
        (tenant.units?.properties?.id === propertyFilter);

      return searchMatches && propertyMatches;
    });
  }, [tenants, searchQuery, propertyFilter]);

  // Get unique properties from tenants for filter dropdown
  const uniqueProperties = useMemo(() => {
    if (!properties) return [];
    return properties;
  }, [properties]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your tenant relationships
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <i className="ri-user-add-line mr-2"></i>
          Add Tenant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2"></i>
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {uniqueProperties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading tenants...</p>
        </div>
      ) : filteredTenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant: TenantWithUnit) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
            <i className="ri-user-line text-3xl text-muted-foreground"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium">No tenants found</h3>
          <p className="mt-1 text-muted-foreground">
            {searchQuery || propertyFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by adding your first tenant"}
          </p>
          {!searchQuery && propertyFilter === "all" && (
            <Button
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              <i className="ri-user-add-line mr-2"></i>
              Add Tenant
            </Button>
          )}
        </div>
      )}

      {/* Add Tenant Dialog */}
      <TenantForm
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
