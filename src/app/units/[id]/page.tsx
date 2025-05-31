"use client";

import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { useGetUnit } from "@/hooks/useUnits";
import { useRouter } from "next/navigation";
import { addToRecentlyViewed } from "@/components/dashboard/RecentlyViewed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitOverview } from "@/components/units/detail/UnitOverview";
import { UnitSpecs } from "@/components/units/detail/UnitSpecs";
import { UnitServiceProviders } from "@/components/units/detail/UnitServiceProviders";
import { UnitLeases } from "@/components/units/UnitLeases";

interface UnitDetailPageProps {
  params: {
    id: string;
  };
}

function UnitDetailPage({ params }: UnitDetailPageProps) {
  const router = useRouter();
  const { data: unit, isLoading, isError, error } = useGetUnit(params.id);

  // Track recently viewed
  useEffect(() => {
    if (unit) {
      addToRecentlyViewed({
        id: unit.id,
        type: 'unit',
        title: unit.name,
        subtitle: `Unit ID: ${unit.id}`,
        url: `/units/${unit.id}`,
        icon: 'ri-home-line'
      });
    }
  }, [unit]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (isError || !unit) {
    return (
      <MainLayout>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Error loading unit</h3>
          <p>{error?.message || "Unit not found"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/units")}
          >
            <i className="ri-arrow-left-line mr-1" />
            Back to Units
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{unit.name}</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/units")}>
              <i className="ri-arrow-left-line mr-1" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/properties/${unit.property_id}`)}
            >
              <i className="ri-building-line mr-1" />
              View Property
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="leases">Leases</TabsTrigger>
            <TabsTrigger value="specs">Specs</TabsTrigger>
            <TabsTrigger value="providers">Service Providers</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <UnitOverview unit={unit} />
          </TabsContent>

          <TabsContent value="leases" className="space-y-6">
            <UnitLeases unitId={unit.id} />
          </TabsContent>

          <TabsContent value="specs" className="space-y-6">
            <UnitSpecs unitId={unit.id} />
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <UnitServiceProviders unitId={unit.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default withAuth(UnitDetailPage);
