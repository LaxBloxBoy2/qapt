"use client";

import { Unit } from "@/types/unit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StorageImage } from "@/components/ui/storage-image";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnitForm } from "./UnitForm";
import { useDeleteUnit } from "@/hooks/useUnits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface UnitCardProps {
  unit: Unit;
}

export function UnitCard({ unit }: UnitCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const deleteUnit = useDeleteUnit();

  const handleDelete = () => {
    deleteUnit.mutate(unit.id);
  };

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
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex-grow">
        <div className="flex space-x-4">
          {/* Unit Image */}
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
            {unit.image_url ? (
              <StorageImage
                src={unit.image_url}
                alt={unit.name}
                className="w-full h-full"
                onLoadingError={(error) => {
                  console.error('Error loading unit image:', error.message);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <i className="ri-home-line text-2xl text-gray-400"></i>
              </div>
            )}
          </div>

          {/* Unit Details */}
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{unit.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unit.unit_type}
                </p>
              </div>
              <Badge className={getStatusColor(unit.status)}>
                {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
              {unit.beds !== null && unit.beds !== undefined && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Beds:</span>{" "}
                  {unit.beds}
                </div>
              )}
              {unit.baths !== null && unit.baths !== undefined && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Baths:</span>{" "}
                  {unit.baths}
                </div>
              )}
              {unit.size !== null && unit.size !== undefined && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Size:</span>{" "}
                  {unit.size} sq ft
                </div>
              )}
            </div>

            {unit.market_rent !== null && unit.market_rent !== undefined && (
              <p className="text-sm mt-2">
                <span className="text-gray-500 dark:text-gray-400">Market Rent:</span>{" "}
                <span className="font-medium">${unit.market_rent.toLocaleString()}</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3 pb-3 px-4 flex justify-between">
        <div className="flex space-x-2">
          <Link href={`/units/${unit.id}`}>
            <Button variant="outline" size="sm">
              <i className="ri-eye-line mr-1" />
              View
            </Button>
          </Link>

          <Button variant="outline" size="sm" disabled>
            <i className="ri-user-add-line mr-1" />
            Move In
          </Button>
        </div>

        <div className="flex space-x-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
              <i className="ri-edit-line mr-1" />
              Edit
            </Button>
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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                <i className="ri-delete-bin-line mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the unit "{unit.name}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                  {deleteUnit.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
