"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ReportFilters, type ReportFilters as ReportFiltersType } from "@/components/reports/ReportFilters";
import { useTransactions, useFinancialSummary } from "@/hooks/useFinances";
import { useGetProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";

interface IncomeStatementData {
  income: {
    rental_income: number;
    other_income: number;
    total_income: number;
  };
  expenses: {
    maintenance: number;
    utilities: number;
    insurance: number;
    property_management: number;
    other_expenses: number;
    total_expenses: number;
  };
  net_income: number;
}

function IncomeStatementReportPage() {
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
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    property_id: filters.properties.length === 1 ? filters.properties[0] : undefined,
  });

  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData>({
    income: {
      rental_income: 0,
      other_income: 0,
      total_income: 0,
    },
    expenses: {
      maintenance: 0,
      utilities: 0,
      insurance: 0,
      property_management: 0,
      other_expenses: 0,
      total_expenses: 0,
    },
    net_income: 0,
  });

  // Process transactions into income statement format
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
        t.category?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate income
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
    const rental_income = incomeTransactions
      .filter(t => t.category?.name?.toLowerCase().includes('rent') || t.subtype === 'payment')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const other_income = incomeTransactions
      .filter(t => !t.category?.name?.toLowerCase().includes('rent') && t.subtype !== 'payment')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const total_income = rental_income + other_income;

    // Calculate expenses
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    const maintenance = expenseTransactions
      .filter(t => t.category?.name?.toLowerCase().includes('maintenance') || 
                   t.category?.name?.toLowerCase().includes('repair'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const utilities = expenseTransactions
      .filter(t => t.category?.name?.toLowerCase().includes('utility') || 
                   t.category?.name?.toLowerCase().includes('electric') ||
                   t.category?.name?.toLowerCase().includes('water') ||
                   t.category?.name?.toLowerCase().includes('gas'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const insurance = expenseTransactions
      .filter(t => t.category?.name?.toLowerCase().includes('insurance'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const property_management = expenseTransactions
      .filter(t => t.category?.name?.toLowerCase().includes('management') || 
                   t.category?.name?.toLowerCase().includes('admin'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const other_expenses = expenseTransactions
      .filter(t => {
        const categoryName = t.category?.name?.toLowerCase() || '';
        return !categoryName.includes('maintenance') && 
               !categoryName.includes('repair') &&
               !categoryName.includes('utility') &&
               !categoryName.includes('electric') &&
               !categoryName.includes('water') &&
               !categoryName.includes('gas') &&
               !categoryName.includes('insurance') &&
               !categoryName.includes('management') &&
               !categoryName.includes('admin');
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const total_expenses = maintenance + utilities + insurance + property_management + other_expenses;
    const net_income = total_income - total_expenses;

    setIncomeStatement({
      income: {
        rental_income,
        other_income,
        total_income,
      },
      expenses: {
        maintenance,
        utilities,
        insurance,
        property_management,
        other_expenses,
        total_expenses,
      },
      net_income,
    });
  }, [transactions, filters]);

  const availableProperties = properties?.map(p => ({ id: p.id, name: p.name })) || [];

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  const handleRunReport = () => {
    setIsLoading(true);
    // Simulate processing time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting income statement as ${format}`);
    // Implement export functionality
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDateRangeText = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}`;
    } else if (filters.dateFrom) {
      return `From ${new Date(filters.dateFrom).toLocaleDateString()}`;
    } else if (filters.dateTo) {
      return `Until ${new Date(filters.dateTo).toLocaleDateString()}`;
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
                onClick={() => router.push("/reports/financial")}
                className="text-gray-600 hover:text-gray-900"
              >
                Financial
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Income Statement</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Income Statement</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Income and expenses by property during a specified time frame
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
              showStatusFilter={false}
            />
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Report Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="text-xl font-bold">Income Statement</div>
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

            {/* Income Statement */}
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Generating report...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Income Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-green-700 dark:text-green-400">INCOME</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Rental Income</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.income.rental_income)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Other Income</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.income.other_income)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-green-200 dark:border-green-800 font-bold text-green-700 dark:text-green-400">
                          <span>Total Income</span>
                          <span>{formatCurrency(incomeStatement.income.total_income)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-red-700 dark:text-red-400">EXPENSES</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Maintenance & Repairs</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.expenses.maintenance)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Utilities</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.expenses.utilities)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Insurance</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.expenses.insurance)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Property Management</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.expenses.property_management)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span>Other Expenses</span>
                          <span className="font-medium">{formatCurrency(incomeStatement.expenses.other_expenses)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-red-200 dark:border-red-800 font-bold text-red-700 dark:text-red-400">
                          <span>Total Expenses</span>
                          <span>{formatCurrency(incomeStatement.expenses.total_expenses)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Income */}
                    <div className="border-t-4 border-gray-300 dark:border-gray-600 pt-4">
                      <div className={`flex justify-between py-4 text-xl font-bold ${
                        incomeStatement.net_income >= 0 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        <span>NET INCOME</span>
                        <span>{formatCurrency(incomeStatement.net_income)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(incomeStatement.income.total_income)}</p>
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
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(incomeStatement.expenses.total_expenses)}</p>
                    </div>
                    <i className="ri-arrow-down-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net Income</p>
                      <p className={`text-2xl font-bold ${
                        incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(incomeStatement.net_income)}
                      </p>
                    </div>
                    <i className={`text-2xl ${
                      incomeStatement.net_income >= 0 
                        ? 'ri-trending-up-line text-green-500' 
                        : 'ri-trending-down-line text-red-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(IncomeStatementReportPage);
