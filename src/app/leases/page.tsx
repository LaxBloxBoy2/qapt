"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { LeasesList } from "@/components/leases/LeasesList";
import { Suspense, useState, useEffect } from "react";

function LeasesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Simulate checking if the app is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (hasError) {
    return (
      <MainLayout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="inline-block rounded-full p-3 bg-red-100 dark:bg-red-900">
            <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-300"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium">Something went wrong</h3>
          <p className="mt-1 text-muted-foreground">
            There was a problem loading the leases page. Please try again later.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh Page
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-2">Loading leases...</p>
          </div>
        }>
          <LeasesList />
        </Suspense>
      </div>
    </MainLayout>
  );
}

export default withAuth(LeasesPage);
