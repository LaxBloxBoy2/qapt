"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface ComplianceReport {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  isPopular?: boolean;
  isNew?: boolean;
  isRequired?: boolean;
}

function ComplianceReportsPage() {
  const router = useRouter();

  const complianceReports: ComplianceReport[] = [
    {
      id: "bank-account-balance-breakdown",
      title: "Bank Account Balance Breakdown",
      description: "Owners' or properties' bank account funds as of a specific date.",
      href: "/reports/compliance/bank-account-balance-breakdown",
      icon: "ri-bank-line",
      isPopular: true
    },
    {
      id: "bank-reconciliation",
      title: "Bank Reconciliation",
      description: "The most recent bank reconciliation report for a specific bank account.",
      href: "/reports/compliance/bank-reconciliation",
      icon: "ri-scales-line",
      isPopular: true,
      isRequired: true
    },
    {
      id: "trust-reconciliation",
      title: "Trust Reconciliation",
      description: "Bank account balance breakdown and reconciliation reports, often needed for PM licensing board audits.",
      href: "/reports/compliance/trust-reconciliation",
      icon: "ri-shield-check-line",
      isRequired: true
    }
  ];

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
              <span className="text-gray-600">Compliance</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Compliance and audit reports for regulatory requirements
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <i className="ri-information-line text-amber-600 text-lg mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">Important Compliance Information</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  These reports are essential for regulatory compliance and licensing board audits. 
                  Ensure you generate and maintain these reports according to your local regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complianceReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                      <i className={`${report.icon} text-lg`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {report.isRequired && (
                          <Badge className="text-xs bg-red-500">
                            Required
                          </Badge>
                        )}
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
                Export All Compliance Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Compliance Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-shield-check-line mr-2" />
                Compliance Dashboard
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-settings-3-line mr-2" />
                Report Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Required Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="ri-shield-check-line text-red-500" />
              Required Compliance Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceReports.filter(report => report.isRequired).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <i className={`${report.icon} text-lg text-red-600`} />
                    <div>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-xs text-gray-600">{report.description}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(report.href)}
                  >
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Accounts</p>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-green-600">All reconciled</p>
                </div>
                <i className="ri-bank-line text-2xl text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trust Funds</p>
                  <p className="text-2xl font-bold">$247K</p>
                  <p className="text-xs text-blue-600">Properly segregated</p>
                </div>
                <i className="ri-shield-check-line text-2xl text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Audit</p>
                  <p className="text-2xl font-bold">Q3</p>
                  <p className="text-xs text-green-600">Passed</p>
                </div>
                <i className="ri-calendar-check-line text-2xl text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Score</p>
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-xs text-green-600">Excellent</p>
                </div>
                <i className="ri-award-line text-2xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Monthly Requirements</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Generate bank reconciliation reports</li>
                  <li>• Review trust account balances</li>
                  <li>• Verify owner fund segregation</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Quarterly Requirements</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Complete trust reconciliation</li>
                  <li>• Audit compliance documentation</li>
                  <li>• Update regulatory filings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withAuth(ComplianceReportsPage);
