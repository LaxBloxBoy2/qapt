"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface FinancialReport {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
}

function FinancialReportsPage() {
  const router = useRouter();

  const financialReports: FinancialReport[] = [
    {
      id: "accounts-receivable",
      title: "Accounts Receivable Summary",
      description: "Summary of all transactions affecting the Accounts Receivable balance as of a specific date.",
      href: "/reports/financial/accounts-receivable",
      icon: "ri-money-dollar-circle-line",
      category: "Receivables",
      isPopular: true
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Assets, liabilities, and equity by property as of a specific date. Available consolidated or by fund type.",
      href: "/reports/financial/balance-sheet",
      icon: "ri-scales-line",
      category: "Statements"
    },
    {
      id: "budget-vs-actual",
      title: "Budget vs. Actual",
      description: "Compare budgeted amounts to actual income and expenses.",
      href: "/reports/financial/budget-vs-actual",
      icon: "ri-bar-chart-line",
      category: "Analysis",
      isPopular: true
    },
    {
      id: "cash-flow",
      title: "Cash Flow Statement",
      description: "Changes in cash by property during a specified time frame. Available consolidated.",
      href: "/reports/financial/cash-flow",
      icon: "ri-exchange-funds-line",
      category: "Statements"
    },
    {
      id: "general-ledger",
      title: "General Ledger",
      description: "Debit and credit transactions by property during a specified time frame. Available consolidated.",
      href: "/reports/financial/general-ledger",
      icon: "ri-book-line",
      category: "Ledgers"
    },
    {
      id: "income-statement",
      title: "Income Statement",
      description: "Income and expenses by property during a specified time frame. Available consolidated, detailed, or by unit.",
      href: "/reports/financial/income-statement",
      icon: "ri-line-chart-line",
      category: "Statements",
      isPopular: true
    },
    {
      id: "management-income",
      title: "Management Income",
      description: "Income and expenses paid to the management company by property during a specified time frame.",
      href: "/reports/financial/management-income",
      icon: "ri-building-2-line",
      category: "Management"
    },
    {
      id: "property-statement",
      title: "Property Statement",
      description: "Beginning and ending cash balances by property during a specified time frame.",
      href: "/reports/financial/property-statement",
      icon: "ri-home-line",
      category: "Property"
    },
    {
      id: "rental-owner-balances",
      title: "Rental Owner Ending Balances",
      description: "Rental owners' ending asset balances, including property reserves and held liabilities by property as of a specific date.",
      href: "/reports/financial/rental-owner-balances",
      icon: "ri-user-line",
      category: "Owners"
    },
    {
      id: "rental-owner-statement",
      title: "Rental Owner Statement",
      description: "Rental owners' beginning and ending cash balances by property during a specified time frame.",
      href: "/reports/financial/rental-owner-statement",
      icon: "ri-user-settings-line",
      category: "Owners"
    },
    {
      id: "trial-balance",
      title: "Trial Balance",
      description: "Debit or credit balance by account during a specified time frame. Available consolidated.",
      href: "/reports/financial/trial-balance",
      icon: "ri-calculator-line",
      category: "Ledgers"
    },
    {
      id: "vendor-ledger",
      title: "Vendor Ledger",
      description: "Bills and payments charged to specific vendors during a specified time frame.",
      href: "/reports/financial/vendor-ledger",
      icon: "ri-truck-line",
      category: "Vendors"
    }
  ];

  const categories = Array.from(new Set(financialReports.map(report => report.category)));

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredReports = selectedCategory === "all" 
    ? financialReports 
    : financialReports.filter(report => report.category === selectedCategory);

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
              <span className="text-gray-600">Financial</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive financial reporting for your property management business
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All Reports ({financialReports.length})
          </Button>
          {categories.map((category) => {
            const count = financialReports.filter(report => report.category === category).length;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </Button>
            );
          })}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                      <i className={`${report.icon} text-lg`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {report.category}
                        </Badge>
                        {report.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {report.isNew && (
                          <Badge className="text-xs bg-blue-500">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {report.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => router.push(report.href)}
                >
                  Generate Report
                  <i className="ri-arrow-right-line ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start">
                <i className="ri-download-line mr-2" />
                Export All Financial Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Monthly Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-pie-chart-line mr-2" />
                Financial Dashboard
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-settings-3-line mr-2" />
                Report Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Financial Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financialReports.filter(report => report.isPopular).map((report) => (
                <Button
                  key={report.id}
                  variant="ghost"
                  className="h-auto p-4 justify-start"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${report.icon} text-lg text-green-600`} />
                    <div className="text-left">
                      <div className="font-medium">{report.title}</div>
                      <div className="text-xs text-gray-600">{report.category}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withAuth(FinancialReportsPage);
