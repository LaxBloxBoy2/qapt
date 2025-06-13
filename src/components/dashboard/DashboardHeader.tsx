"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { UserMenu } from "@/components/layout/UserMenu";

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const router = useRouter();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page or implement global search
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-property':
        router.push('/properties/new');
        break;
      case 'add-tenant':
        router.push('/tenants/new');
        break;
      case 'add-lease':
        router.push('/leases/new');
        break;
      case 'add-transaction':
        router.push('/transactions/new');
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side - Welcome and Search */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today is {date}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <i className="ri-time-line" />
                Current time: {time}
              </p>
            </div>
            
            {/* Global Search */}
            <div className="flex-1 max-w-md">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search properties, tenants, leases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right side - Quick Actions, Notifications, User Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('add-property')}
              className="text-xs"
            >
              <i className="ri-building-line mr-1" />
              Property
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('add-tenant')}
              className="text-xs"
            >
              <i className="ri-user-add-line mr-1" />
              Tenant
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('add-lease')}
              className="text-xs"
            >
              <i className="ri-file-text-line mr-1" />
              Lease
            </Button>
          </div>

          {/* Mobile Quick Actions Dropdown */}
          <div className="md:hidden">
            <Button variant="outline" size="sm">
              <i className="ri-add-line mr-1" />
              Add
            </Button>
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
