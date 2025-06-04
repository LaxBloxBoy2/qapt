"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/layout/ThemeProvider";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "remixicon/fonts/remixicon.css";
import { useState, useEffect, useRef } from "react";
import { useGetProperties } from "@/hooks/useProperties";
import { useGetUnits } from "@/hooks/useUnits";
import { useTenants } from "@/hooks/useTenants";
import { useLeases } from "@/hooks/useLeases";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, profile } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Data hooks for search
  const { data: properties = [] } = useGetProperties();
  const { data: units = [] } = useGetUnits();
  const { data: tenants = [] } = useTenants();
  const { data: leases = [] } = useLeases();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functions
  const searchProperties = (query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return properties.filter(property =>
      property.name?.toLowerCase().includes(lowerQuery) ||
      property.address?.toLowerCase().includes(lowerQuery) ||
      property.city?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3); // Limit to 3 results
  };

  const searchTenants = (query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return tenants.filter(tenant =>
      tenant.first_name?.toLowerCase().includes(lowerQuery) ||
      tenant.last_name?.toLowerCase().includes(lowerQuery) ||
      tenant.email?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3); // Limit to 3 results
  };

  const searchUnits = (query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return units.filter(unit =>
      unit.name?.toLowerCase().includes(lowerQuery) ||
      unit.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3); // Limit to 3 results
  };

  // Get quick search results
  const propertyResults = searchProperties(searchQuery);
  const tenantResults = searchTenants(searchQuery);
  const unitResults = searchUnits(searchQuery);
  const hasResults = propertyResults.length > 0 || tenantResults.length > 0 || unitResults.length > 0;

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

  // Function to get the page title and current page name
  const getPageInfo = () => {
    const { date, time } = formatDateTime();
    const dateTimeString = `Today is ${date} • ${time}`;

    if (!pathname) {
      return { title: dateTimeString, pageName: 'Dashboard' };
    }

    const path = pathname.split("/")[1];
    if (!path || path === 'dashboard') {
      return { title: dateTimeString, pageName: 'Dashboard' };
    }

    // Get page name from path with custom names
    let pageName = path.charAt(0).toUpperCase() + path.slice(1);

    // Custom page names for better display
    if (path === 'leases') {
      pageName = 'Lease Agreements';
    } else if (path === 'maintenance') {
      pageName = 'Maintenance Hub';
    } else if (path === 'properties') {
      pageName = 'Properties';
    } else if (path === 'tenants') {
      pageName = 'Tenants';
    } else if (path === 'calendar') {
      pageName = 'Calendar';
    } else if (path === 'settings') {
      pageName = 'Settings';
    }

    return { title: dateTimeString, pageName };
  };

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search triggered with query:", searchQuery);
    if (searchQuery.trim()) {
      console.log("Navigating to search page with query:", searchQuery.trim());
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      console.log("Empty search query, not navigating");
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const { title, pageName } = getPageInfo();

  return (
    <div className="topbar">
      {/* Left side - Date/Time and Page title */}
      <div>
        <h1 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h1>
        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{pageName}</p>
      </div>

      <div className="flex items-center gap-4">
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <i className="ri-search-line absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search properties, tenants, leases..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  setShowDropdown(value.length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>

          {/* Search Dropdown */}
          {showDropdown && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {hasResults ? (
                <div className="p-2">
                  {/* Properties */}
                  {propertyResults.length > 0 && (
                    <div className="mb-3">
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Properties
                      </div>
                      {propertyResults.map((property) => (
                        <button
                          key={property.id}
                          onClick={() => {
                            router.push(`/properties/${property.id}`);
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <i className="ri-home-line text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{property.name}</div>
                              <div className="text-xs text-gray-500">{property.address}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tenants */}
                  {tenantResults.length > 0 && (
                    <div className="mb-3">
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Tenants
                      </div>
                      {tenantResults.map((tenant) => (
                        <button
                          key={tenant.id}
                          onClick={() => {
                            router.push(`/tenants/${tenant.id}`);
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <i className="ri-user-line text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{tenant.first_name} {tenant.last_name}</div>
                              <div className="text-xs text-gray-500">{tenant.email}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Units */}
                  {unitResults.length > 0 && (
                    <div className="mb-3">
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Units
                      </div>
                      {unitResults.map((unit) => (
                        <button
                          key={unit.id}
                          onClick={() => {
                            router.push(`/units/${unit.id}`);
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <i className="ri-building-line text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{unit.name}</div>
                              <div className="text-xs text-gray-500">{unit.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View All Results */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <button
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm text-primary font-medium"
                    >
                      <i className="ri-search-line mr-2" />
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <i className="ri-search-line text-2xl mb-2 block" />
                  <div className="text-sm">No results found for "{searchQuery}"</div>
                  <button
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setShowDropdown(false);
                      setSearchQuery("");
                    }}
                    className="text-primary text-sm mt-2 hover:underline"
                  >
                    Search all items
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <i className="ri-sun-line text-gray-600 dark:text-gray-300 text-lg" />
          ) : (
            <i className="ri-moon-line text-gray-600 dark:text-gray-300 text-lg" />
          )}
        </button>

        <NotificationDropdown />

        <button
          onClick={() => router.push('/help')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Help"
        >
          <i className="ri-question-line text-gray-600 dark:text-gray-300 text-lg" />
        </button>

        {/* Profile section - similar to sidebar */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} alt={getDisplayName()} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{getDisplayName()}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{profile?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
