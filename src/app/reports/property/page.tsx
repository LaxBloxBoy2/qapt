"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface PropertyReport {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  isPopular?: boolean;
  isNew?: boolean;
}

function PropertyReportsPage() {
  const router = useRouter();

  const propertyReports: PropertyReport[] = [
    {
      id: "appliances",
      title: "Appliances",
      description: "All appliances, warranty expirations, installation dates, and last service dates.",
      href: "/reports/property/appliances",
      icon: "ri-fridge-line",
      isPopular: true
    },
    {
      id: "event-history",
      title: "Event History",
      description: "Saved event history by property during a specified time frame.",
      href: "/reports/property/event-history",
      icon: "ri-history-line"
    },
    {
      id: "late-fee-policy",
      title: "Late Fee Policy",
      description: "Late fee policy details by property and unit.",
      href: "/reports/property/late-fee-policy",
      icon: "ri-money-dollar-circle-line"
    },
    {
      id: "meter-readings",
      title: "Meter Readings",
      description: "Most recent meter readings by property, unit, and meter type during a specified time frame.",
      href: "/reports/property/meter-readings",
      icon: "ri-dashboard-line",
      isPopular: true
    },
    {
      id: "payment-reminder-policy",
      title: "Payment Reminder Policy",
      description: "Payment reminder policy details by property and unit.",
      href: "/reports/property/payment-reminder-policy",
      icon: "ri-notification-line"
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
              <span className="text-gray-600">Property</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Property Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Property management and maintenance reporting
            </p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertyReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                      <i className={`${report.icon} text-lg`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
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
                Export All Property Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Property Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-dashboard-line mr-2" />
                Property Dashboard
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
            <CardTitle>Most Popular Property Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {propertyReports.filter(report => report.isPopular).map((report) => (
                <Button
                  key={report.id}
                  variant="ghost"
                  className="h-auto p-4 justify-start"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${report.icon} text-lg text-purple-600`} />
                    <div className="text-left">
                      <div className="font-medium">{report.title}</div>
                      <div className="text-xs text-gray-600">Property Management</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Property Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Properties</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-green-600">+1 this quarter</p>
                </div>
                <i className="ri-building-line text-2xl text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Appliances</p>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-xs text-blue-600">7.4 per property</p>
                </div>
                <i className="ri-fridge-line text-2xl text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Meter Readings</p>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-green-600">All up to date</p>
                </div>
                <i className="ri-dashboard-line text-2xl text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-yellow-600">This month</p>
                </div>
                <i className="ri-history-line text-2xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(PropertyReportsPage);
