"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  reports: {
    id: string;
    title: string;
    description: string;
    href: string;
    isNew?: boolean;
  }[];
}

function ReportsPage() {
  const router = useRouter();

  const reportCategories: ReportCategory[] = [
    {
      id: "financial",
      title: "Financial",
      description: "Financial reports including income statements, balance sheets, and cash flow",
      icon: "ri-money-dollar-circle-line",
      color: "bg-green-500",
      reports: [
        {
          id: "accounts-receivable",
          title: "Accounts Receivable Summary",
          description: "Summary of all transactions affecting the Accounts Receivable balance as of a specific date.",
          href: "/reports/financial/accounts-receivable"
        },
        {
          id: "balance-sheet",
          title: "Balance Sheet",
          description: "Assets, liabilities, and equity by property as of a specific date.",
          href: "/reports/financial/balance-sheet"
        },
        {
          id: "budget-vs-actual",
          title: "Budget vs. Actual",
          description: "Compare budgeted amounts to actual income and expenses.",
          href: "/reports/financial/budget-vs-actual"
        },
        {
          id: "cash-flow",
          title: "Cash Flow Statement",
          description: "Changes in cash by property during a specified time frame.",
          href: "/reports/financial/cash-flow"
        },
        {
          id: "general-ledger",
          title: "General Ledger",
          description: "Debit and credit transactions by property during a specified time frame.",
          href: "/reports/financial/general-ledger"
        },
        {
          id: "income-statement",
          title: "Income Statement",
          description: "Income and expenses by property during a specified time frame.",
          href: "/reports/financial/income-statement"
        }
      ]
    },
    {
      id: "rental",
      title: "Rental",
      description: "Tenant and lease management reports",
      icon: "ri-home-line",
      color: "bg-blue-500",
      reports: [
        {
          id: "current-tenants",
          title: "Current Tenants",
          description: "Current tenants by property.",
          href: "/reports/rental/current-tenants"
        },
        {
          id: "delinquent-tenants",
          title: "Delinquent Tenants",
          description: "Tenants with outstanding ledger balances as of a specific date.",
          href: "/reports/rental/delinquent-tenants"
        },
        {
          id: "leases-ending",
          title: "Leases Ending",
          description: "All leases that will end during a specified time frame.",
          href: "/reports/rental/leases-ending"
        },
        {
          id: "rent-roll",
          title: "Rent Roll",
          description: "Rent balance due by property and tenant, i.e. lease date, market rent, recurring rent, credit, and deposits held.",
          href: "/reports/rental/rent-roll"
        },
        {
          id: "vacant-units",
          title: "Vacant Units",
          description: "Vacant units by property.",
          href: "/reports/rental/vacant-units"
        }
      ]
    },
    {
      id: "property",
      title: "Property",
      description: "Property management and maintenance reports",
      icon: "ri-building-line",
      color: "bg-purple-500",
      reports: [
        {
          id: "appliances",
          title: "Appliances",
          description: "All appliances, warranty expirations, installation dates, and last service dates.",
          href: "/reports/property/appliances"
        },
        {
          id: "event-history",
          title: "Event History",
          description: "Saved event history by property during a specified time frame.",
          href: "/reports/property/event-history"
        },
        {
          id: "meter-readings",
          title: "Meter Readings",
          description: "Most recent meter readings by property, unit, and meter type during a specified time frame.",
          href: "/reports/property/meter-readings"
        }
      ]
    },
    {
      id: "transaction",
      title: "Transaction",
      description: "Transaction and payment reports",
      icon: "ri-exchange-line",
      color: "bg-orange-500",
      reports: [
        {
          id: "bank-transactions",
          title: "Bank Transactions",
          description: "A bank account's detailed transaction history by property during a specified time frame.",
          href: "/reports/transaction/bank-transactions"
        },
        {
          id: "check-details",
          title: "Check Details",
          description: "Check details by bank account during a specified time frame.",
          href: "/reports/transaction/check-details"
        },
        {
          id: "unpaid-bills",
          title: "Unpaid Bills",
          description: "Unpaid bills and unused credits by property as of a specific date.",
          href: "/reports/transaction/unpaid-bills"
        }
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Reports</h1>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <i className={`${category.icon} text-lg`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{category.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                      {category.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.reports.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                      {report.isNew && (
                        <Badge variant="secondary" className="ml-2">New</Badge>
                      )}
                    </div>
                  ))}
                  
                  {category.reports.length > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      +{category.reports.length - 3} more reports
                    </p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => router.push(`/reports/${category.id}`)}
                  >
                    View All {category.title} Reports
                    <i className="ri-arrow-right-line ml-1" />
                  </Button>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <i className="ri-download-line mr-2" />
                Export All Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-settings-3-line mr-2" />
                Report Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withAuth(ReportsPage);
