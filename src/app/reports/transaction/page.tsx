"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface TransactionReport {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
}

function TransactionReportsPage() {
  const router = useRouter();

  const transactionReports: TransactionReport[] = [
    {
      id: "automated-invoice-entry",
      title: "Automated Invoice Entry Usage",
      description: "View detailed unbilled & billed automated invoice entry usage in Buildium.",
      href: "/reports/transaction/automated-invoice-entry",
      icon: "ri-file-list-line",
      category: "Usage"
    },
    {
      id: "bank-transactions",
      title: "Bank Transactions",
      description: "A bank account's detailed transaction history by property during a specified time frame. Available consolidated.",
      href: "/reports/transaction/bank-transactions",
      icon: "ri-bank-line",
      category: "Banking",
      isPopular: true
    },
    {
      id: "tenant-screening-usage",
      title: "Tenant Screening Usage",
      description: "Billed Tenant Screening usage during a specified time frame.",
      href: "/reports/transaction/tenant-screening-usage",
      icon: "ri-user-search-line",
      category: "Usage"
    },
    {
      id: "check-details",
      title: "Check Details",
      description: "Check details by bank account during a specified time frame.",
      href: "/reports/transaction/check-details",
      icon: "ri-file-paper-line",
      category: "Banking",
      isPopular: true
    },
    {
      id: "esignature-activity",
      title: "eSignature Activity",
      description: "eSignature details by property during a specified time frame.",
      href: "/reports/transaction/esignature-activity",
      icon: "ri-quill-pen-line",
      category: "Digital"
    },
    {
      id: "epay-activity",
      title: "ePay Activity",
      description: "Electronic fund transfers (EFTs) by bank account during a specified time frame.",
      href: "/reports/transaction/epay-activity",
      icon: "ri-smartphone-line",
      category: "Digital",
      isPopular: true
    },
    {
      id: "retail-cash-activity",
      title: "Retail Cash Activity",
      description: "Retail Cash transfers by bank account during a specified time frame.",
      href: "/reports/transaction/retail-cash-activity",
      icon: "ri-money-dollar-circle-line",
      category: "Cash"
    },
    {
      id: "enhanced-tenant-screening",
      title: "Enhanced Tenant Screening Usage",
      description: "Billed Enhanced Tenant Screening usage during a specified time frame.",
      href: "/reports/transaction/enhanced-tenant-screening",
      icon: "ri-shield-user-line",
      category: "Usage"
    },
    {
      id: "remote-check-printing",
      title: "Remote Check Printing Usage",
      description: "Remote Check Printing usage by bank account during a specified time frame.",
      href: "/reports/transaction/remote-check-printing",
      icon: "ri-printer-line",
      category: "Usage"
    },
    {
      id: "scheduled-online-payments",
      title: "Scheduled Online Payments",
      description: "Upcoming online payments by property.",
      href: "/reports/transaction/scheduled-online-payments",
      icon: "ri-calendar-schedule-line",
      category: "Digital"
    },
    {
      id: "transaction-details-by-account",
      title: "Transaction Details by Account",
      description: "Debits and credits for a general ledger account during a specified time frame.",
      href: "/reports/transaction/transaction-details-by-account",
      icon: "ri-exchange-line",
      category: "Accounting"
    },
    {
      id: "unpaid-bills",
      title: "Unpaid Bills",
      description: "Unpaid bills and unused credits by property as of a specific date. Available by property or by vendor.",
      href: "/reports/transaction/unpaid-bills",
      icon: "ri-bill-line",
      category: "Bills",
      isPopular: true
    }
  ];

  const categories = Array.from(new Set(transactionReports.map(report => report.category)));

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredReports = selectedCategory === "all" 
    ? transactionReports 
    : transactionReports.filter(report => report.category === selectedCategory);

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
              <span className="text-gray-600">Transaction</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Transaction and payment processing reports
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
            All Reports ({transactionReports.length})
          </Button>
          {categories.map((category) => {
            const count = transactionReports.filter(report => report.category === category).length;
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
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
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
                Export All Transaction Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Transaction Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-dashboard-line mr-2" />
                Transaction Dashboard
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
            <CardTitle>Most Popular Transaction Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactionReports.filter(report => report.isPopular).map((report) => (
                <Button
                  key={report.id}
                  variant="ghost"
                  className="h-auto p-4 justify-start"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${report.icon} text-lg text-orange-600`} />
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

        {/* Transaction Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-green-600">+89 this month</p>
                </div>
                <i className="ri-exchange-line text-2xl text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Online Payments</p>
                  <p className="text-2xl font-bold">892</p>
                  <p className="text-xs text-blue-600">71.5% of total</p>
                </div>
                <i className="ri-smartphone-line text-2xl text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Bills</p>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-yellow-600">$12,450 total</p>
                </div>
                <i className="ri-bill-line text-2xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Accounts</p>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-green-600">All reconciled</p>
                </div>
                <i className="ri-bank-line text-2xl text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(TransactionReportsPage);
