"use client";

import { useState, useMemo } from "react";
import { useGetProperties } from "@/hooks/useProperties";
import { PropertyCard } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrencyFormatter } from "@/lib/currency";
import Link from "next/link";
import { Property } from "@/types/property";

export function PropertyList() {
  const { data: properties, isLoading, isError, error } = useGetProperties();
  const { formatCurrency } = useCurrencyFormatter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    let filtered = properties.filter((property) => {
      const matchesSearch =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      const matchesType = typeFilter === "all" || property.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort properties
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "rent":
          return (b.market_rent || 0) - (a.market_rent || 0);
        case "location":
          return `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [properties, searchTerm, statusFilter, typeFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!properties) return { total: 0, active: 0, inactive: 0, totalRent: 0 };

    return {
      total: properties.length,
      active: properties.filter(p => p.status === 'active').length,
      inactive: properties.filter(p => p.status === 'inactive').length,
      totalRent: properties.reduce((sum, p) => sum + (p.market_rent || 0), 0),
    };
  }, [properties]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-80">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <i className="ri-error-warning-line text-xl" />
          <div>
            <h3 className="text-lg font-semibold">Error loading properties</h3>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your property portfolio
          </p>
        </div>
        <Link href="/properties/new">
          <Button size="lg" className="w-full sm:w-auto">
            <i className="ri-add-line mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <i className="ri-building-line text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Properties</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <i className="ri-check-line text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Properties</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <i className="ri-pause-line text-gray-600 dark:text-gray-400 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalRent)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <i className="ri-money-dollar-circle-line text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search properties by name, address, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="single_unit">Single Unit</SelectItem>
                  <SelectItem value="multi_unit">Multi Unit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="rent">Rent (High to Low)</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-900">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-3"
                >
                  <i className="ri-grid-line" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-3"
                >
                  <i className="ri-list-check" />
                </Button>
              </div>
            </div>
          </div>
          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1 bg-gray-100 dark:bg-gray-700">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
                    <i className="ri-close-line text-xs" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-gray-100 dark:bg-gray-700">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("all")} className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
                    <i className="ri-close-line text-xs" />
                  </button>
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-gray-100 dark:bg-gray-700">
                  Type: {typeFilter.replace("_", " ")}
                  <button onClick={() => setTypeFilter("all")} className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
                    <i className="ri-close-line text-xs" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="h-6 px-2 text-xs text-gray-600 dark:text-gray-400"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredProperties.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredProperties.length} of {properties?.length || 0} properties
          </p>
          {filteredProperties.length !== properties?.length && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
            >
              Show all properties
            </Button>
          )}
        </div>
      )}

      {/* Properties Display */}
      {filteredProperties.length > 0 ? (
        <div className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : properties && properties.length > 0 ? (
        // No results from filtering
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-search-line text-2xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No properties match your current filters. Try adjusting your search criteria.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              variant="outline"
            >
              <i className="ri-refresh-line mr-2" />
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        // No properties at all
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <i className="ri-building-line text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Welcome to your property portfolio
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You haven't added any properties yet. Start building your portfolio by adding your first property.
            </p>
            <div className="space-y-3">
              <Link href="/properties/new">
                <Button size="lg" className="w-full sm:w-auto">
                  <i className="ri-add-line mr-2" />
                  Add Your First Property
                </Button>
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track rentals, manage tenants, and monitor your investments
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}