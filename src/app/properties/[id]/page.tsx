"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { useGetProperty } from "@/hooks/useProperties";
import { useRouter } from "next/navigation";
import { addToRecentlyViewed } from "@/components/dashboard/RecentlyViewed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyOverview } from "@/components/properties/detail/PropertyOverview";
import { PropertyFeatures } from "@/components/properties/detail/PropertyFeatures";
import { PropertySpecs } from "@/components/properties/detail/PropertySpecs";
import { PropertyFinancials } from "@/components/properties/detail/PropertyFinancials";
import { PropertyInsurance } from "@/components/properties/detail/PropertyInsurance";
import { PropertyServiceProviders } from "@/components/properties/detail/PropertyServiceProviders";
import { PropertyUnitsList } from "@/components/properties/detail/PropertyUnitsList";

interface PropertyDetailPageProps {
  params: {
    id: string;
  };
}

function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: property, isLoading, isError, error } = useGetProperty(params.id);

  // Track recently viewed
  useEffect(() => {
    if (property) {
      addToRecentlyViewed({
        id: property.id,
        type: 'property',
        title: property.name,
        subtitle: `${property.address} • ${property.city}, ${property.state}`,
        url: `/properties/${property.id}`,
        icon: 'ri-building-line'
      });
    }
  }, [property]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (isError || !property) {
    return (
      <MainLayout>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Error loading property</h3>
          <p>{error?.message || "Property not found"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/properties")}
          >
            <i className="ri-arrow-left-line mr-1" />
            Back to Properties
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/properties")}
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="ri-arrow-left-line mr-1" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-building-line text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{property.name}</h1>
                <p className="text-muted-foreground text-sm">{property.address}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <i className="ri-home-line mr-1 h-3 w-3" />
                {property.property_type || 'Residential'}
              </Badge>
              <Badge variant="secondary">
                <i className="ri-map-pin-line mr-1 h-3 w-3" />
                {property.city}, {property.state}
              </Badge>
              {property.year_built && (
                <Badge variant="secondary">
                  <i className="ri-calendar-line mr-1 h-3 w-3" />
                  Built {property.year_built}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/properties/edit/${property.id}`)}>
              <i className="ri-edit-line mr-2 h-4 w-4" />
              Edit Property
            </Button>
          </div>
        </div>

        {/* Tabs Section */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none lg:flex">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="units" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Units
                </TabsTrigger>
                <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Features
                </TabsTrigger>
                <TabsTrigger value="specs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Specs
                </TabsTrigger>
                <TabsTrigger value="financials" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Financials
                </TabsTrigger>
                <TabsTrigger value="insurance" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Insurance
                </TabsTrigger>
                <TabsTrigger value="providers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Providers
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-0">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <PropertyOverview property={property} />
              </TabsContent>

              <TabsContent value="units" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Property Units</h3>
                  <PropertyUnitsList propertyId={property.id} />
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Features & Amenities</h3>
                  <PropertyFeatures propertyId={property.id} />
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Property Specifications</h3>
                  <PropertySpecs propertyId={property.id} />
                </div>
              </TabsContent>

              <TabsContent value="financials" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                  <PropertyFinancials propertyId={property.id} />
                </div>
              </TabsContent>

              <TabsContent value="insurance" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Insurance Details</h3>
                  <PropertyInsurance propertyId={property.id} />
                </div>
              </TabsContent>

              <TabsContent value="providers" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Service Providers</h3>
                  <PropertyServiceProviders propertyId={property.id} />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withAuth(PropertyDetailPage);
