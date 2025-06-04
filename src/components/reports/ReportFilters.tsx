"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilters) => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  onRunReport: () => void;
  isLoading?: boolean;
  availableProperties?: Array<{ id: string; name: string }>;
  availableCategories?: Array<{ id: string; name: string }>;
  availableAssignees?: Array<{ id: string; name: string }>;
  showPropertyFilter?: boolean;
  showCategoryFilter?: boolean;
  showAssigneeFilter?: boolean;
  showDateRange?: boolean;
  showStatusFilter?: boolean;
}

export interface ReportFilters {
  properties: string[];
  categories: string[];
  assignees: string[];
  dateFrom: string;
  dateTo: string;
  status: string;
  search: string;
}

export function ReportFilters({
  onFilterChange,
  onExport,
  onRunReport,
  isLoading = false,
  availableProperties = [],
  availableCategories = [],
  availableAssignees = [],
  showPropertyFilter = true,
  showCategoryFilter = true,
  showAssigneeFilter = true,
  showDateRange = true,
  showStatusFilter = true,
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    properties: [],
    categories: [],
    assignees: [],
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: '',
  });

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handlePropertyToggle = (propertyId: string) => {
    const newSelected = selectedProperties.includes(propertyId)
      ? selectedProperties.filter(id => id !== propertyId)
      : [...selectedProperties, propertyId];
    
    setSelectedProperties(newSelected);
    updateFilters({ properties: newSelected });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newSelected);
    updateFilters({ categories: newSelected });
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    const newSelected = selectedAssignees.includes(assigneeId)
      ? selectedAssignees.filter(id => id !== assigneeId)
      : [...selectedAssignees, assigneeId];
    
    setSelectedAssignees(newSelected);
    updateFilters({ assignees: newSelected });
  };

  const clearAllFilters = () => {
    const clearedFilters: ReportFilters = {
      properties: [],
      categories: [],
      assignees: [],
      dateFrom: '',
      dateTo: '',
      status: 'all',
      search: '',
    };
    setFilters(clearedFilters);
    setSelectedProperties([]);
    setSelectedCategories([]);
    setSelectedAssignees([]);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.properties.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.assignees.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.status !== 'all') count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-filter-line" />
            Report Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Properties Filter */}
        {showPropertyFilter && availableProperties.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Properties</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-properties"
                  checked={selectedProperties.length === availableProperties.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIds = availableProperties.map(p => p.id);
                      setSelectedProperties(allIds);
                      updateFilters({ properties: allIds });
                    } else {
                      setSelectedProperties([]);
                      updateFilters({ properties: [] });
                    }
                  }}
                />
                <Label htmlFor="all-properties" className="text-sm font-medium">
                  All Properties
                </Label>
              </div>
              {availableProperties.map((property) => (
                <div key={property.id} className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id={`property-${property.id}`}
                    checked={selectedProperties.includes(property.id)}
                    onCheckedChange={() => handlePropertyToggle(property.id)}
                  />
                  <Label htmlFor={`property-${property.id}`} className="text-sm">
                    {property.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Filter */}
        {showCategoryFilter && availableCategories.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Categories</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-categories"
                  checked={selectedCategories.length === availableCategories.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIds = availableCategories.map(c => c.id);
                      setSelectedCategories(allIds);
                      updateFilters({ categories: allIds });
                    } else {
                      setSelectedCategories([]);
                      updateFilters({ categories: [] });
                    }
                  }}
                />
                <Label htmlFor="all-categories" className="text-sm font-medium">
                  All Categories
                </Label>
              </div>
              {availableCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignees Filter */}
        {showAssigneeFilter && availableAssignees.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assigned To</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-assignees"
                  checked={selectedAssignees.length === availableAssignees.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIds = availableAssignees.map(a => a.id);
                      setSelectedAssignees(allIds);
                      updateFilters({ assignees: allIds });
                    } else {
                      setSelectedAssignees([]);
                      updateFilters({ assignees: [] });
                    }
                  }}
                />
                <Label htmlFor="all-assignees" className="text-sm font-medium">
                  All Assignees
                </Label>
              </div>
              {availableAssignees.map((assignee) => (
                <div key={assignee.id} className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id={`assignee-${assignee.id}`}
                    checked={selectedAssignees.includes(assignee.id)}
                    onCheckedChange={() => handleAssigneeToggle(assignee.id)}
                  />
                  <Label htmlFor={`assignee-${assignee.id}`} className="text-sm">
                    {assignee.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Range */}
        {showDateRange && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date-from" className="text-xs text-gray-600">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-xs text-gray-600">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Search</Label>
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button onClick={onRunReport} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <i className="ri-play-line mr-2" />
                Run Report
              </>
            )}
          </Button>
          
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
              <i className="ri-file-pdf-line mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
              <i className="ri-file-excel-line mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
              <i className="ri-file-text-line mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
