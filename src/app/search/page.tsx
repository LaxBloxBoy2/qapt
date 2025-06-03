"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetProperties } from "@/hooks/useProperties";
import { useGetUnits } from "@/hooks/useUnits";
import { useTenants } from "@/hooks/useTenants";
import { useGetLeases } from "@/hooks/useLeases";
import { Property } from "@/types/property";
import { Unit } from "@/types/unit";
import { Tenant } from "@/types/tenant";
import { Lease } from "@/types/lease";

function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");

  // Data hooks
  const { data: properties = [] } = useGetProperties();
  const { data: units = [] } = useGetUnits();
  const { data: tenants = [] } = useTenants();
  const { data: leases = [] } = useGetLeases();

  // Search functions
  const searchProperties = (query: string): Property[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return properties.filter(property =>
      property.name?.toLowerCase().includes(lowerQuery) ||
      property.address?.toLowerCase().includes(lowerQuery) ||
      property.city?.toLowerCase().includes(lowerQuery) ||
      property.state?.toLowerCase().includes(lowerQuery)
    );
  };

  const searchUnits = (query: string): Unit[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return units.filter(unit =>
      unit.name?.toLowerCase().includes(lowerQuery) ||
      unit.description?.toLowerCase().includes(lowerQuery)
    );
  };

  const searchTenants = (query: string): Tenant[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return tenants.filter(tenant =>
      tenant.first_name?.toLowerCase().includes(lowerQuery) ||
      tenant.last_name?.toLowerCase().includes(lowerQuery) ||
      tenant.email?.toLowerCase().includes(lowerQuery) ||
      tenant.phone?.toLowerCase().includes(lowerQuery)
    );
  };

  const searchLeases = (query: string): Lease[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return leases.filter(lease =>
      lease.tenant_name?.toLowerCase().includes(lowerQuery) ||
      lease.property_name?.toLowerCase().includes(lowerQuery) ||
      lease.unit_name?.toLowerCase().includes(lowerQuery)
    );
  };

  // Get search results
  const propertyResults = searchProperties(searchQuery);
  const unitResults = searchUnits(searchQuery);
  const tenantResults = searchTenants(searchQuery);
  const leaseResults = searchLeases(searchQuery);

  const totalResults = propertyResults.length + unitResults.length + tenantResults.length + leaseResults.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchQuery);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? `Results for "${searchQuery}"` : "Enter a search term to find properties, tenants, units, and leases"}
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search properties, tenants, units, leases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">
                <i className="ri-search-line mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searchQuery && (
          <div className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
              {totalResults > 0 && (
                <div className="flex gap-2">
                  <Badge variant="outline">{propertyResults.length} Properties</Badge>
                  <Badge variant="outline">{unitResults.length} Units</Badge>
                  <Badge variant="outline">{tenantResults.length} Tenants</Badge>
                  <Badge variant="outline">{leaseResults.length} Leases</Badge>
                </div>
              )}
            </div>

            {totalResults > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                  <TabsTrigger value="properties">Properties ({propertyResults.length})</TabsTrigger>
                  <TabsTrigger value="units">Units ({unitResults.length})</TabsTrigger>
                  <TabsTrigger value="tenants">Tenants ({tenantResults.length})</TabsTrigger>
                  <TabsTrigger value="leases">Leases ({leaseResults.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {/* All Results */}
                  {propertyResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <i className="ri-home-line" />
                          Properties ({propertyResults.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {propertyResults.slice(0, 3).map((property) => (
                          <div key={property.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <h4 className="font-medium">{property.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {property.address}, {property.city}, {property.state}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {property.type?.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                        {propertyResults.length > 3 && (
                          <Button variant="ghost" onClick={() => setActiveTab("properties")}>
                            View all {propertyResults.length} properties
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Similar sections for units, tenants, leases... */}
                  {unitResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <i className="ri-building-line" />
                          Units ({unitResults.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {unitResults.slice(0, 3).map((unit) => (
                          <div key={unit.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <h4 className="font-medium">{unit.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {unit.description}
                            </p>
                          </div>
                        ))}
                        {unitResults.length > 3 && (
                          <Button variant="ghost" onClick={() => setActiveTab("units")}>
                            View all {unitResults.length} units
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {tenantResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <i className="ri-user-line" />
                          Tenants ({tenantResults.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tenantResults.slice(0, 3).map((tenant) => (
                          <div key={tenant.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <h4 className="font-medium">{tenant.first_name} {tenant.last_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tenant.email} • {tenant.phone}
                            </p>
                          </div>
                        ))}
                        {tenantResults.length > 3 && (
                          <Button variant="ghost" onClick={() => setActiveTab("tenants")}>
                            View all {tenantResults.length} tenants
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {leaseResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <i className="ri-file-text-line" />
                          Leases ({leaseResults.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {leaseResults.slice(0, 3).map((lease) => (
                          <div key={lease.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <h4 className="font-medium">{lease.tenant_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {lease.property_name} - {lease.unit_name}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {lease.status}
                            </Badge>
                          </div>
                        ))}
                        {leaseResults.length > 3 && (
                          <Button variant="ghost" onClick={() => setActiveTab("leases")}>
                            View all {leaseResults.length} leases
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Individual tab contents would go here */}
                <TabsContent value="properties">
                  <div className="space-y-2">
                    {propertyResults.map((property) => (
                      <Card key={property.id}>
                        <CardContent className="p-4">
                          <h4 className="font-medium">{property.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {property.address}, {property.city}, {property.state}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {property.type?.replace('_', ' ')}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Add other tab contents as needed */}
              </Tabs>
            ) : (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <i className="ri-search-line text-2xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No properties, tenants, units, or leases match your search for "{searchQuery}".
                    Try adjusting your search terms.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withAuth(SearchPage);
