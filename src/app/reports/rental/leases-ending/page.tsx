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

interface LeaseEndingEntry {
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
  days_until_expiry: number;
  renewal_status: 'not_contacted' | 'contacted' | 'renewed' | 'vacating';
  notice_given: boolean;
}

function LeasesEndingReportPage() {
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

  const [leasesEnding, setLeasesEnding] = useState<LeaseEndingEntry[]>([]);

  // Process data into leases ending format
  useEffect(() => {
    if (!properties || !units || !leases) return;

    const currentDate = new Date();
    const endDate = new Date();
    
    // Default to next 90 days if no date range specified
    if (filters.dateTo) {
      endDate.setTime(new Date(filters.dateTo).getTime());
    } else {
      endDate.setDate(currentDate.getDate() + 90);
    }

    const startDate = filters.dateFrom ? new Date(filters.dateFrom) : currentDate;

    // Find leases ending within the specified timeframe
    const endingLeases = leases.filter(lease => {
      const leaseEndDate = new Date(lease.end_date);
      return leaseEndDate >= startDate && leaseEndDate <= endDate;
    });

    const leaseEntries: LeaseEndingEntry[] = endingLeases.map(lease => {
      const unit = units.find(u => u.id === lease.unit_id);
      const property = properties.find(p => p.id === unit?.property_id);
      const primaryTenant = lease.primary_tenant;

      const leaseEndDate = new Date(lease.end_date);
      const timeDiff = leaseEndDate.getTime() - currentDate.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Mock renewal status (in real app, this would come from database)
      let renewalStatus: 'not_contacted' | 'contacted' | 'renewed' | 'vacating' = 'not_contacted';
      if (daysUntilExpiry < 30) {
        renewalStatus = Math.random() > 0.5 ? 'contacted' : 'not_contacted';
      }
      if (daysUntilExpiry < 7) {
        renewalStatus = Math.random() > 0.7 ? 'renewed' : Math.random() > 0.5 ? 'vacating' : 'contacted';
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
        days_until_expiry: daysUntilExpiry,
        renewal_status: renewalStatus,
        notice_given: renewalStatus === 'vacating',
      };
    });

    // Apply filters
    let filteredLeases = leaseEntries;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredLeases = filteredLeases.filter(lease => 
        selectedPropertyNames.includes(lease.property_name)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'pending') {
        filteredLeases = filteredLeases.filter(lease => lease.renewal_status === 'not_contacted');
      } else if (filters.status === 'active') {
        filteredLeases = filteredLeases.filter(lease => lease.renewal_status === 'contacted');
      } else if (filters.status === 'completed') {
        filteredLeases = filteredLeases.filter(lease => lease.renewal_status === 'renewed');
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLeases = filteredLeases.filter(lease => 
        lease.property_name.toLowerCase().includes(searchLower) ||
        lease.unit_name.toLowerCase().includes(searchLower) ||
        lease.tenant_name.toLowerCase().includes(searchLower) ||
        lease.email.toLowerCase().includes(searchLower) ||
        lease.phone.includes(filters.search)
      );
    }

    // Sort by days until expiry (soonest first)
    filteredLeases.sort((a, b) => a.days_until_expiry - b.days_until_expiry);

    setLeasesEnding(filteredLeases);
  }, [properties, units, leases, filters]);

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
    console.log(`Exporting leases ending as ${format}`);
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

  const getRenewalStatusBadge = (status: string) => {
    switch (status) {
      case 'not_contacted':
        return <Badge className="bg-gray-500">Not Contacted</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500">Contacted</Badge>;
      case 'renewed':
        return <Badge className="bg-green-500">Renewed</Badge>;
      case 'vacating':
        return <Badge className="bg-red-500">Vacating</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) {
      return <Badge className="bg-red-500">Urgent</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-yellow-500">Soon</Badge>;
    } else {
      return <Badge className="bg-green-500">Upcoming</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: leasesEnding.length,
    urgent: leasesEnding.filter(l => l.days_until_expiry <= 7).length,
    soon: leasesEnding.filter(l => l.days_until_expiry > 7 && l.days_until_expiry <= 30).length,
    upcoming: leasesEnding.filter(l => l.days_until_expiry > 30).length,
    notContacted: leasesEnding.filter(l => l.renewal_status === 'not_contacted').length,
    renewed: leasesEnding.filter(l => l.renewal_status === 'renewed').length,
    vacating: leasesEnding.filter(l => l.renewal_status === 'vacating').length,
    totalRent: leasesEnding.reduce((sum, l) => sum + l.rent_amount, 0),
  };

  const getDateRangeText = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
    } else if (filters.dateTo) {
      return `Until ${formatDate(filters.dateTo)}`;
    }
    return 'Next 90 Days';
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
              <span className="text-gray-600">Leases Ending</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leases Ending Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              All leases that will end during a specified time frame ({getDateRangeText()})
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
              showDateRange={true}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Ending</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-calendar-event-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Urgent (≤7 days)</p>
                      <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Not Contacted</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.notContacted}</p>
                    </div>
                    <i className="ri-phone-line text-2xl text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRent)}</p>
                      <p className="text-xs text-gray-500">At risk</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leases Ending Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Leases Ending</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading leases ending...</span>
                  </div>
                ) : leasesEnding.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-calendar-check-line text-4xl text-green-400 mb-2 block" />
                    <p className="text-gray-600">No leases ending in the specified timeframe.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Property</th>
                          <th className="text-left p-2 text-sm font-medium">Unit</th>
                          <th className="text-left p-2 text-sm font-medium">Tenant</th>
                          <th className="text-left p-2 text-sm font-medium">Contact</th>
                          <th className="text-left p-2 text-sm font-medium">Lease End</th>
                          <th className="text-center p-2 text-sm font-medium">Days Left</th>
                          <th className="text-center p-2 text-sm font-medium">Urgency</th>
                          <th className="text-right p-2 text-sm font-medium">Rent</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leasesEnding.map((lease) => (
                          <tr key={lease.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium text-sm">{lease.property_name}</td>
                            <td className="p-2 text-sm">{lease.unit_name}</td>
                            <td className="p-2 text-sm">{lease.tenant_name}</td>
                            <td className="p-2 text-sm">
                              <div>
                                {lease.email && <div>{lease.email}</div>}
                                {lease.phone && <div>{lease.phone}</div>}
                              </div>
                            </td>
                            <td className="p-2 text-sm">{formatDate(lease.lease_end)}</td>
                            <td className="p-2 text-center text-sm">
                              <span className={`font-medium ${
                                lease.days_until_expiry <= 7 ? 'text-red-600' : 
                                lease.days_until_expiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {lease.days_until_expiry}
                              </span>
                            </td>
                            <td className="p-2 text-center">{getUrgencyBadge(lease.days_until_expiry)}</td>
                            <td className="p-2 text-right font-medium text-sm">{formatCurrency(lease.rent_amount)}</td>
                            <td className="p-2 text-center">{getRenewalStatusBadge(lease.renewal_status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-2 text-sm" colSpan={7}>TOTALS ({stats.total} leases)</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalRent)}</td>
                          <td className="p-2"></td>
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

export default withAuth(LeasesEndingReportPage);
