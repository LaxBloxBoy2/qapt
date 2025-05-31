"use client";

import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { MaintenanceDetail } from "@/components/maintenance/MaintenanceDetail";
import { Button } from "@/components/ui/button";

function MaintenanceDetailPage() {
  const params = useParams();
  const requestId = params?.id as string;

  if (!requestId) {
    return (
      <MainLayout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="inline-block rounded-full p-3 bg-red-100 dark:bg-red-900">
            <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-300"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium">Invalid Request ID</h3>
          <p className="mt-1 text-muted-foreground">
            The maintenance request ID is missing or invalid.
          </p>
          <Button
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Back to Maintenance
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <MaintenanceDetail requestId={requestId} />
    </MainLayout>
  );
}

export default withAuth(MaintenanceDetailPage);
