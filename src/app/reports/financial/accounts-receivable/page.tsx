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

interface AccountsReceivableEntry {
  id: string;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  description: string;
  original_amount: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  aging_category: '0-30' | '31-60' | '61-90' | '90+';
  status: 'current' | 'overdue';
}

function AccountsReceivableReportPage() {
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
    status: 'pending', // Only pending transactions for AR
  });

  const [arData, setArData] = useState<AccountsReceivableEntry[]>([]);

  // Process transactions into accounts receivable format
  useEffect(() => {
    if (!transactions) return;

    const currentDate = new Date();
    
    let filteredTransactions = transactions.filter(t => 
      t.type === 'income' && t.status === 'pending'
    );

    // Apply property filter
    if (filters.properties.length > 0) {
      filteredTransactions = filteredTransactions.filter(t => 
        filters.properties.includes(t.property_id || '')
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.property?.name?.toLowerCase().includes(searchLower)
      );
    }

    const processedData: AccountsReceivableEntry[] = filteredTransactions.map(transaction => {
      const dueDate = new Date(transaction.due_date || transaction.created_at);
      const timeDiff = currentDate.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      let agingCategory: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOverdue <= 30) {
        agingCategory = '0-30';
      } else if (daysOverdue <= 60) {
        agingCategory = '31-60';
      } else if (daysOverdue <= 90) {
        agingCategory = '61-90';
      } else {
        agingCategory = '90+';
      }

      const status: 'current' | 'overdue' = daysOverdue <= 0 ? 'current' : 'overdue';

      return {
        id: transaction.id,
        property_name: transaction.property?.name || 'Unknown Property',
        unit_name: transaction.unit?.name || 'N/A',
        tenant_name: transaction.tenant?.first_name && transaction.tenant?.last_name 
          ? `${transaction.tenant.first_name} ${transaction.tenant.last_name}`
          : 'Unknown Tenant',
        description: transaction.description || 'No description',
        original_amount: transaction.amount || 0,
        amount_due: transaction.amount || 0, // In a real system, this might be different if partial payments were made
        due_date: transaction.due_date || transaction.created_at,
        days_overdue: Math.max(0, daysOverdue),
        aging_category: agingCategory,
        status,
      };
    });

    // Apply status filter
    let finalData = processedData;
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        finalData = processedData.filter(item => item.status === 'overdue');
      } else if (filters.status === 'active') {
        finalData = processedData.filter(item => item.status === 'current');
      }
    }

    setArData(finalData);
  }, [transactions, filters]);

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
    console.log(`Exporting accounts receivable as ${format}`);
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
      case 'current':
        return <Badge className="bg-green-500">Current</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAgingBadge = (category: string) => {
    switch (category) {
      case '0-30':
        return <Badge className="bg-green-500">0-30 days</Badge>;
      case '31-60':
        return <Badge className="bg-yellow-500">31-60 days</Badge>;
      case '61-90':
        return <Badge className="bg-orange-500">61-90 days</Badge>;
      case '90+':
        return <Badge className="bg-red-500">90+ days</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  // Calculate totals and aging summary
  const totals = arData.reduce((acc, item) => {
    acc.total += item.amount_due;
    acc[item.aging_category] += item.amount_due;
    if (item.status === 'current') acc.current += item.amount_due;
    if (item.status === 'overdue') acc.overdue += item.amount_due;
    return acc;
  }, {
    total: 0,
    current: 0,
    overdue: 0,
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  });

  const asOfDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
                onClick={() => router.push("/reports/financial")}
                className="text-gray-600 hover:text-gray-900"
              >
                Financial
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Accounts Receivable</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts Receivable Summary</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Summary of all transactions affecting the Accounts Receivable balance as of {asOfDate}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total A/R</p>
                      <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.current)}</p>
                      <p className="text-xs text-gray-500">
                        {totals.total > 0 ? Math.round((totals.current / totals.total) * 100) : 0}%
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</p>
                      <p className="text-xs text-gray-500">
                        {totals.total > 0 ? Math.round((totals.overdue / totals.total) * 100) : 0}%
                      </p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Accounts</p>
                      <p className="text-2xl font-bold">{arData.length}</p>
                      <p className="text-xs text-gray-500">Outstanding</p>
                    </div>
                    <i className="ri-file-list-line text-2xl text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aging Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Aging Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">0-30 Days</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totals['0-30'])}</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">31-60 Days</div>
                    <div className="text-xl font-bold text-yellow-600">{formatCurrency(totals['31-60'])}</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">61-90 Days</div>
                    <div className="text-xl font-bold text-orange-600">{formatCurrency(totals['61-90'])}</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">90+ Days</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(totals['90+'])}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accounts Receivable Table */}
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading accounts receivable...</span>
                  </div>
                ) : arData.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-money-dollar-circle-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No outstanding receivables found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Property</th>
                          <th className="text-left p-3">Unit</th>
                          <th className="text-left p-3">Tenant</th>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">Due Date</th>
                          <th className="text-right p-3">Amount Due</th>
                          <th className="text-center p-3">Days Overdue</th>
                          <th className="text-center p-3">Aging</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {arData.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3 font-medium">{item.property_name}</td>
                            <td className="p-3">{item.unit_name}</td>
                            <td className="p-3">{item.tenant_name}</td>
                            <td className="p-3">{item.description}</td>
                            <td className="p-3">{formatDate(item.due_date)}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(item.amount_due)}</td>
                            <td className="p-3 text-center">
                              {item.days_overdue > 0 ? (
                                <span className="text-red-600 font-medium">{item.days_overdue}</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">{getAgingBadge(item.aging_category)}</td>
                            <td className="p-3 text-center">{getStatusBadge(item.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-3" colSpan={5}>TOTAL</td>
                          <td className="p-3 text-right">{formatCurrency(totals.total)}</td>
                          <td className="p-3" colSpan={3}></td>
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

export default withAuth(AccountsReceivableReportPage);
