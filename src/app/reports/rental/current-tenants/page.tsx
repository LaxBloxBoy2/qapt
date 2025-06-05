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
import { useGetUnits } from "@/hooks/useUnits";
import { useLeases } from "@/hooks/useLeases";
import { useTenants } from "@/hooks/useTenants";

interface CurrentTenantEntry {
  id: string;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  email: string;
  phone: string;
  lease_start: string;
  lease_end: string;
  rent_amount: number;
  security_deposit: number;
  lease_status: 'active' | 'expiring_soon' | 'month_to_month';
  days_until_expiry: number;
}

function CurrentTenantsReportPage() {
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
  const { data: units } = useGetUnits();
  const { data: leases } = useLeases();
  const { data: tenants } = useTenants();

  const [currentTenants, setCurrentTenants] = useState<CurrentTenantEntry[]>([]);

  // Process data into current tenants format
  useEffect(() => {
    if (!properties || !units || !leases || !tenants) return;

    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    // Get active leases
    const activeLeases = leases.filter(lease => {
      const startDate = new Date(lease.start_date);
      const endDate = new Date(lease.end_date);
      return startDate <= currentDate && endDate >= currentDate;
    });

    const tenantEntries: CurrentTenantEntry[] = activeLeases.map(lease => {
      const unit = units.find(u => u.id === lease.unit_id);
      const property = properties.find(p => p.id === unit?.property_id);
      const primaryTenant = lease.primary_tenant;

      const endDate = new Date(lease.end_date);
      const timeDiff = endDate.getTime() - currentDate.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      let leaseStatus: 'active' | 'expiring_soon' | 'month_to_month' = 'active';
      if (daysUntilExpiry <= 30) {
        leaseStatus = 'expiring_soon';
      }
      // Check if it's month-to-month (lease ended but tenant still there)
      if (daysUntilExpiry < 0) {
        leaseStatus = 'month_to_month';
      }

      return {
        id: lease.id,
        property_name: property?.name || 'Unknown Property',
        unit_name: unit?.name || 'Unknown Unit',
        tenant_name: primaryTenant 
          ? `${primaryTenant.first_name} ${primaryTenant.last_name}`
          : 'Unknown Tenant',
        email: primaryTenant?.email || '',
        phone: primaryTenant?.phone || '',
        lease_start: lease.start_date,
        lease_end: lease.end_date,
        rent_amount: lease.rent_amount || 0,
        security_deposit: lease.deposit_amount || 0,
        lease_status: leaseStatus,
        days_until_expiry: Math.max(0, daysUntilExpiry),
      };
    });

    // Apply filters
    let filteredTenants = tenantEntries;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredTenants = filteredTenants.filter(tenant => 
        selectedPropertyNames.includes(tenant.property_name)
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTenants = filteredTenants.filter(tenant => 
        tenant.property_name.toLowerCase().includes(searchLower) ||
        tenant.unit_name.toLowerCase().includes(searchLower) ||
        tenant.tenant_name.toLowerCase().includes(searchLower) ||
        tenant.email.toLowerCase().includes(searchLower) ||
        tenant.phone.includes(filters.search)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filteredTenants = filteredTenants.filter(tenant => tenant.lease_status === 'active');
      } else if (filters.status === 'pending') {
        filteredTenants = filteredTenants.filter(tenant => tenant.lease_status === 'expiring_soon');
      }
    }

    setCurrentTenants(filteredTenants);
  }, [properties, units, leases, tenants, filters]);

  const availableProperties = properties?.map(p => ({ id: p.id, name: p.name })) || [];

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
    console.log(`Exporting current tenants as ${format}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-500">Expiring Soon</Badge>;
      case 'month_to_month':
        return <Badge className="bg-blue-500">Month-to-Month</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: currentTenants.length,
    active: currentTenants.filter(t => t.lease_status === 'active').length,
    expiring: currentTenants.filter(t => t.lease_status === 'expiring_soon').length,
    monthToMonth: currentTenants.filter(t => t.lease_status === 'month_to_month').length,
    totalRent: currentTenants.reduce((sum, t) => sum + t.rent_amount, 0),
    totalDeposits: currentTenants.reduce((sum, t) => sum + t.security_deposit, 0),
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
                onClick={() => router.push("/reports/rental")}
                className="text-gray-600 hover:text-gray-900"
              >
                Rental
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Current Tenants</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Current Tenants Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Current tenants by property with lease information and contact details
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
              availableCategories={[]}
              availableAssignees={[]}
              showPropertyFilter={true}
              showCategoryFilter={false}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Tenants</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-user-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Leases</p>
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                      <p className="text-xs text-gray-500">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                      <p className="text-xs text-gray-500">Next 30 days</p>
                    </div>
                    <i className="ri-calendar-event-line text-2xl text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRent)}</p>
                      <p className="text-xs text-gray-500">Total income</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Tenants Table */}
            <Card>
              <CardHeader>
                <CardTitle>Current Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading current tenants...</span>
                  </div>
                ) : currentTenants.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-user-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No current tenants found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Property</th>
                          <th className="text-left p-3">Unit</th>
                          <th className="text-left p-3">Tenant</th>
                          <th className="text-left p-3">Contact</th>
                          <th className="text-left p-3">Lease Period</th>
                          <th className="text-right p-3">Rent</th>
                          <th className="text-right p-3">Deposit</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTenants.map((tenant) => (
                          <tr key={tenant.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3 font-medium">{tenant.property_name}</td>
                            <td className="p-3">{tenant.unit_name}</td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{tenant.tenant_name}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {tenant.email && <div>{tenant.email}</div>}
                                {tenant.phone && <div>{tenant.phone}</div>}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <div>{formatDate(tenant.lease_start)} - {formatDate(tenant.lease_end)}</div>
                                {tenant.days_until_expiry > 0 && tenant.days_until_expiry <= 30 && (
                                  <div className="text-yellow-600 font-medium">
                                    Expires in {tenant.days_until_expiry} days
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right font-medium">{formatCurrency(tenant.rent_amount)}</td>
                            <td className="p-3 text-right">{formatCurrency(tenant.security_deposit)}</td>
                            <td className="p-3 text-center">{getLeaseStatusBadge(tenant.lease_status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-3" colSpan={5}>TOTALS ({stats.total} tenants)</td>
                          <td className="p-3 text-right">{formatCurrency(stats.totalRent)}</td>
                          <td className="p-3 text-right">{formatCurrency(stats.totalDeposits)}</td>
                          <td className="p-3"></td>
                        </tr>
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

export default withAuth(CurrentTenantsReportPage);
