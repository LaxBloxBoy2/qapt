"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface RentalReport {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
}

function RentalReportsPage() {
  const router = useRouter();

  const rentalReports: RentalReport[] = [
    {
      id: "current-tenants",
      title: "Current Tenants",
      description: "Current tenants by property.",
      href: "/reports/rental/current-tenants",
      icon: "ri-user-line",
      category: "Tenants",
      isPopular: true
    },
    {
      id: "custom-fields-rental-owners",
      title: "Custom Fields for Rental Owners",
      description: "Custom field values for rental owners.",
      href: "/reports/rental/custom-fields-rental-owners",
      icon: "ri-user-settings-line",
      category: "Custom Fields"
    },
    {
      id: "custom-fields-rentals",
      title: "Custom Fields for Rentals",
      description: "Custom field values for rentals by property.",
      href: "/reports/rental/custom-fields-rentals",
      icon: "ri-settings-line",
      category: "Custom Fields"
    },
    {
      id: "custom-fields-tenants",
      title: "Custom Fields for Tenants",
      description: "Custom field values for tenants by property.",
      href: "/reports/rental/custom-fields-tenants",
      icon: "ri-user-settings-2-line",
      category: "Custom Fields"
    },
    {
      id: "custom-fields-units",
      title: "Custom Fields for Units",
      description: "Custom field values for rental units by property.",
      href: "/reports/rental/custom-fields-units",
      icon: "ri-home-gear-line",
      category: "Custom Fields"
    },
    {
      id: "delinquent-tenants",
      title: "Delinquent Tenants",
      description: "Tenants with outstanding ledger balances as of a specific date.",
      href: "/reports/rental/delinquent-tenants",
      icon: "ri-alarm-warning-line",
      category: "Tenants",
      isPopular: true
    },
    {
      id: "leases-ending",
      title: "Leases Ending",
      description: "All leases that will end during a specified time frame.",
      href: "/reports/rental/leases-ending",
      icon: "ri-calendar-event-line",
      category: "Leases",
      isPopular: true
    },
    {
      id: "leasing-agent",
      title: "Leasing Agent",
      description: "All draft leases activated during a specified time frame by property and leasing agent.",
      href: "/reports/rental/leasing-agent",
      icon: "ri-user-star-line",
      category: "Leases"
    },
    {
      id: "rent-paid",
      title: "Rent Paid",
      description: "Rent balance due by property and tenant, i.e. lease date, recurring charges, credit, previous payments, and previous balances.",
      href: "/reports/rental/rent-paid",
      icon: "ri-money-dollar-circle-line",
      category: "Payments"
    },
    {
      id: "rent-roll",
      title: "Rent Roll",
      description: "Rent balance due by property and tenant, i.e. lease date, market rent, recurring rent, credit, and deposits held.",
      href: "/reports/rental/rent-roll",
      icon: "ri-file-list-3-line",
      category: "Payments",
      isPopular: true
    },
    {
      id: "renters-insurance",
      title: "Renters Insurance",
      description: "All insured units.",
      href: "/reports/rental/renters-insurance",
      icon: "ri-shield-check-line",
      category: "Insurance"
    },
    {
      id: "security-deposit-liabilities",
      title: "Security Deposit and Liabilities",
      description: "Summary of all current liabilities held by property.",
      href: "/reports/rental/security-deposit-liabilities",
      icon: "ri-safe-line",
      category: "Deposits"
    },
    {
      id: "tenant-notes",
      title: "Tenant Notes",
      description: "Tenant notes by property during a specified time frame.",
      href: "/reports/rental/tenant-notes",
      icon: "ri-sticky-note-line",
      category: "Tenants"
    },
    {
      id: "tenant-statement",
      title: "Tenant Statement",
      description: "Tenants' charges, credits, and payments by property during a specified time frame.",
      href: "/reports/rental/tenant-statement",
      icon: "ri-file-text-line",
      category: "Tenants"
    },
    {
      id: "tenant-vehicles",
      title: "Tenant Vehicles",
      description: "Tenants' vehicles by property.",
      href: "/reports/rental/tenant-vehicles",
      icon: "ri-car-line",
      category: "Tenants"
    },
    {
      id: "unit-listings",
      title: "Unit Listings",
      description: "Rental listings by property.",
      href: "/reports/rental/unit-listings",
      icon: "ri-home-line",
      category: "Units"
    },
    {
      id: "vacant-units",
      title: "Vacant Units",
      description: "Vacant units by property.",
      href: "/reports/rental/vacant-units",
      icon: "ri-home-2-line",
      category: "Units",
      isPopular: true
    }
  ];

  const categories = Array.from(new Set(rentalReports.map(report => report.category)));

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredReports = selectedCategory === "all" 
    ? rentalReports 
    : rentalReports.filter(report => report.category === selectedCategory);

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
              <span className="text-gray-600">Rental</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rental Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive rental and tenant management reporting
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
            All Reports ({rentalReports.length})
          </Button>
          {categories.map((category) => {
            const count = rentalReports.filter(report => report.category === category).length;
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
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
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
                Export All Rental Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Rental Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-dashboard-line mr-2" />
                Rental Dashboard
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
            <CardTitle>Most Popular Rental Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rentalReports.filter(report => report.isPopular).map((report) => (
                <Button
                  key={report.id}
                  variant="ghost"
                  className="h-auto p-4 justify-start"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${report.icon} text-lg text-blue-600`} />
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

        {/* Rental Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Units</p>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-green-600">+3 this month</p>
                </div>
                <i className="ri-home-line text-2xl text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Occupied</p>
                  <p className="text-2xl font-bold">142</p>
                  <p className="text-xs text-green-600">91% occupancy</p>
                </div>
                <i className="ri-user-line text-2xl text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vacant</p>
                  <p className="text-2xl font-bold">14</p>
                  <p className="text-xs text-yellow-600">9% vacancy</p>
                </div>
                <i className="ri-home-2-line text-2xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delinquent</p>
                  <p className="text-2xl font-bold">7</p>
                  <p className="text-xs text-red-600">4.9% of tenants</p>
                </div>
                <i className="ri-alarm-warning-line text-2xl text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(RentalReportsPage);
