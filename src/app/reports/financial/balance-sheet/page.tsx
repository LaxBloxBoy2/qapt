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

interface BalanceSheetData {
  assets: {
    current_assets: {
      cash: number;
      accounts_receivable: number;
      security_deposits: number;
      total_current_assets: number;
    };
    fixed_assets: {
      property_value: number;
      equipment: number;
      total_fixed_assets: number;
    };
    total_assets: number;
  };
  liabilities: {
    current_liabilities: {
      accounts_payable: number;
      tenant_deposits: number;
      accrued_expenses: number;
      total_current_liabilities: number;
    };
    long_term_liabilities: {
      mortgages: number;
      loans: number;
      total_long_term_liabilities: number;
    };
    total_liabilities: number;
  };
  equity: {
    owner_equity: number;
    retained_earnings: number;
    total_equity: number;
  };
}

function BalanceSheetReportPage() {
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
  });

  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData>({
    assets: {
      current_assets: {
        cash: 0,
        accounts_receivable: 0,
        security_deposits: 0,
        total_current_assets: 0,
      },
      fixed_assets: {
        property_value: 0,
        equipment: 0,
        total_fixed_assets: 0,
      },
      total_assets: 0,
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: 0,
        tenant_deposits: 0,
        accrued_expenses: 0,
        total_current_liabilities: 0,
      },
      long_term_liabilities: {
        mortgages: 0,
        loans: 0,
        total_long_term_liabilities: 0,
      },
      total_liabilities: 0,
    },
    equity: {
      owner_equity: 0,
      retained_earnings: 0,
      total_equity: 0,
    },
  });

  // Process transactions into balance sheet format
  useEffect(() => {
    if (!transactions || !properties) return;

    let filteredTransactions = transactions;

    // Apply property filter
    if (filters.properties.length > 0) {
      filteredTransactions = filteredTransactions.filter(t => 
        filters.properties.includes(t.property_id || '')
      );
    }

    // Calculate cash (net of all transactions)
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const cash = totalIncome - totalExpenses;

    // Calculate accounts receivable (pending income)
    const accounts_receivable = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Mock data for other balance sheet items (in a real app, these would come from other sources)
    const security_deposits = 25000; // Mock security deposits held
    const property_value = properties.reduce((sum, p) => sum + (p.purchase_price || 500000), 0);
    const equipment = 15000; // Mock equipment value
    
    const accounts_payable = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const tenant_deposits = security_deposits; // Same as security deposits but from liability perspective
    const accrued_expenses = 5000; // Mock accrued expenses
    const mortgages = property_value * 0.7; // Assume 70% LTV
    const loans = 50000; // Mock other loans
    
    // Calculate totals
    const total_current_assets = cash + accounts_receivable + security_deposits;
    const total_fixed_assets = property_value + equipment;
    const total_assets = total_current_assets + total_fixed_assets;
    
    const total_current_liabilities = accounts_payable + tenant_deposits + accrued_expenses;
    const total_long_term_liabilities = mortgages + loans;
    const total_liabilities = total_current_liabilities + total_long_term_liabilities;
    
    const retained_earnings = totalIncome - totalExpenses; // Net income to date
    const owner_equity = total_assets - total_liabilities - retained_earnings;
    const total_equity = owner_equity + retained_earnings;

    setBalanceSheet({
      assets: {
        current_assets: {
          cash,
          accounts_receivable,
          security_deposits,
          total_current_assets,
        },
        fixed_assets: {
          property_value,
          equipment,
          total_fixed_assets,
        },
        total_assets,
      },
      liabilities: {
        current_liabilities: {
          accounts_payable,
          tenant_deposits,
          accrued_expenses,
          total_current_liabilities,
        },
        long_term_liabilities: {
          mortgages,
          loans,
          total_long_term_liabilities,
        },
        total_liabilities,
      },
      equity: {
        owner_equity,
        retained_earnings,
        total_equity,
      },
    });
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
    console.log(`Exporting balance sheet as ${format}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
              <span className="text-gray-600">Balance Sheet</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Balance Sheet</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Assets, liabilities, and equity by property as of a specific date
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
              showStatusFilter={false}
            />
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Report Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="text-xl font-bold">Balance Sheet</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    As of {asOfDate}
                  </div>
                  {filters.properties.length === 1 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                      Property: {availableProperties.find(p => p.id === filters.properties[0])?.name}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Balance Sheet */}
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Generating report...</span>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Assets Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400">ASSETS</h3>
                      
                      {/* Current Assets */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-300">Current Assets</h4>
                        <div className="space-y-2 ml-4">
                          <div className="flex justify-between py-1">
                            <span>Cash</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.assets.current_assets.cash)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Accounts Receivable</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.assets.current_assets.accounts_receivable)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Security Deposits</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.assets.current_assets.security_deposits)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-blue-200 dark:border-blue-800 font-semibold">
                            <span>Total Current Assets</span>
                            <span>{formatCurrency(balanceSheet.assets.current_assets.total_current_assets)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fixed Assets */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-300">Fixed Assets</h4>
                        <div className="space-y-2 ml-4">
                          <div className="flex justify-between py-1">
                            <span>Property Value</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.assets.fixed_assets.property_value)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Equipment</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.assets.fixed_assets.equipment)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-blue-200 dark:border-blue-800 font-semibold">
                            <span>Total Fixed Assets</span>
                            <span>{formatCurrency(balanceSheet.assets.fixed_assets.total_fixed_assets)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between py-3 border-t-2 border-blue-300 dark:border-blue-700 font-bold text-blue-700 dark:text-blue-400">
                        <span>TOTAL ASSETS</span>
                        <span>{formatCurrency(balanceSheet.assets.total_assets)}</span>
                      </div>
                    </div>

                    {/* Liabilities Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-red-700 dark:text-red-400">LIABILITIES</h3>
                      
                      {/* Current Liabilities */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-3 text-red-600 dark:text-red-300">Current Liabilities</h4>
                        <div className="space-y-2 ml-4">
                          <div className="flex justify-between py-1">
                            <span>Accounts Payable</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.liabilities.current_liabilities.accounts_payable)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Tenant Deposits</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.liabilities.current_liabilities.tenant_deposits)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Accrued Expenses</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.liabilities.current_liabilities.accrued_expenses)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-red-200 dark:border-red-800 font-semibold">
                            <span>Total Current Liabilities</span>
                            <span>{formatCurrency(balanceSheet.liabilities.current_liabilities.total_current_liabilities)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Long-term Liabilities */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-3 text-red-600 dark:text-red-300">Long-term Liabilities</h4>
                        <div className="space-y-2 ml-4">
                          <div className="flex justify-between py-1">
                            <span>Mortgages</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.liabilities.long_term_liabilities.mortgages)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Other Loans</span>
                            <span className="font-medium">{formatCurrency(balanceSheet.liabilities.long_term_liabilities.loans)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-red-200 dark:border-red-800 font-semibold">
                            <span>Total Long-term Liabilities</span>
                            <span>{formatCurrency(balanceSheet.liabilities.long_term_liabilities.total_long_term_liabilities)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between py-3 border-t-2 border-red-300 dark:border-red-700 font-bold text-red-700 dark:text-red-400">
                        <span>TOTAL LIABILITIES</span>
                        <span>{formatCurrency(balanceSheet.liabilities.total_liabilities)}</span>
                      </div>
                    </div>

                    {/* Equity Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-green-700 dark:text-green-400">EQUITY</h3>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between py-1">
                          <span>Owner Equity</span>
                          <span className="font-medium">{formatCurrency(balanceSheet.equity.owner_equity)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Retained Earnings</span>
                          <span className="font-medium">{formatCurrency(balanceSheet.equity.retained_earnings)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-green-300 dark:border-green-700 font-bold text-green-700 dark:text-green-400">
                          <span>TOTAL EQUITY</span>
                          <span>{formatCurrency(balanceSheet.equity.total_equity)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Check */}
                    <div className="border-t-4 border-gray-400 dark:border-gray-600 pt-4">
                      <div className="flex justify-between py-4 text-xl font-bold">
                        <span>TOTAL LIABILITIES + EQUITY</span>
                        <span>{formatCurrency(balanceSheet.liabilities.total_liabilities + balanceSheet.equity.total_equity)}</span>
                      </div>
                    </div>
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

export default withAuth(BalanceSheetReportPage);
