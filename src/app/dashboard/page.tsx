"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";

import { TodaySection } from "@/components/dashboard/TodaySection";
import { LeaseFunnel } from "@/components/dashboard/LeaseFunnel";
import { RecentlyViewed } from "@/components/dashboard/RecentlyViewed";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { PropertyPerformance } from "@/components/dashboard/PropertyPerformance";
import { TenantOverview } from "@/components/dashboard/TenantOverview";
import { MaintenanceRequests } from "@/components/dashboard/MaintenanceRequests";
import { RentCollection } from "@/components/dashboard/RentCollection";
import { OccupancyTrends } from "@/components/dashboard/OccupancyTrends";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { DashboardCustomizationSimple } from "@/components/dashboard/DashboardCustomizationSimple";
import { useDashboardData } from "@/hooks/useDashboard";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { useEffect, useState } from "react";

function DashboardPage() {
  const { data: dashboardData, isLoading } = useDashboardData();
  const { enabledWidgets, preferences } = useDashboardPreferences();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Format the date and time
  const formatDateTime = () => {
    const now = currentDateTime;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const dateStr = now.toLocaleDateString('en-US', options);
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      date: dateStr,
      time: timeStr
    };
  };

  const { date, time } = formatDateTime();

  // Widget component mapping
  const widgetComponents = {
    'today-section': () => <TodaySection data={dashboardData?.today} />,
    'lease-funnel': () => <LeaseFunnel data={dashboardData?.leases} />,
    'financial-overview': () => <FinancialOverview data={dashboardData?.financial} />,
    'recently-viewed': () => <RecentlyViewed />,
    'property-performance': () => <PropertyPerformance />,
    'tenant-overview': () => <TenantOverview />,
    'maintenance-requests': () => <MaintenanceRequests />,
    'rent-collection': () => <RentCollection />,
    'occupancy-trends': () => <OccupancyTrends />,
    'expense-breakdown': () => <ExpenseBreakdown />,
    'lease-renewals': () => <div>Lease Renewals Widget (Coming Soon)</div>,
    'market-insights': () => <div>Market Insights Widget (Coming Soon)</div>,
  };

  const renderWidget = (widgetId: string) => {
    const component = widgetComponents[widgetId as keyof typeof widgetComponents];
    return component ? component() : null;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Separate widgets by size for better layout
  const largeWidgets = enabledWidgets.filter(w => w.size === 'large');
  const mediumWidgets = enabledWidgets.filter(w => w.size === 'medium');
  const smallWidgets = enabledWidgets.filter(w => w.size === 'small');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Dashboard Customization */}
        <div className="flex justify-end">
          <DashboardCustomizationSimple />
        </div>

        {/* Large Widgets (Full Width) */}
        <div className="space-y-6" key={`large-${enabledWidgets.length}`}>
          {largeWidgets.map((widget) => (
            <div key={`large-${widget.id}`}>
              {renderWidget(widget.id)}
            </div>
          ))}
        </div>

        {/* Medium Widgets (Grid Layout) */}
        {mediumWidgets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={`medium-${enabledWidgets.length}`}>
            {mediumWidgets.map((widget) => (
              <div key={`medium-${widget.id}`}>
                {renderWidget(widget.id)}
              </div>
            ))}
          </div>
        )}

        {/* Small Widgets (Compact Grid) */}
        {smallWidgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" key={`small-${enabledWidgets.length}`}>
            {smallWidgets.map((widget) => (
              <div key={`small-${widget.id}`}>
                {renderWidget(widget.id)}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {enabledWidgets.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-dashboard-line text-6xl text-gray-400 mb-4 block" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No widgets enabled
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Customize your dashboard by enabling widgets that matter to you.
            </p>
            <DashboardCustomizationSimple />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withAuth(DashboardPage);
