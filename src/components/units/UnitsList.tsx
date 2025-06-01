"use client";

import { Button } from "@/components/ui/button";
import { useGetUnitsGroupedByProperty } from "@/hooks/useUnits";
import { UnitCard } from "./UnitCard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnitForm } from "./UnitForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { unitStatuses, unitTypes } from "@/types/unit";

export function UnitsList() {
  const { groupedUnits, isLoading, isError, error } = useGetUnitsGroupedByProperty();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  // Apply filters
  const filteredGroups = groupedUnits
    .filter(group => {
      // Filter by property
      if (propertyFilter !== "all" && group.property.id !== propertyFilter) {
        return false;
      }
      
      // Filter units within each group
      const filteredUnits = group.units.filter(unit => {
        // Search term filter
        const matchesSearch = searchTerm === "" || 
          unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Status filter
        const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
        
        // Type filter
        const matchesType = typeFilter === "all" || unit.unit_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
      });
      
      // Only include groups that have units after filtering
      return filteredUnits.length > 0;
    })
    .map(group => ({
      ...group,
      units: group.units.filter(unit => {
        // Apply the same filters to units
        const matchesSearch = searchTerm === "" || 
          unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
        const matchesType = typeFilter === "all" || unit.unit_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
      })
    }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Error loading units</h3>
        <p>{error?.message || 'An unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Units</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <i className="ri-add-line mr-1" />
          Add Unit
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Input
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {unitStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {unitTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {groupedUnits.map((group) => (
                <SelectItem key={group.property.id} value={group.property.id}>
                  {group.property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <div key={group.property.id} className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">
                    <div className="flex items-center">
                      <span>{group.property.name}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({group.units.length} {group.units.length === 1 ? "unit" : "units"})
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.units.map((unit) => (
                      <UnitCard key={unit.id} unit={unit} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No units found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all" || propertyFilter !== "all"
              ? "No units match your filters. Try adjusting your search criteria."
              : "You haven't added any units yet. Click the button below to add your first unit."}
          </p>
          {searchTerm || statusFilter !== "all" || typeFilter !== "all" || propertyFilter !== "all" ? (
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setTypeFilter("all");
              setPropertyFilter("all");
            }}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <i className="ri-add-line mr-1" />
              Add Your First Unit
            </Button>
          )}
        </div>
      )}

      {/* Add Unit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
          </DialogHeader>
          <UnitForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
