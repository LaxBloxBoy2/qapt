"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/components/layout/ThemeProvider";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import "remixicon/fonts/remixicon.css";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

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

  return (
    <div className="topbar">
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

        <button className="btn-primary">
          <i className="ri-add-line mr-1" />
          Add new property
        </button>
      </div>
    </div>
  );
}
