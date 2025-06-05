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

interface VacantUnitEntry {
  id: string;
  property_name: string;
  unit_name: string;
  unit_type: string;
  beds: number;
  baths: number;
  size: number;
  market_rent: number;
  deposit: number;
  last_tenant: string;
  vacant_since: string;
  days_vacant: number;
  estimated_monthly_loss: number;
  status: 'vacant' | 'maintenance' | 'ready';
}

function VacantUnitsReportPage() {
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

  const [vacantUnits, setVacantUnits] = useState<VacantUnitEntry[]>([]);

  // Process data into vacant units format
  useEffect(() => {
    if (!properties || !units || !leases) return;

    const currentDate = new Date();

    // Find vacant units
    const vacantUnitEntries: VacantUnitEntry[] = units
      .filter(unit => unit.status === 'vacant' || unit.status === 'maintenance')
      .map(unit => {
        const property = properties.find(p => p.id === unit.property_id);
        
        // Find the most recent lease for this unit
        const unitLeases = leases
          .filter(lease => lease.unit_id === unit.id)
          .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
        
        const lastLease = unitLeases[0];
        let lastTenant = 'No previous tenant';
        let vacantSince = unit.created_at;
        
        if (lastLease) {
          const primaryTenant = lastLease.primary_tenant;
          lastTenant = primaryTenant 
            ? `${primaryTenant.first_name} ${primaryTenant.last_name}`
            : 'Unknown tenant';
          vacantSince = lastLease.end_date;
        }

        const vacantSinceDate = new Date(vacantSince);
        const timeDiff = currentDate.getTime() - vacantSinceDate.getTime();
        const daysVacant = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        // Calculate estimated monthly loss (market rent * days vacant / 30)
        const marketRent = unit.market_rent || 0;
        const estimatedMonthlyLoss = (marketRent * daysVacant) / 30;

        return {
          id: unit.id,
          property_name: property?.name || 'Unknown Property',
          unit_name: unit.name,
          unit_type: unit.unit_type || 'Unknown',
          beds: unit.beds || 0,
          baths: unit.baths || 0,
          size: unit.size || 0,
          market_rent: marketRent,
          deposit: unit.deposit || 0,
          last_tenant: lastTenant,
          vacant_since: vacantSince,
          days_vacant: Math.max(0, daysVacant),
          estimated_monthly_loss: estimatedMonthlyLoss,
          status: unit.status === 'maintenance' ? 'maintenance' : 
                  daysVacant <= 7 ? 'ready' : 'vacant',
        };
      });

    // Apply filters
    let filteredUnits = vacantUnitEntries;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredUnits = filteredUnits.filter(unit => 
        selectedPropertyNames.includes(unit.property_name)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filteredUnits = filteredUnits.filter(unit => unit.status === 'ready');
      } else if (filters.status === 'pending') {
        filteredUnits = filteredUnits.filter(unit => unit.status === 'maintenance');
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUnits = filteredUnits.filter(unit => 
        unit.property_name.toLowerCase().includes(searchLower) ||
        unit.unit_name.toLowerCase().includes(searchLower) ||
        unit.unit_type.toLowerCase().includes(searchLower) ||
        unit.last_tenant.toLowerCase().includes(searchLower)
      );
    }

    // Sort by days vacant (longest vacant first)
    filteredUnits.sort((a, b) => b.days_vacant - a.days_vacant);

    setVacantUnits(filteredUnits);
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
    console.log(`Exporting vacant units as ${format}`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500">Ready</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500">Maintenance</Badge>;
      case 'vacant':
        return <Badge className="bg-red-500">Vacant</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVacancyDurationBadge = (days: number) => {
    if (days <= 7) {
      return <Badge className="bg-green-500">New</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-yellow-500">Recent</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-orange-500">Extended</Badge>;
    } else {
      return <Badge className="bg-red-500">Long-term</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: vacantUnits.length,
    ready: vacantUnits.filter(u => u.status === 'ready').length,
    maintenance: vacantUnits.filter(u => u.status === 'maintenance').length,
    longTerm: vacantUnits.filter(u => u.days_vacant > 90).length,
    totalPotentialRent: vacantUnits.reduce((sum, u) => sum + u.market_rent, 0),
    totalLoss: vacantUnits.reduce((sum, u) => sum + u.estimated_monthly_loss, 0),
    avgDaysVacant: vacantUnits.length > 0 ? 
      Math.round(vacantUnits.reduce((sum, u) => sum + u.days_vacant, 0) / vacantUnits.length) : 0,
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
              <span className="text-gray-600">Vacant Units</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vacant Units Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Vacant units by property with vacancy duration and potential revenue loss
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Vacant</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-home-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ready to Rent</p>
                      <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
                    </div>
                    <i className="ri-check-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Days Vacant</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.avgDaysVacant}</p>
                    </div>
                    <i className="ri-calendar-line text-2xl text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Loss</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalLoss)}</p>
                      <p className="text-xs text-gray-500">Estimated</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vacant Units Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Vacant Units</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading vacant units...</span>
                  </div>
                ) : vacantUnits.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-home-smile-line text-4xl text-green-400 mb-2 block" />
                    <p className="text-gray-600">No vacant units found. All units are occupied!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Property</th>
                          <th className="text-left p-2 text-sm font-medium">Unit</th>
                          <th className="text-left p-2 text-sm font-medium">Type</th>
                          <th className="text-left p-2 text-sm font-medium">Specs</th>
                          <th className="text-left p-2 text-sm font-medium">Last Tenant</th>
                          <th className="text-left p-2 text-sm font-medium">Vacant Since</th>
                          <th className="text-center p-2 text-sm font-medium">Days Vacant</th>
                          <th className="text-center p-2 text-sm font-medium">Duration</th>
                          <th className="text-right p-2 text-sm font-medium">Market Rent</th>
                          <th className="text-right p-2 text-sm font-medium">Est. Loss</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacantUnits.map((unit) => (
                          <tr key={unit.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium text-sm">{unit.property_name}</td>
                            <td className="p-2 text-sm">{unit.unit_name}</td>
                            <td className="p-2 text-sm">{unit.unit_type}</td>
                            <td className="p-2 text-sm">
                              <div>
                                <div>{unit.beds} bed, {unit.baths} bath</div>
                                {unit.size > 0 && <div className="text-xs text-gray-500">{unit.size} sq ft</div>}
                              </div>
                            </td>
                            <td className="p-2 text-sm">{unit.last_tenant}</td>
                            <td className="p-2 text-sm">{formatDate(unit.vacant_since)}</td>
                            <td className="p-2 text-center text-sm">
                              <span className={`font-medium ${
                                unit.days_vacant > 90 ? 'text-red-600' : 
                                unit.days_vacant > 30 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {unit.days_vacant}
                              </span>
                            </td>
                            <td className="p-2 text-center">{getVacancyDurationBadge(unit.days_vacant)}</td>
                            <td className="p-2 text-right font-medium text-sm">{formatCurrency(unit.market_rent)}</td>
                            <td className="p-2 text-right font-medium text-red-600 text-sm">{formatCurrency(unit.estimated_monthly_loss)}</td>
                            <td className="p-2 text-center">{getStatusBadge(unit.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-2 text-sm" colSpan={8}>TOTALS ({stats.total} units)</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalPotentialRent)}</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalLoss)}</td>
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

export default withAuth(VacantUnitsReportPage);
