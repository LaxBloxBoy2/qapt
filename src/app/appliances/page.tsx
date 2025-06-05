"use client";

import { ApplianceCard } from "@/components/appliances/ApplianceCard";
import { ApplianceFilters } from "@/components/appliances/ApplianceFilters";
import { ApplianceForm } from "@/components/appliances/ApplianceForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGetAppliances } from "@/hooks/useAppliances";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";

function AppliancesPage() {
  const { data: appliances, isLoading } = useGetAppliances();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const searchParams = useSearchParams();

  // Filter appliances based on URL params
  const filteredAppliances = appliances?.filter((appliance) => {
    // Property filter
    const propertyParam = searchParams?.get("property");
    if (propertyParam && !propertyParam.split(",").includes(appliance.property_id)) {
      return false;
    }

    // Status filter
    const statusParam = searchParams?.get("status");
    if (statusParam && !statusParam.split(",").includes(appliance.status)) {
      return false;
    }

    // Category filter
    const categoryParam = searchParams?.get("category");
    if (categoryParam && !categoryParam.split(",").includes(appliance.category_id)) {
      return false;
    }

    // Warranty filter
    const warrantyParam = searchParams?.get("warranty");
    if (warrantyParam === "expiring") {
      if (!appliance.warranty_expiration) return false;

      const warrantyDate = new Date(appliance.warranty_expiration);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      if (!(warrantyDate <= thirtyDaysFromNow && warrantyDate >= today)) {
        return false;
      }
    }

    return true;
  });

  // Count appliances by status
  const activeCount = filteredAppliances?.filter(a => a.status === "active").length || 0;
  const maintenanceCount = filteredAppliances?.filter(a => a.status === "maintenance").length || 0;
  const retiredCount = filteredAppliances?.filter(a => a.status === "retired").length || 0;

  // Count appliances with expiring warranty
  const expiringWarrantyCount = filteredAppliances?.filter(a => {
    if (!a.warranty_expiration) return false;

    const warrantyDate = new Date(a.warranty_expiration);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return warrantyDate <= thirtyDaysFromNow && warrantyDate >= today;
  }).length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appliances</h1>
            <p className="text-muted-foreground">
              Manage your property appliances and equipment
            </p>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <i className="ri-add-line mr-2"></i>
                Add Appliance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Appliance</DialogTitle>
                <DialogDescription>
                  Fill out the form below to add a new appliance.
                </DialogDescription>
              </DialogHeader>
              <ApplianceForm onSuccess={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Active</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Maintenance</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{maintenanceCount}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Retired</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{retiredCount}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Warranty Expiring</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{expiringWarrantyCount}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <ApplianceFilters />
            </div>
          </div>

          <div className="md:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading appliances...</p>
              </div>
            ) : filteredAppliances && filteredAppliances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAppliances.map((appliance) => (
                  <ApplianceCard key={appliance.id} appliance={appliance} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
                  <i className="ri-device-line text-3xl text-muted-foreground"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium">No appliances found</h3>
                <p className="mt-1 text-muted-foreground">
                  {appliances && appliances.length > 0
                    ? "Try adjusting your filters to see more results."
                    : "Get started by adding your first appliance."}
                </p>
                {appliances && appliances.length === 0 && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <i className="ri-add-line mr-2"></i>
                    Add Appliance
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(AppliancesPage);
