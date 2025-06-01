"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/components/layout/ThemeProvider";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "remixicon/fonts/remixicon.css";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, profile } = useUser();

  // Function to get the page title based on the current path
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    const path = pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
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

  return (
    <div className="topbar">
      {/* Left side - Page title */}
      <div>
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="search-bar">
          <i className="ri-search-line text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <i className="ri-sun-line text-gray-600 dark:text-gray-300" />
          ) : (
            <i className="ri-moon-line text-gray-600 dark:text-gray-300" />
          )}
        </button>

        <NotificationDropdown />

        <button
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Help"
        >
          <i className="ri-question-line text-gray-600 dark:text-gray-300" />
        </button>

        {/* Profile section - similar to sidebar */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={getDisplayName()} />
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
