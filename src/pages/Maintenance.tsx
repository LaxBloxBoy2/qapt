"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

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

  // Filter requests by status for tabs
  const openRequests = requests?.filter(r => r.status === 'open') || [];
  const inProgressRequests = requests?.filter(r => r.status === 'in_progress') || [];
  const resolvedRequests = requests?.filter(r => r.status === 'resolved') || [];
  const urgentRequests = requests?.filter(r => r.priority === 'urgent') || [];

  return (
    <div className="space-y-6">
      {/* Modern Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <i className="ri-tools-line text-xl text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maintenance Hub</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Streamline maintenance operations across all properties
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8"
            >
              <i className="ri-layout-grid-line mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8"
            >
              <i className="ri-list-check mr-1" />
              Table
            </Button>
          </div>

          <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90">
            <i className="ri-add-line mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <MaintenanceSummaryCards
        summary={summary}
        isLoading={summaryLoading}
      />

      {/* Advanced Filters & Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by title, description, property, or tenant..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority || "all"} onValueChange={(value) => handleFilterChange("priority", value)}>
                <SelectTrigger className="w-[130px] h-10">
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
                <SelectTrigger className="w-[150px] h-10">
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
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <i className="ri-dashboard-line" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="urgent" className="flex items-center gap-2">
            <i className="ri-alarm-warning-line" />
            <span className="hidden sm:inline">Urgent</span>
            {urgentRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {urgentRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <i className="ri-tools-line" />
            <span className="hidden sm:inline">Open</span>
            {openRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {openRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <i className="ri-settings-3-line" />
            <span className="hidden sm:inline">In Progress</span>
            {inProgressRequests.length > 0 && (
              <Badge variant="outline" className="ml-1 h-5 w-5 p-0 text-xs">
                {inProgressRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <i className="ri-check-double-line" />
            <span className="hidden sm:inline">Resolved</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MaintenanceTable
            requests={requests || []}
            isLoading={requestsLoading}
            onRefresh={() => {}}
          />
        </TabsContent>

        <TabsContent value="urgent" className="space-y-6">
          {urgentRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <i className="ri-check-double-line text-2xl text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Urgent Requests</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  Great job! There are no urgent maintenance requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <MaintenanceTable
              requests={urgentRequests}
              isLoading={requestsLoading}
              onRefresh={() => {}}
            />
          )}
        </TabsContent>

        <TabsContent value="open" className="space-y-6">
          <MaintenanceTable
            requests={openRequests}
            isLoading={requestsLoading}
            onRefresh={() => {}}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <MaintenanceTable
            requests={inProgressRequests}
            isLoading={requestsLoading}
            onRefresh={() => {}}
          />
        </TabsContent>

        <TabsContent value="resolved" className="space-y-6">
          <MaintenanceTable
            requests={resolvedRequests}
            isLoading={requestsLoading}
            onRefresh={() => {}}
          />
        </TabsContent>
      </Tabs>

      {/* Add Request Dialog */}
      <AddRequestDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}

// Force server-side rendering to avoid static generation issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
