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

interface BankTransactionEntry {
  id: string;
  date: string;
  description: string;
  property_name: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  payment_method: string;
  reference_id: string;
  status: string;
  running_balance: number;
}

function BankTransactionsReportPage() {
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
    status: filters.status !== 'all' ? filters.status as 'pending' | 'paid' | 'overdue' | 'cancelled' : undefined,
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransactionEntry[]>([]);

  // Process transactions data
  useEffect(() => {
    if (!transactions) return;

    let filteredTransactions = transactions;

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

    // Sort by date (most recent first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.due_date || a.created_at);
      const dateB = new Date(b.due_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Calculate running balance
    let runningBalance = 0;
    const processedTransactions: BankTransactionEntry[] = sortedTransactions.reverse().map(transaction => {
      const amount = transaction.amount || 0;
      if (transaction.type === 'income') {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      return {
        id: transaction.id,
        date: transaction.due_date || transaction.created_at,
        description: transaction.description || 'No description',
        property_name: transaction.property?.name || 'No property',
        category: transaction.category?.name || 'Uncategorized',
        type: transaction.type,
        amount: amount,
        payment_method: transaction.payment_method || 'Not specified',
        reference_id: transaction.reference_id || '',
        status: transaction.status,
        running_balance: runningBalance,
      };
    });

    // Reverse again to show most recent first
    setBankTransactions(processedTransactions.reverse());
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
    console.log(`Exporting bank transactions as ${format}`);
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
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'ri-money-dollar-circle-line';
      case 'check':
        return 'ri-file-paper-line';
      case 'credit card':
        return 'ri-bank-card-line';
      case 'bank transfer':
        return 'ri-exchange-line';
      case 'online':
        return 'ri-smartphone-line';
      default:
        return 'ri-question-line';
    }
  };

  // Calculate totals
  const totals = bankTransactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.totalIncome += transaction.amount;
    } else {
      acc.totalExpenses += transaction.amount;
    }
    return acc;
  }, { totalIncome: 0, totalExpenses: 0 });

  const netAmount = totals.totalIncome - totals.totalExpenses;
  const finalBalance = bankTransactions.length > 0 ? bankTransactions[0].running_balance : 0;

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
              <span className="text-gray-600">Bank Transactions</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Transactions Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed transaction history by property during a specified time frame
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
            {/* Report Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="text-xl font-bold">Bank Transaction History</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    Period: {getDateRangeText()}
                  </div>
                  {filters.properties.length === 1 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                      Property: {availableProperties.find(p => p.id === filters.properties[0])?.name}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalIncome)}</p>
                    </div>
                    <i className="ri-arrow-up-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
                    </div>
                    <i className="ri-arrow-down-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net Amount</p>
                      <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netAmount)}
                      </p>
                    </div>
                    <i className={`text-2xl ${netAmount >= 0 ? 'ri-trending-up-line text-green-500' : 'ri-trending-down-line text-red-500'}`} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                      <p className="text-2xl font-bold">{bankTransactions.length}</p>
                    </div>
                    <i className="ri-exchange-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading transactions...</span>
                  </div>
                ) : bankTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-exchange-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No transactions found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Date</th>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">Property</th>
                          <th className="text-left p-3">Category</th>
                          <th className="text-left p-3">Payment Method</th>
                          <th className="text-right p-3">Amount</th>
                          <th className="text-right p-3">Balance</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3">{formatDate(transaction.date)}</td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                {transaction.reference_id && (
                                  <div className="text-xs text-gray-500">Ref: {transaction.reference_id}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">{transaction.property_name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{transaction.category}</Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <i className={`${getPaymentMethodIcon(transaction.payment_method)} text-gray-500`} />
                                <span>{transaction.payment_method}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <span className={`font-medium ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(transaction.running_balance)}
                            </td>
                            <td className="p-3 text-center">{getStatusBadge(transaction.status)}</td>
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

export default withAuth(BankTransactionsReportPage);
