"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ReportFilters, type ReportFilters as ReportFiltersType } from "@/components/reports/ReportFilters";
import { useGetProperties } from "@/hooks/useProperties";
import { useGetAppliances } from "@/hooks/useAppliances";

interface ApplianceReportEntry {
  id: string;
  property_name: string;
  unit_name: string;
  appliance_name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  installation_date: string;
  warranty_expiration: string;
  last_service_date: string;
  next_service_due: string;
  status: 'working' | 'needs_service' | 'warranty_expired' | 'broken';
}

function AppliancesReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFiltersType>({
    properties: [],
    categories: [],
    assignees: [],
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: '',
  });

  // Fetch data
  const { data: properties } = useGetProperties();
  const { data: appliances } = useGetAppliances();

  const [applianceData, setApplianceData] = useState<ApplianceReportEntry[]>([]);

  // Process appliances data
  useEffect(() => {
    if (!appliances || !properties) return;

    const currentDate = new Date();
    
    const processedData: ApplianceReportEntry[] = appliances.map(appliance => {
      const property = properties.find(p => p.id === appliance.property_id);
      
      // Determine status based on dates
      let status: 'working' | 'needs_service' | 'warranty_expired' | 'broken' = 'working';
      
      if (appliance.warranty_expiration && new Date(appliance.warranty_expiration) < currentDate) {
        status = 'warranty_expired';
      }
      
      if (appliance.next_service_date && new Date(appliance.next_service_date) <= currentDate) {
        status = 'needs_service';
      }

      // Calculate next service due (6 months from last service or installation)
      let nextServiceDue = '';
      if (appliance.last_service_date) {
        const lastService = new Date(appliance.last_service_date);
        lastService.setMonth(lastService.getMonth() + 6);
        nextServiceDue = lastService.toISOString().split('T')[0];
      } else if (appliance.installation_date) {
        const installation = new Date(appliance.installation_date);
        installation.setMonth(installation.getMonth() + 6);
        nextServiceDue = installation.toISOString().split('T')[0];
      }

      return {
        id: appliance.id,
        property_name: property?.name || 'Unknown Property',
        unit_name: appliance.unit_name || 'Common Area',
        appliance_name: appliance.name,
        category: typeof appliance.category === 'string' ? appliance.category : (appliance.category?.toString() || 'Other'),
        brand: appliance.brand || '',
        model: appliance.model || '',
        serial_number: appliance.serial_number || '',
        installation_date: appliance.installation_date || '',
        warranty_expiration: appliance.warranty_expiration || '',
        last_service_date: appliance.last_service_date || '',
        next_service_due: nextServiceDue,
        status: status,
      };
    });

    // Apply filters
    let filteredData = processedData;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredData = filteredData.filter(item => 
        selectedPropertyNames.includes(item.property_name)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.categories.includes(item.category.toLowerCase().replace(/\s+/g, '-'))
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.property_name.toLowerCase().includes(searchLower) ||
        item.unit_name.toLowerCase().includes(searchLower) ||
        item.appliance_name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower) ||
        item.serial_number.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filteredData = filteredData.filter(item => item.status === 'working');
      } else if (filters.status === 'pending') {
        filteredData = filteredData.filter(item => item.status === 'needs_service');
      } else if (filters.status === 'overdue') {
        filteredData = filteredData.filter(item => item.status === 'warranty_expired');
      }
    }

    setApplianceData(filteredData);
  }, [appliances, properties, filters]);

  const availableProperties = properties?.map(p => ({ id: p.id, name: p.name })) || [];
  
  const availableCategories = [
    { id: 'hvac', name: 'HVAC' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'laundry', name: 'Laundry' },
    { id: 'water-heater', name: 'Water Heater' },
    { id: 'security', name: 'Security' },
    { id: 'other', name: 'Other' },
  ];

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  const handleRunReport = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting appliances report as ${format}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500">Working</Badge>;
      case 'needs_service':
        return <Badge className="bg-yellow-500">Service Due</Badge>;
      case 'warranty_expired':
        return <Badge className="bg-orange-500">Warranty Expired</Badge>;
      case 'broken':
        return <Badge className="bg-red-500">Broken</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWarrantyStatus = (warrantyDate: string) => {
    if (!warrantyDate) return '-';
    const expiration = new Date(warrantyDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <span className="text-red-600">Expired</span>;
    } else if (daysUntilExpiry <= 30) {
      return <span className="text-orange-600">Expires Soon</span>;
    } else {
      return <span className="text-green-600">Active</span>;
    }
  };

  // Calculate statistics
  const stats = {
    total: applianceData.length,
    working: applianceData.filter(a => a.status === 'working').length,
    needsService: applianceData.filter(a => a.status === 'needs_service').length,
    warrantyExpired: applianceData.filter(a => a.status === 'warranty_expired').length,
    broken: applianceData.filter(a => a.status === 'broken').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reports")}
                className="text-gray-600 hover:text-gray-900"
              >
                <i className="ri-arrow-left-line mr-1" />
                Reports
              </Button>
              <span className="text-gray-400">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reports/property")}
                className="text-gray-600 hover:text-gray-900"
              >
                Property
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Appliances</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appliances Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              All appliances, warranty expirations, installation dates, and last service dates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ReportFilters
              onFilterChange={handleFilterChange}
              onExport={handleExport}
              onRunReport={handleRunReport}
              isLoading={isLoading}
              availableProperties={availableProperties}
              availableCategories={availableCategories}
              availableAssignees={[]}
              showPropertyFilter={true}
              showCategoryFilter={true}
              showAssigneeFilter={false}
              showDateRange={false}
              showStatusFilter={true}
            />
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Appliances</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-fridge-line text-2xl text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Working</p>
                      <p className="text-2xl font-bold text-green-600">{stats.working}</p>
                      <p className="text-xs text-gray-500">
                        {stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0}%
                      </p>
                    </div>
                    <i className="ri-check-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Service Due</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.needsService}</p>
                      <p className="text-xs text-gray-500">Needs attention</p>
                    </div>
                    <i className="ri-tools-line text-2xl text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Warranty Expired</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.warrantyExpired}</p>
                      <p className="text-xs text-gray-500">Review coverage</p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appliances Table */}
            <Card>
              <CardHeader>
                <CardTitle>Appliances Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading appliances...</span>
                  </div>
                ) : applianceData.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-fridge-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No appliances found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Property</th>
                          <th className="text-left p-3">Unit</th>
                          <th className="text-left p-3">Appliance</th>
                          <th className="text-left p-3">Category</th>
                          <th className="text-left p-3">Brand/Model</th>
                          <th className="text-left p-3">Installation</th>
                          <th className="text-left p-3">Warranty</th>
                          <th className="text-left p-3">Last Service</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applianceData.map((appliance) => (
                          <tr key={appliance.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3 font-medium">{appliance.property_name}</td>
                            <td className="p-3">{appliance.unit_name}</td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{appliance.appliance_name}</div>
                                {appliance.serial_number && (
                                  <div className="text-xs text-gray-500">SN: {appliance.serial_number}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{appliance.category}</Badge>
                            </td>
                            <td className="p-3">
                              <div>
                                {appliance.brand && <div className="font-medium">{appliance.brand}</div>}
                                {appliance.model && <div className="text-sm text-gray-600">{appliance.model}</div>}
                              </div>
                            </td>
                            <td className="p-3">{formatDate(appliance.installation_date)}</td>
                            <td className="p-3">
                              <div>
                                <div>{formatDate(appliance.warranty_expiration)}</div>
                                <div className="text-xs">{getWarrantyStatus(appliance.warranty_expiration)}</div>
                              </div>
                            </td>
                            <td className="p-3">{formatDate(appliance.last_service_date)}</td>
                            <td className="p-3 text-center">{getStatusBadge(appliance.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(AppliancesReportPage);
