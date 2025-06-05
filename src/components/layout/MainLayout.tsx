"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="leaseridge-theme">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

        <main className={cn("main-content", sidebarCollapsed && "main-content-expanded")}>
          <Topbar sidebarCollapsed={sidebarCollapsed} />

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
