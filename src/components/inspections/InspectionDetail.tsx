"use client";

import React, { useState } from "react";
import { useGetInspection, useGetInspectionSections, useDeleteInspection } from "@/hooks/useInspections";
import { useGetPropertyDetails } from "@/hooks/useProperty";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StorageImage } from "@/components/ui/storage-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InspectionSectionCard } from "./InspectionSectionCard";
import { useRouter } from "next/navigation";

interface InspectionDetailProps {
  inspectionId: string;
}

export function InspectionDetail({ inspectionId }: InspectionDetailProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: inspection, isLoading: inspectionLoading } = useGetInspection(inspectionId);
  const { data: sections, isLoading: sectionsLoading } = useGetInspectionSections(inspectionId);
  const { data: propertyData } = useGetPropertyDetails(inspection?.property_id || null);
  const deleteInspection = useDeleteInspection();

  // Function to get the badge color based on inspection type
  const getInspectionTypeBadge = (type: string) => {
    switch (type) {
      case "move_in":
        return <Badge className="bg-green-500">Move-in</Badge>;
      case "move_out":
        return <Badge className="bg-orange-500">Move-out</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const handleDelete = async () => {
    try {
      console.log("Deleting inspection with ID:", inspectionId);
      await deleteInspection.mutateAsync(inspectionId);
      console.log("Inspection deleted successfully, redirecting to inspections list");
      router.push("/inspections");
    } catch (error) {
      console.error("Error deleting inspection:", error);
    } finally {
      // Close the dialog regardless of success or failure
      setIsDeleteDialogOpen(false);
    }
  };

  if (inspectionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
          <i className="ri-error-warning-line text-3xl text-red-500"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium">Inspection not found</h3>
        <p className="mt-1 text-muted-foreground">
          The inspection you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/inspections")}
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Inspections
        </Button>
      </div>
    );
  }

  // If we don't have property data yet, show a loading state
  if (!propertyData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  {propertyData?.name || "Unknown Property"}
                </CardTitle>
                {getInspectionTypeBadge(inspection.type || "unknown")}
              </div>
              <CardDescription>
                {propertyData?.address || "No address"}
              </CardDescription>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right">
                <div className="text-sm font-medium">Expires</div>
                <div className="text-sm">
                  {inspection.expiration_date ?
                    format(new Date(inspection.expiration_date), "MMM d, yyyy") :
                    "No expiration date"
                  }
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <i className="ri-delete-bin-line text-lg"></i>
              </Button>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this inspection? This action cannot be undone.
                      All inspection sections, conditions, and media will also be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Property Information</h3>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
                {propertyData?.image_url ? (
                  <div className="mb-4">
                    <StorageImage
                      src={propertyData.image_url}
                      alt={propertyData.name || "Property"}
                      className="w-full h-40 object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <div className="mb-4 bg-gray-200 dark:bg-gray-700 h-40 rounded-md flex items-center justify-center">
                    <i className="ri-building-line text-4xl text-gray-400 dark:text-gray-500"></i>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Property</span>
                    <span className="text-sm">
                      {propertyData?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Address</span>
                    <span className="text-sm">
                      {propertyData?.address || "No address"}
                    </span>
                  </div>


                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Inspection Details</h3>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Type</span>
                    <span className="text-sm">
                      {inspection.type === "move_in" ? "Move-in" : "Move-out"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Created</span>
                    <span className="text-sm">
                      {inspection.created_at ?
                        format(new Date(inspection.created_at), "MMM d, yyyy") :
                        "Unknown"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Expires</span>
                    <span className="text-sm">
                      {inspection.expiration_date ?
                        format(new Date(inspection.expiration_date), "MMM d, yyyy") :
                        "No expiration date"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sections</span>
                    <span className="text-sm">
                      {sections?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Inspection Sections</h3>

        {sectionsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : sections && sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <InspectionSectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
              <i className="ri-file-list-line text-3xl text-muted-foreground"></i>
            </div>
            <h3 className="mt-4 text-lg font-medium">No sections found</h3>
            <p className="mt-1 text-muted-foreground">
              This inspection doesn't have any sections yet.
            </p>
          </div>
        )}
      </div>


    </div>
  );
}
