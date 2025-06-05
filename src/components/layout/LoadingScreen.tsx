"use client";

import { ThemeProvider } from "@/components/layout/ThemeProvider";

export default function LoadingScreen() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="leaseridge-theme">
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center mb-8">
          <h1 className="font-poppins text-4xl text-primary mb-2 font-semibold">LeaseRidge</h1>
          <p className="text-gray-600 dark:text-gray-400">Property Management Software</p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    </ThemeProvider>
  );
}
