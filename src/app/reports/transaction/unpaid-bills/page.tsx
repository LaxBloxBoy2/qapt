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

interface UnpaidBillEntry {
  id: string;
  property_name: string;
  unit_name: string;
  vendor: string;
  description: string;
  bill_date: string;
  due_date: string;
  amount: number;
  category: string;
  days_overdue: number;
  aging_category: '0-30' | '31-60' | '61-90' | '90+';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'overdue';
  reference_number: string;
}

function UnpaidBillsReportPage() {
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
    property_id: filters.properties.length === 1 ? filters.properties[0] : undefined,
    type: 'expense',
    status: 'pending' as any, // Only pending expense transactions
  });

  const [unpaidBills, setUnpaidBills] = useState<UnpaidBillEntry[]>([]);

  // Process transactions into unpaid bills format
  useEffect(() => {
    if (!transactions) return;

    const currentDate = new Date();
    
    // Filter for unpaid expense transactions
    let filteredTransactions = transactions.filter(t => 
      t.type === 'expense' && (t.status === 'pending' || t.status === 'overdue')
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
        t.property?.name?.toLowerCase().includes(searchLower) ||
        t.category?.name?.toLowerCase().includes(searchLower) ||
        t.reference_id?.toLowerCase().includes(searchLower)
      );
    }

    const billEntries: UnpaidBillEntry[] = filteredTransactions.map((transaction, index) => {
      const property = properties?.find(p => p.id === transaction.property_id);
      const dueDate = new Date(transaction.due_date || transaction.created_at);
      const timeDiff = currentDate.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      // Determine aging category
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

      // Determine priority based on amount and days overdue
      let priority: 'low' | 'medium' | 'high' = 'low';
      const amount = transaction.amount || 0;
      if (daysOverdue > 30 || amount > 1000) {
        priority = 'high';
      } else if (daysOverdue > 7 || amount > 500) {
        priority = 'medium';
      }

      const status: 'pending' | 'overdue' = daysOverdue > 0 ? 'overdue' : 'pending';

      // Generate vendor names based on category
      const categoryName = transaction.category?.name || 'General';
      const vendors: Record<string, string[]> = {
        'Maintenance': ['ABC Repair Services', 'Quick Fix Solutions', 'Property Maintenance Co'],
        'Utilities': ['City Electric', 'Metro Water', 'Gas Company'],
        'Insurance': ['Property Insurance Co', 'Liability Insurance Inc'],
        'Landscaping': ['Green Lawn Services', 'Garden Care Pro'],
        'General': ['Various Vendors', 'Service Provider'],
      };
      
      const vendorList = vendors[categoryName] || vendors['General'];
      const vendor = vendorList[index % vendorList.length];

      return {
        id: transaction.id,
        property_name: property?.name || 'Unknown Property',
        unit_name: transaction.unit?.name || 'Common Area',
        vendor,
        description: transaction.description || 'Unpaid bill',
        bill_date: transaction.created_at,
        due_date: transaction.due_date || transaction.created_at,
        amount: amount,
        category: categoryName,
        days_overdue: Math.max(0, daysOverdue),
        aging_category: agingCategory,
        priority,
        status,
        reference_number: transaction.reference_id || `INV-${String(1000 + index).padStart(4, '0')}`,
      };
    });

    // Apply status filter
    let finalBills = billEntries;
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        finalBills = billEntries.filter(bill => bill.status === 'overdue');
      } else if (filters.status === 'pending') {
        finalBills = billEntries.filter(bill => bill.status === 'pending');
      }
    }

    // Sort by days overdue (most overdue first), then by amount (highest first)
    finalBills.sort((a, b) => {
      if (a.days_overdue !== b.days_overdue) {
        return b.days_overdue - a.days_overdue;
      }
      return b.amount - a.amount;
    });

    setUnpaidBills(finalBills);
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
    console.log(`Exporting unpaid bills as ${format}`);
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
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
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

  // Calculate statistics
  const totals = unpaidBills.reduce((acc, bill) => {
    acc.total += bill.amount;
    acc[bill.aging_category] += bill.amount;
    if (bill.status === 'pending') acc.pending += bill.amount;
    if (bill.status === 'overdue') acc.overdue += bill.amount;
    if (bill.priority === 'high') acc.high += bill.amount;
    return acc;
  }, {
    total: 0,
    pending: 0,
    overdue: 0,
    high: 0,
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  });

  const stats = {
    total: unpaidBills.length,
    pending: unpaidBills.filter(b => b.status === 'pending').length,
    overdue: unpaidBills.filter(b => b.status === 'overdue').length,
    highPriority: unpaidBills.filter(b => b.priority === 'high').length,
    totalAmount: totals.total,
    overdueAmount: totals.overdue,
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
              <span className="text-gray-600">Unpaid Bills</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unpaid Bills Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Outstanding bills and expenses by vendor with aging analysis
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Bills</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-file-list-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
                    </div>
                    <i className="ri-error-warning-line text-2xl text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalAmount)}</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aging Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Aging Summary</CardTitle>
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

            {/* Unpaid Bills Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Outstanding Bills</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading unpaid bills...</span>
                  </div>
                ) : unpaidBills.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-check-double-line text-4xl text-green-400 mb-2 block" />
                    <p className="text-gray-600">No unpaid bills found. All bills are current!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Property</th>
                          <th className="text-left p-2 text-sm font-medium">Vendor</th>
                          <th className="text-left p-2 text-sm font-medium">Description</th>
                          <th className="text-left p-2 text-sm font-medium">Category</th>
                          <th className="text-left p-2 text-sm font-medium">Bill Date</th>
                          <th className="text-left p-2 text-sm font-medium">Due Date</th>
                          <th className="text-right p-2 text-sm font-medium">Amount</th>
                          <th className="text-center p-2 text-sm font-medium">Days Overdue</th>
                          <th className="text-center p-2 text-sm font-medium">Aging</th>
                          <th className="text-center p-2 text-sm font-medium">Priority</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unpaidBills.map((bill) => (
                          <tr key={bill.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium text-sm">{bill.property_name}</td>
                            <td className="p-2 text-sm">{bill.vendor}</td>
                            <td className="p-2 text-sm">{bill.description}</td>
                            <td className="p-2 text-sm">
                              <Badge variant="outline">{bill.category}</Badge>
                            </td>
                            <td className="p-2 text-sm">{formatDate(bill.bill_date)}</td>
                            <td className="p-2 text-sm">{formatDate(bill.due_date)}</td>
                            <td className="p-2 text-right font-medium text-sm">{formatCurrency(bill.amount)}</td>
                            <td className="p-2 text-center text-sm">
                              {bill.days_overdue > 0 ? (
                                <span className="text-red-600 font-medium">{bill.days_overdue}</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">{getAgingBadge(bill.aging_category)}</td>
                            <td className="p-2 text-center">{getPriorityBadge(bill.priority)}</td>
                            <td className="p-2 text-center">{getStatusBadge(bill.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-2 text-sm" colSpan={6}>TOTAL ({stats.total} bills)</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalAmount)}</td>
                          <td className="p-2" colSpan={4}></td>
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

export default withAuth(UnpaidBillsReportPage);
