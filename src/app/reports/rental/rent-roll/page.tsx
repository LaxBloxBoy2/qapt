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
import { useTransactions } from "@/hooks/useFinances";

interface RentRollEntry {
  property_name: string;
  unit_name: string;
  tenant_name: string;
  lease_start: string;
  lease_end: string;
  market_rent: number;
  current_rent: number;
  security_deposit: number;
  balance_due: number;
  status: 'current' | 'late' | 'vacant';
}

function RentRollReportPage() {
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
  const { data: transactions } = useTransactions();

  const [rentRollData, setRentRollData] = useState<RentRollEntry[]>([]);

  // Process data into rent roll format
  useEffect(() => {
    if (!properties || !units || !leases || !tenants) return;

    const rentRollEntries: RentRollEntry[] = [];

    // Get current date for status determination
    const currentDate = new Date();

    // Process each unit
    units.forEach(unit => {
      const property = properties.find(p => p.id === unit.property_id);
      if (!property) return;

      // Find active lease for this unit
      const activeLease = leases.find(lease => 
        lease.unit_id === unit.id && 
        new Date(lease.start_date) <= currentDate &&
        new Date(lease.end_date) >= currentDate
      );

      if (activeLease) {
        // Unit is occupied
        const primaryTenant = activeLease.primary_tenant;
        const tenantName = primaryTenant 
          ? `${primaryTenant.first_name} ${primaryTenant.last_name}`
          : 'Unknown Tenant';

        // Calculate balance due from transactions
        const unitTransactions = transactions?.filter(t => 
          t.unit_id === unit.id && 
          t.type === 'income' && 
          t.status === 'pending'
        ) || [];
        
        const balanceDue = unitTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        // Determine status based on balance and due dates
        let status: 'current' | 'late' | 'vacant' = 'current';
        if (balanceDue > 0) {
          const overdueTransactions = unitTransactions.filter(t => 
            t.due_date && new Date(t.due_date) < currentDate
          );
          if (overdueTransactions.length > 0) {
            status = 'late';
          }
        }

        rentRollEntries.push({
          property_name: property.name,
          unit_name: unit.name,
          tenant_name: tenantName,
          lease_start: activeLease.start_date,
          lease_end: activeLease.end_date,
          market_rent: unit.market_rent || 0,
          current_rent: activeLease.rent_amount || 0,
          security_deposit: activeLease.deposit_amount || 0,
          balance_due: balanceDue,
          status: status,
        });
      } else {
        // Unit is vacant
        rentRollEntries.push({
          property_name: property.name,
          unit_name: unit.name,
          tenant_name: 'Vacant',
          lease_start: '',
          lease_end: '',
          market_rent: unit.market_rent || 0,
          current_rent: 0,
          security_deposit: 0,
          balance_due: 0,
          status: 'vacant',
        });
      }
    });

    // Apply filters
    let filteredEntries = rentRollEntries;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredEntries = filteredEntries.filter(entry => 
        selectedPropertyNames.includes(entry.property_name)
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEntries = filteredEntries.filter(entry => 
        entry.property_name.toLowerCase().includes(searchLower) ||
        entry.unit_name.toLowerCase().includes(searchLower) ||
        entry.tenant_name.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'pending') {
        filteredEntries = filteredEntries.filter(entry => entry.status === 'late');
      } else if (filters.status === 'active') {
        filteredEntries = filteredEntries.filter(entry => entry.status === 'current');
      }
    }

    setRentRollData(filteredEntries);
  }, [properties, units, leases, tenants, transactions, filters]);

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
    console.log(`Exporting rent roll as ${format}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      case 'current':
        return <Badge className="bg-green-500">Current</Badge>;
      case 'late':
        return <Badge className="bg-red-500">Late</Badge>;
      case 'vacant':
        return <Badge variant="outline">Vacant</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate totals
  const totals = rentRollData.reduce((acc, entry) => ({
    market_rent: acc.market_rent + entry.market_rent,
    current_rent: acc.current_rent + entry.current_rent,
    security_deposits: acc.security_deposits + entry.security_deposit,
    balance_due: acc.balance_due + entry.balance_due,
  }), { market_rent: 0, current_rent: 0, security_deposits: 0, balance_due: 0 });

  const occupiedUnits = rentRollData.filter(entry => entry.status !== 'vacant').length;
  const vacantUnits = rentRollData.filter(entry => entry.status === 'vacant').length;
  const lateUnits = rentRollData.filter(entry => entry.status === 'late').length;

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
              <span className="text-gray-600">Rent Roll</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rent Roll Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Rent balance due by property and tenant, including lease dates, market rent, and deposits
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Units</p>
                      <p className="text-2xl font-bold">{rentRollData.length}</p>
                    </div>
                    <i className="ri-home-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Occupied</p>
                      <p className="text-2xl font-bold text-green-600">{occupiedUnits}</p>
                      <p className="text-xs text-gray-500">
                        {rentRollData.length > 0 ? Math.round((occupiedUnits / rentRollData.length) * 100) : 0}% occupancy
                      </p>
                    </div>
                    <i className="ri-user-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vacant</p>
                      <p className="text-2xl font-bold text-yellow-600">{vacantUnits}</p>
                      <p className="text-xs text-gray-500">
                        {rentRollData.length > 0 ? Math.round((vacantUnits / rentRollData.length) * 100) : 0}% vacancy
                      </p>
                    </div>
                    <i className="ri-home-2-line text-2xl text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Late Payments</p>
                      <p className="text-2xl font-bold text-red-600">{lateUnits}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(totals.balance_due)}</p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rent Roll Table */}
            <Card>
              <CardHeader>
                <CardTitle>Rent Roll</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading rent roll...</span>
                  </div>
                ) : rentRollData.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-home-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No units found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Property</th>
                          <th className="text-left p-3">Unit</th>
                          <th className="text-left p-3">Tenant</th>
                          <th className="text-left p-3">Lease Start</th>
                          <th className="text-left p-3">Lease End</th>
                          <th className="text-right p-3">Market Rent</th>
                          <th className="text-right p-3">Current Rent</th>
                          <th className="text-right p-3">Security Deposit</th>
                          <th className="text-right p-3">Balance Due</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentRollData.map((entry, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3 font-medium">{entry.property_name}</td>
                            <td className="p-3">{entry.unit_name}</td>
                            <td className="p-3">{entry.tenant_name}</td>
                            <td className="p-3">{formatDate(entry.lease_start)}</td>
                            <td className="p-3">{formatDate(entry.lease_end)}</td>
                            <td className="p-3 text-right">{formatCurrency(entry.market_rent)}</td>
                            <td className="p-3 text-right">{formatCurrency(entry.current_rent)}</td>
                            <td className="p-3 text-right">{formatCurrency(entry.security_deposit)}</td>
                            <td className="p-3 text-right">
                              {entry.balance_due > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {formatCurrency(entry.balance_due)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">{getStatusBadge(entry.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-3" colSpan={5}>TOTALS</td>
                          <td className="p-3 text-right">{formatCurrency(totals.market_rent)}</td>
                          <td className="p-3 text-right">{formatCurrency(totals.current_rent)}</td>
                          <td className="p-3 text-right">{formatCurrency(totals.security_deposits)}</td>
                          <td className="p-3 text-right text-red-600">{formatCurrency(totals.balance_due)}</td>
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

export default withAuth(RentRollReportPage);
