"use client";

import { Button } from "@/components/ui/button";
import { useGetPropertyUnits } from "@/hooks/useUnits";
import { UnitCard } from "@/components/units/UnitCard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnitForm } from "@/components/units/UnitForm";

interface PropertyUnitsListProps {
  propertyId: string;
}

export function PropertyUnitsList({ propertyId }: PropertyUnitsListProps) {
  const { data: units, isLoading, isError, error } = useGetPropertyUnits(propertyId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Error loading units</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage units for this property.
        </p>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <i className="ri-add-line mr-1" />
          Add Unit
        </Button>
      </div>

      {units && units.length > 0 ? (
        <div className="space-y-4">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No units found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven't added any units to this property yet. Click the button below to add your first unit.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <i className="ri-add-line mr-1" />
            Add Your First Unit
          </Button>
        </div>
      )}

      {/* Add Unit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
          </DialogHeader>
          <UnitForm 
            propertyId={propertyId} 
            onSuccess={() => setIsAddDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
