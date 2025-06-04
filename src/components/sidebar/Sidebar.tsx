"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "remixicon/fonts/remixicon.css";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile, signOut } = useUser();

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

  const menuItems = [
    {
      title: "Dashboard",
      icon: "ri-dashboard-line",
      href: "/dashboard",
    },
    {
      title: "Properties",
      icon: "ri-building-line",
      href: null, // No direct link, just a collapsible header
      submenu: [
        {
          title: "All Properties",
          icon: "ri-building-line",
          href: "/properties",
        },
        {
          title: "Units",
          icon: "ri-home-line",
          href: "/units",
        },
        {
          title: "Appliances",
          icon: "ri-device-line",
          href: "/appliances",
        },
        {
          title: "Inspections",
          icon: "ri-file-search-line",
          href: "/inspections",
        },
      ]
    },
    {
      title: "Contacts",
      icon: "ri-contacts-line",
      href: null, // No direct link, just a collapsible header
      submenu: [
        {
          title: "Tenants",
          icon: "ri-user-line",
          href: "/tenants",
        },
        {
          title: "External Contacts",
          icon: "ri-contacts-line",
          href: "/external-contacts",
        },
      ]
    },
    {
      title: "Leases",
      icon: "ri-file-list-3-line",
      href: null, // No direct link, just a collapsible header
      submenu: [
        {
          title: "All Leases",
          icon: "ri-file-list-3-line",
          href: "/leases",
        },
        {
          title: "Applications",
          icon: "ri-file-user-line",
          href: "/applications",
        },
      ]
    },
    {
      title: "Finances",
      icon: "ri-money-dollar-circle-line",
      href: null, // No direct link, just a collapsible header
      submenu: [
        {
          title: "Transactions",
          icon: "ri-exchange-line",
          href: "/transactions",
        },
        {
          title: "Balances",
          icon: "ri-scales-line",
          href: "/balances",
        },
      ]
    },
    {
      title: "Maintenance",
      icon: "ri-tools-line",
      href: "/maintenance",
    },
    {
      title: "Reports",
      icon: "ri-file-chart-line",
      href: null, // No direct link, just a collapsible header
      submenu: [
        {
          title: "All Reports",
          icon: "ri-file-chart-line",
          href: "/reports",
        },
        {
          title: "Financial",
          icon: "ri-money-dollar-circle-line",
          href: "/reports/financial",
        },
        {
          title: "Rental",
          icon: "ri-home-line",
          href: "/reports/rental",
        },
        {
          title: "Property",
          icon: "ri-building-line",
          href: "/reports/property",
        },
        {
          title: "Transaction",
          icon: "ri-exchange-line",
          href: "/reports/transaction",
        },
        {
          title: "Compliance",
          icon: "ri-shield-check-line",
          href: "/reports/compliance",
        },
        {
          title: "Task",
          icon: "ri-task-line",
          href: "/reports/task",
        },
      ],
    },
    {
      title: "Calendar",
      icon: "ri-calendar-line",
      href: "/calendar",
    },
    {
      title: "Documents",
      icon: "ri-folder-line",
      href: "/documents",
    },
    {
      title: "Notifications",
      icon: "ri-notification-3-line",
      href: "/notifications",
    },
  ];

  const generalItems = [
    {
      title: "Settings",
      icon: "ri-settings-line",
      href: "/settings",
    },
    {
      title: "Help",
      icon: "ri-question-line",
      href: "/help",
    },
  ];

  // State for tracking if Properties submenu is expanded
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState<boolean>(() => {
    // Check if current path is a Properties submenu item
    if (!pathname) return false;
    return ['/properties', '/units', '/appliances', '/inspections'].includes(pathname) ||
           pathname.startsWith('/inspections/') ||
           pathname.startsWith('/properties/') ||
           pathname.startsWith('/units/') ||
           pathname.startsWith('/appliances/');
  });

  // State for tracking if Leases submenu is expanded
  const [isLeasesExpanded, setIsLeasesExpanded] = useState<boolean>(() => {
    // Check if current path is a Leases submenu item
    if (!pathname) return false;
    return ['/leases', '/applications'].includes(pathname) ||
           pathname.startsWith('/applications/');
  });

  // State for tracking if Contacts submenu is expanded
  const [isContactsExpanded, setIsContactsExpanded] = useState<boolean>(() => {
    // Check if current path is a Contacts submenu item
    if (!pathname) return false;
    return ['/tenants', '/external-contacts'].includes(pathname) ||
           pathname.startsWith('/tenants/') || pathname.startsWith('/external-contacts/');
  });

  // State for tracking if Finances submenu is expanded
  const [isFinancesExpanded, setIsFinancesExpanded] = useState<boolean>(() => {
    // Check if current path is a Finances submenu item
    if (!pathname) return false;
    return ['/balances', '/transactions'].includes(pathname) ||
           pathname.startsWith('/transactions/');
  });

  // State for tracking if Reports submenu is expanded
  const [isReportsExpanded, setIsReportsExpanded] = useState<boolean>(() => {
    // Check if current path is a Reports submenu item
    if (!pathname) return false;
    return pathname.startsWith('/reports');
  });

  // Update submenu expanded states when pathname changes
  useEffect(() => {
    console.log("Pathname changed to:", pathname);

    if (!pathname) return;

    // Check if current path is a Properties submenu item
    const isPropertiesPath = ['/properties', '/units', '/appliances', '/inspections'].includes(pathname) ||
                             pathname.startsWith('/inspections/') ||
                             pathname.startsWith('/properties/') ||
                             pathname.startsWith('/units/') ||
                             pathname.startsWith('/appliances/');
    console.log("Is properties path:", isPropertiesPath);

    // Check if current path is a Leases submenu item
    const isLeasesPath = ['/leases', '/applications'].includes(pathname) ||
                         pathname.startsWith('/applications/');
    console.log("Is leases path:", isLeasesPath);

    // Check if current path is a Contacts submenu item
    const isContactsPath = ['/tenants', '/external-contacts'].includes(pathname) ||
                           pathname.startsWith('/tenants/') || pathname.startsWith('/external-contacts/');
    console.log("Is contacts path:", isContactsPath);

    // Check if current path is a Finances submenu item
    const isFinancesPath = ['/balances', '/transactions'].includes(pathname) ||
                           pathname.startsWith('/transactions/');
    console.log("Is finances path:", isFinancesPath);

    // Check if current path is a Reports submenu item
    const isReportsPath = pathname.startsWith('/reports');
    console.log("Is reports path:", isReportsPath);

    // Auto-expand submenus when on related pages
    setIsPropertiesExpanded(isPropertiesPath);
    setIsLeasesExpanded(isLeasesPath);
    setIsContactsExpanded(isContactsPath);
    setIsFinancesExpanded(isFinancesPath);
    setIsReportsExpanded(isReportsPath);
  }, [pathname]);

  return (
    <aside className={cn("sidebar", collapsed && "sidebar-collapsed")}>
      {/* Logo and toggle button - fixed at top */}
      <div className="flex items-center justify-between p-4 border-b border-primary-600">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-logo text-2xl text-white">QAPT</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-white/80 hover:text-white p-2 rounded-lg"
        >
          <i className={collapsed ? "ri-menu-line" : "ri-menu-fold-line"} />
        </button>
      </div>

      {/* Scrollable content area with fade effect */}
      <div className="sidebar-content-wrapper">
        <div className="sidebar-content">
          <div className="sidebar-section">
            {!collapsed && (
              <h3 className="sidebar-section-title">Menu</h3>
            )}
          <nav className="mt-2 flex flex-col gap-1">
            {menuItems.map((item, index) => (
              <div key={item.href || `menu-item-${index}`}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => {
                        if (item.title === "Properties") {
                          console.log("Current isPropertiesExpanded:", isPropertiesExpanded);
                          console.log("Will set to:", !isPropertiesExpanded);
                          setIsPropertiesExpanded(!isPropertiesExpanded);
                        } else if (item.title === "Leases") {
                          console.log("Current isLeasesExpanded:", isLeasesExpanded);
                          console.log("Will set to:", !isLeasesExpanded);
                          setIsLeasesExpanded(!isLeasesExpanded);
                        } else if (item.title === "Contacts") {
                          console.log("Current isContactsExpanded:", isContactsExpanded);
                          console.log("Will set to:", !isContactsExpanded);
                          setIsContactsExpanded(!isContactsExpanded);
                        } else if (item.title === "Finances") {
                          console.log("Current isFinancesExpanded:", isFinancesExpanded);
                          console.log("Will set to:", !isFinancesExpanded);
                          setIsFinancesExpanded(!isFinancesExpanded);
                        } else if (item.title === "Reports") {
                          console.log("Current isReportsExpanded:", isReportsExpanded);
                          console.log("Will set to:", !isReportsExpanded);
                          setIsReportsExpanded(!isReportsExpanded);
                        }
                      }}
                      className={cn(
                        "sidebar-link w-full text-left",
                        pathname && item.submenu.some(subItem =>
                          pathname === subItem.href ||
                          (subItem.href === '/properties' && pathname.startsWith('/properties/')) ||
                          (subItem.href === '/units' && pathname.startsWith('/units/')) ||
                          (subItem.href === '/appliances' && pathname.startsWith('/appliances/'))
                        ) && "active",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <i className={item.icon} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          <i className={
                            (item.title === "Properties" && isPropertiesExpanded) ||
                            (item.title === "Leases" && isLeasesExpanded) ||
                            (item.title === "Contacts" && isContactsExpanded) ||
                            (item.title === "Finances" && isFinancesExpanded) ||
                            (item.title === "Reports" && isReportsExpanded)
                              ? "ri-arrow-down-s-line"
                              : "ri-arrow-right-s-line"
                          } />
                        </>
                      )}
                    </button>

                    {/* Submenu items - only show when expanded */}
                    {((item.title === "Properties" && isPropertiesExpanded) ||
                      (item.title === "Leases" && isLeasesExpanded) ||
                      (item.title === "Contacts" && isContactsExpanded) ||
                      (item.title === "Finances" && isFinancesExpanded) ||
                      (item.title === "Reports" && isReportsExpanded)) && (
                      <div className="sidebar-submenu">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "sidebar-link",
                              pathname && (pathname === subItem.href ||
                               (subItem.href === '/properties' && pathname.startsWith('/properties/')) ||
                               (subItem.href === '/units' && pathname.startsWith('/units/')) ||
                               (subItem.href === '/appliances' && pathname.startsWith('/appliances/'))) && "active",
                              collapsed && "justify-center px-0"
                            )}
                          >
                            <i className={subItem.icon} />
                            {!collapsed && <span>{subItem.title}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "sidebar-link",
                      pathname && pathname === item.href && "active",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <i className={item.icon} />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-section">
          {!collapsed && (
            <h3 className="sidebar-section-title">General</h3>
          )}
          <nav className="mt-2 flex flex-col gap-1">
            {generalItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "sidebar-link",
                  pathname && pathname === item.href && "active",
                  collapsed && "justify-center px-0"
                )}
              >
                <i className={item.icon} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>


          </div>
        </div>
      </div>

      {/* User profile - fixed at bottom but positioned higher */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary-600 text-white text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-medium">{getDisplayName()}</p>
                <p className="text-white/60 text-xs capitalize">{profile?.role || 'Loading...'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs py-1.5 px-2 rounded-md hover:bg-primary-600 transition-colors w-full"
            >
              <i className="ri-logout-box-line text-sm" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} alt={getDisplayName()} />
              <AvatarFallback className="bg-primary-600 text-white text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={signOut}
              className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-primary-600 transition-colors"
              title="Sign Out"
            >
              <i className="ri-logout-box-line text-sm" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
