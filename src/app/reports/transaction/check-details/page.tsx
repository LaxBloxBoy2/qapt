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

interface CheckDetailEntry {
  id: string;
  check_number: string;
  date: string;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  payee: string;
  description: string;
  amount: number;
  bank_account: string;
  memo: string;
  status: 'pending' | 'cleared' | 'voided' | 'stop_payment';
  cleared_date?: string;
  type: 'income' | 'expense';
}

function CheckDetailsReportPage() {
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
  const { data: transactions } = useTransactions({
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    property_id: filters.properties.length === 1 ? filters.properties[0] : undefined,
  });

  const [checkDetails, setCheckDetails] = useState<CheckDetailEntry[]>([]);

  // Process transactions into check details format
  useEffect(() => {
    if (!transactions) return;

    // Filter for check payments only
    const checkTransactions = transactions.filter(t => 
      t.payment_method === 'check' || t.payment_method === 'Check'
    );

    const checkEntries: CheckDetailEntry[] = checkTransactions.map((transaction, index) => {
      const property = properties?.find(p => p.id === transaction.property_id);
      
      // Generate mock check details
      const checkNumber = transaction.reference_id || `CHK-${String(1000 + index).padStart(4, '0')}`;
      const bankAccount = 'Business Checking ****1234';
      
      // Determine payee based on transaction type
      let payee = 'Unknown';
      if (transaction.type === 'income') {
        payee = transaction.tenant?.first_name && transaction.tenant?.last_name 
          ? `${transaction.tenant.first_name} ${transaction.tenant.last_name}`
          : 'Tenant';
      } else {
        // For expenses, generate vendor names
        const vendors = ['ABC Maintenance', 'City Utilities', 'Property Insurance Co', 'Lawn Care Services', 'Repair Solutions'];
        payee = vendors[index % vendors.length];
      }

      // Mock check status based on transaction status
      let checkStatus: 'pending' | 'cleared' | 'voided' | 'stop_payment' = 'pending';
      let clearedDate: string | undefined;
      
      if (transaction.status === 'paid') {
        checkStatus = 'cleared';
        clearedDate = transaction.paid_date || transaction.created_at;
      } else if (transaction.status === 'cancelled') {
        checkStatus = 'voided';
      } else if (Math.random() > 0.9) {
        checkStatus = 'stop_payment';
      }

      return {
        id: transaction.id,
        check_number: checkNumber,
        date: transaction.due_date || transaction.created_at,
        property_name: property?.name || 'Unknown Property',
        unit_name: transaction.unit?.name || 'N/A',
        tenant_name: transaction.tenant?.first_name && transaction.tenant?.last_name 
          ? `${transaction.tenant.first_name} ${transaction.tenant.last_name}`
          : 'N/A',
        payee,
        description: transaction.description || 'Check payment',
        amount: transaction.amount || 0,
        bank_account: bankAccount,
        memo: transaction.description || '',
        status: checkStatus,
        cleared_date: clearedDate,
        type: transaction.type,
      };
    });

    // Apply filters
    let filteredChecks = checkEntries;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties?.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredChecks = filteredChecks.filter(check => 
        selectedPropertyNames.includes(check.property_name)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'pending') {
        filteredChecks = filteredChecks.filter(check => check.status === 'pending');
      } else if (filters.status === 'paid') {
        filteredChecks = filteredChecks.filter(check => check.status === 'cleared');
      } else if (filters.status === 'cancelled') {
        filteredChecks = filteredChecks.filter(check => check.status === 'voided');
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredChecks = filteredChecks.filter(check => 
        check.property_name.toLowerCase().includes(searchLower) ||
        check.check_number.toLowerCase().includes(searchLower) ||
        check.payee.toLowerCase().includes(searchLower) ||
        check.description.toLowerCase().includes(searchLower) ||
        check.memo.toLowerCase().includes(searchLower)
      );
    }

    // Sort by check number (most recent first)
    filteredChecks.sort((a, b) => b.check_number.localeCompare(a.check_number));

    setCheckDetails(filteredChecks);
  }, [transactions, properties, filters]);

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
    console.log(`Exporting check details as ${format}`);
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
      case 'cleared':
        return <Badge className="bg-green-500">Cleared</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'voided':
        return <Badge className="bg-red-500">Voided</Badge>;
      case 'stop_payment':
        return <Badge className="bg-orange-500">Stop Payment</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? 
      <i className="ri-arrow-down-line text-green-500" /> :
      <i className="ri-arrow-up-line text-red-500" />;
  };

  // Calculate statistics
  const stats = {
    total: checkDetails.length,
    pending: checkDetails.filter(c => c.status === 'pending').length,
    cleared: checkDetails.filter(c => c.status === 'cleared').length,
    voided: checkDetails.filter(c => c.status === 'voided').length,
    totalAmount: checkDetails.reduce((sum, c) => sum + c.amount, 0),
    totalIncome: checkDetails.filter(c => c.type === 'income').reduce((sum, c) => sum + c.amount, 0),
    totalExpenses: checkDetails.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.amount, 0),
  };

  const getDateRangeText = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
    } else if (filters.dateFrom) {
      return `From ${formatDate(filters.dateFrom)}`;
    } else if (filters.dateTo) {
      return `Until ${formatDate(filters.dateTo)}`;
    }
    return 'All Time';
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
                onClick={() => router.push("/reports/transaction")}
                className="text-gray-600 hover:text-gray-900"
              >
                Transaction
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Check Details</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check Details Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed check register with payees and clearing status ({getDateRangeText()})
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Checks</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-file-paper-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <i className="ri-time-line text-2xl text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cleared</p>
                      <p className="text-2xl font-bold text-green-600">{stats.cleared}</p>
                      <p className="text-xs text-gray-500">
                        {stats.total > 0 ? Math.round((stats.cleared / stats.total) * 100) : 0}%
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalAmount)}</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Check Details Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Check Register</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading check details...</span>
                  </div>
                ) : checkDetails.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-file-paper-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No check transactions found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Check #</th>
                          <th className="text-left p-2 text-sm font-medium">Date</th>
                          <th className="text-left p-2 text-sm font-medium">Property</th>
                          <th className="text-left p-2 text-sm font-medium">Payee</th>
                          <th className="text-left p-2 text-sm font-medium">Description</th>
                          <th className="text-left p-2 text-sm font-medium">Memo</th>
                          <th className="text-center p-2 text-sm font-medium">Type</th>
                          <th className="text-right p-2 text-sm font-medium">Amount</th>
                          <th className="text-left p-2 text-sm font-medium">Cleared Date</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkDetails.map((check) => (
                          <tr key={check.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-mono text-sm font-medium">{check.check_number}</td>
                            <td className="p-2 text-sm">{formatDate(check.date)}</td>
                            <td className="p-2 text-sm">{check.property_name}</td>
                            <td className="p-2 text-sm font-medium">{check.payee}</td>
                            <td className="p-2 text-sm">{check.description}</td>
                            <td className="p-2 text-sm text-gray-600">{check.memo}</td>
                            <td className="p-2 text-center">{getTypeIcon(check.type)}</td>
                            <td className="p-2 text-right font-medium text-sm">
                              <span className={check.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                {check.type === 'income' ? '+' : '-'}{formatCurrency(check.amount)}
                              </span>
                            </td>
                            <td className="p-2 text-sm">
                              {check.cleared_date ? formatDate(check.cleared_date) : '-'}
                            </td>
                            <td className="p-2 text-center">{getStatusBadge(check.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-2 text-sm" colSpan={7}>TOTALS ({stats.total} checks)</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalAmount)}</td>
                          <td className="p-2" colSpan={2}></td>
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

export default withAuth(CheckDetailsReportPage);
