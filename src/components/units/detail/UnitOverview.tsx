"use client";

import { Unit } from "@/types/unit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StorageImage } from "@/components/ui/storage-image";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnitForm } from "../UnitForm";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface UnitOverviewProps {
  unit: Unit;
}

export function UnitOverview({ unit }: UnitOverviewProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get property details
  const { data: property } = useQuery({
    queryKey: ["property", unit.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", unit.property_id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!unit.property_id,
  });

  // Get equipment count
  const { data: equipmentCount = 0 } = useQuery({
    queryKey: ["unit-equipment-count", unit.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("unit_equipment")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", unit.id);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!unit.id,
  });

  // Get maintenance count
  const { data: maintenanceCount = 0 } = useQuery({
    queryKey: ["unit-maintenance-count", unit.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("unit_maintenance")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", unit.id);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!unit.id,
  });

  // Get tenants count
  const { data: tenantsCount = 0 } = useQuery({
    queryKey: ["unit-tenants-count", unit.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("unit_tenants")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", unit.id)
        .eq("is_current", true);

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    },
    enabled: !!unit.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "occupied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {/* Unit Image */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-64 relative">
          {unit.image_url ? (
            <StorageImage
              src={unit.image_url}
              alt={unit.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="ri-home-line text-4xl text-gray-400"></i>
                <p className="text-gray-500 dark:text-gray-400 mt-2">No image available</p>
              </div>
            </div>
          )}
          <Button
            className="absolute bottom-4 right-4"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <i className="ri-edit-line mr-1" />
            Edit Unit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{equipmentCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Equipment</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{maintenanceCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Maintenance</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{tenantsCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tenants</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">General Information</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Property</h4>
              {property ? (
                <Link href={`/properties/${property.id}`} className="text-blue-500 hover:underline">
                  {property.name}
                </Link>
              ) : (
                <p>Loading property information...</p>
              )}
            </div>

            {property && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h4>
                <p>
                  {property.address}<br />
                  {property.city}, {property.state} {property.zip}
                </p>
              </div>
            )}

            {property && property.mls_number && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">MLS Number</h4>
                <p>{property.mls_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Unit Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Unit Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Type</h4>
              <p>{unit.unit_type}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
              <Badge className={getStatusColor(unit.status)}>
                {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {unit.beds !== null && unit.beds !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Beds</h4>
                <p>{unit.beds}</p>
              </div>
            )}

            {unit.baths !== null && unit.baths !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Baths</h4>
                <p>{unit.baths}</p>
              </div>
            )}

            {unit.size !== null && unit.size !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Size</h4>
                <p>{unit.size} sq ft</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {unit.market_rent !== null && unit.market_rent !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Market Rent</h4>
                <p className="font-medium">${unit.market_rent.toLocaleString()}</p>
              </div>
            )}

            {unit.deposit !== null && unit.deposit !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Deposit</h4>
                <p className="font-medium">${unit.deposit.toLocaleString()}</p>
              </div>
            )}
          </div>

          {unit.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
              <p className="text-sm">{unit.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Unit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <UnitForm
            unit={unit}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
