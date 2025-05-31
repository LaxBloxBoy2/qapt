"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaintenanceRequests, useMaintenanceSummary } from "@/hooks/useMaintenance";
import { useGetProperties } from "@/hooks/useProperties";
import { MaintenanceFilters } from "@/types/maintenance";
import { MaintenanceSummaryCards } from "@/components/maintenance/MaintenanceSummaryCards";
import { MaintenanceTable } from "@/components/maintenance/MaintenanceTable";
import { AddRequestDialog } from "@/components/maintenance/AddRequestDialog";

export default function Maintenance() {
  const [filters, setFilters] = useState<MaintenanceFilters>({});
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Data hooks
  const { data: requests, isLoading: requestsLoading } = useMaintenanceRequests(filters);
  const { data: summary, isLoading: summaryLoading } = useMaintenanceSummary();
  const { data: properties } = useGetProperties();

  // Handle filter changes
  const handleFilterChange = (key: keyof MaintenanceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-muted-foreground">
            Track and manage maintenance requests across all properties
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <i className="ri-add-line mr-2"></i>
          Add Request
        </Button>
      </div>

      {/* Summary Cards */}
      <MaintenanceSummaryCards
        summary={summary}
        isLoading={summaryLoading}
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search requests..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full"
          />
        </div>

        <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority || "all"} onValueChange={(value) => handleFilterChange("priority", value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.property_id || "all"} onValueChange={(value) => handleFilterChange("property_id", value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties?.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <MaintenanceTable
        requests={requests || []}
        isLoading={requestsLoading}
        onRefresh={() => {
          // Refresh data
        }}
      />

      {/* Add Request Dialog */}
      <AddRequestDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
