"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ReportFilters, type ReportFilters as ReportFiltersType } from "@/components/reports/ReportFilters";
import { useTransactions } from "@/hooks/useFinances";
import { useGetProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";

interface DelinquentTenantEntry {
  id: string;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  email: string;
  phone: string;
  total_balance: number;
  overdue_amount: number;
  days_overdue: number;
  last_payment_date: string;
  status: 'current' | 'late' | 'delinquent';
}

function DelinquentTenantsReportPage() {
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
  const { data: tenants } = useTenants();
  const { data: transactions } = useTransactions({
    property_id: filters.properties.length === 1 ? filters.properties[0] : undefined,
    type: 'income',
  });

  const [delinquentTenants, setDelinquentTenants] = useState<DelinquentTenantEntry[]>([]);

  // Process data into delinquent tenants format
  useEffect(() => {
    if (!properties || !tenants || !transactions) return;

    const currentDate = new Date();
    const tenantBalances = new Map<string, {
      tenant: any;
      totalBalance: number;
      overdueAmount: number;
      lastPaymentDate: string;
      daysOverdue: number;
    }>();

    // Calculate balances for each tenant
    tenants.forEach(tenant => {
      const tenantTransactions = transactions.filter(t => t.tenant_id === tenant.id);
      
      let totalBalance = 0;
      let overdueAmount = 0;
      let lastPaymentDate = '';
      let maxDaysOverdue = 0;

      tenantTransactions.forEach(transaction => {
        if (transaction.status === 'pending' || transaction.status === 'overdue') {
          totalBalance += transaction.amount || 0;
          
          const dueDate = new Date(transaction.due_date || transaction.created_at);
          const timeDiff = currentDate.getTime() - dueDate.getTime();
          const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          
          if (daysOverdue > 0) {
            overdueAmount += transaction.amount || 0;
            maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue);
          }
        } else if (transaction.status === 'paid' && transaction.paid_date) {
          if (!lastPaymentDate || new Date(transaction.paid_date) > new Date(lastPaymentDate)) {
            lastPaymentDate = transaction.paid_date;
          }
        }
      });

      if (totalBalance > 0) {
        tenantBalances.set(tenant.id, {
          tenant,
          totalBalance,
          overdueAmount,
          lastPaymentDate,
          daysOverdue: maxDaysOverdue,
        });
      }
    });

    // Convert to delinquent tenant entries
    const delinquentEntries: DelinquentTenantEntry[] = Array.from(tenantBalances.values()).map(data => {
      const property = properties.find(p => p.id === data.tenant.property_id);
      
      let status: 'current' | 'late' | 'delinquent' = 'current';
      if (data.daysOverdue > 30) {
        status = 'delinquent';
      } else if (data.daysOverdue > 0) {
        status = 'late';
      }

      return {
        id: data.tenant.id,
        property_name: property?.name || 'Unknown Property',
        unit_name: data.tenant.unit?.name || 'N/A',
        tenant_name: `${data.tenant.first_name} ${data.tenant.last_name}`,
        email: data.tenant.email || '',
        phone: data.tenant.phone || '',
        total_balance: data.totalBalance,
        overdue_amount: data.overdueAmount,
        days_overdue: data.daysOverdue,
        last_payment_date: data.lastPaymentDate,
        status,
      };
    });

    // Apply filters
    let filteredTenants = delinquentEntries;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredTenants = filteredTenants.filter(tenant => 
        selectedPropertyNames.includes(tenant.property_name)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        filteredTenants = filteredTenants.filter(tenant => tenant.status === 'delinquent');
      } else if (filters.status === 'pending') {
        filteredTenants = filteredTenants.filter(tenant => tenant.status === 'late');
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTenants = filteredTenants.filter(tenant => 
        tenant.property_name.toLowerCase().includes(searchLower) ||
        tenant.tenant_name.toLowerCase().includes(searchLower) ||
        tenant.email.toLowerCase().includes(searchLower) ||
        tenant.phone.includes(filters.search)
      );
    }

    // Sort by days overdue (most overdue first)
    filteredTenants.sort((a, b) => b.days_overdue - a.days_overdue);

    setDelinquentTenants(filteredTenants);
  }, [properties, tenants, transactions, filters]);

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
    console.log(`Exporting delinquent tenants as ${format}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
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
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'delinquent':
        return <Badge className="bg-red-500">Delinquent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: delinquentTenants.length,
    late: delinquentTenants.filter(t => t.status === 'late').length,
    delinquent: delinquentTenants.filter(t => t.status === 'delinquent').length,
    totalOwed: delinquentTenants.reduce((sum, t) => sum + t.total_balance, 0),
    overdueAmount: delinquentTenants.reduce((sum, t) => sum + t.overdue_amount, 0),
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
              <span className="text-gray-600">Delinquent Tenants</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delinquent Tenants Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tenants with outstanding ledger balances as of a specific date
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Delinquent</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-user-unfollow-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Late Payments</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                      <p className="text-xs text-gray-500">1-30 days</p>
                    </div>
                    <i className="ri-time-line text-2xl text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delinquent</p>
                      <p className="text-2xl font-bold text-red-600">{stats.delinquent}</p>
                      <p className="text-xs text-gray-500">30+ days</p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Owed</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOwed)}</p>
                      <p className="text-xs text-gray-500">Outstanding</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delinquent Tenants Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Delinquent Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading delinquent tenants...</span>
                  </div>
                ) : delinquentTenants.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-user-smile-line text-4xl text-green-400 mb-2 block" />
                    <p className="text-gray-600">No delinquent tenants found. Great job!</p>
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
                          <th className="text-right p-2 text-sm font-medium">Total Balance</th>
                          <th className="text-right p-2 text-sm font-medium">Overdue Amount</th>
                          <th className="text-center p-2 text-sm font-medium">Days Overdue</th>
                          <th className="text-left p-2 text-sm font-medium">Last Payment</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {delinquentTenants.map((tenant) => (
                          <tr key={tenant.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium text-sm">{tenant.property_name}</td>
                            <td className="p-2 text-sm">{tenant.unit_name}</td>
                            <td className="p-2 text-sm">{tenant.tenant_name}</td>
                            <td className="p-2 text-sm">
                              <div>
                                {tenant.email && <div>{tenant.email}</div>}
                                {tenant.phone && <div>{tenant.phone}</div>}
                              </div>
                            </td>
                            <td className="p-2 text-right font-medium text-sm">{formatCurrency(tenant.total_balance)}</td>
                            <td className="p-2 text-right font-medium text-red-600 text-sm">{formatCurrency(tenant.overdue_amount)}</td>
                            <td className="p-2 text-center text-sm">
                              <span className="text-red-600 font-medium">{tenant.days_overdue}</span>
                            </td>
                            <td className="p-2 text-sm">{formatDate(tenant.last_payment_date)}</td>
                            <td className="p-2 text-center">{getStatusBadge(tenant.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-2 text-sm" colSpan={4}>TOTALS ({stats.total} tenants)</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalOwed)}</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.overdueAmount)}</td>
                          <td className="p-2" colSpan={3}></td>
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

export default withAuth(DelinquentTenantsReportPage);
