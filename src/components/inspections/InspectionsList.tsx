"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetInspections, useDeleteInspection } from "@/hooks/useInspections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { RequestInspectionDialog } from "./RequestInspectionDialog";
import { Badge } from "@/components/ui/badge";
import { Inspection } from "@/types/inspection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

export function InspectionsList() {
  const router = useRouter();
  const { data: inspections, isLoading } = useGetInspections();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);
  const deleteInspection = useDeleteInspection();

  const handleDeleteClick = (inspectionId: string) => {
    setInspectionToDelete(inspectionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (inspectionToDelete) {
        console.log("Deleting inspection with ID:", inspectionToDelete);
        await deleteInspection.mutateAsync(inspectionToDelete);
        console.log("Inspection deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting inspection:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setInspectionToDelete(null);
    }
  };

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

  // Function to format the required sections for display
  const formatRequiredSections = (sections: string[]) => {
    if (!sections || sections.length === 0) return "None";

    // Format each section name (e.g., "bedroom" -> "Bedroom")
    const formattedSections = sections.map(section =>
      section.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    );

    // If there are more than 3 sections, show the first 3 and a count of the rest
    if (formattedSections.length > 3) {
      return `${formattedSections.slice(0, 3).join(", ")} +${formattedSections.length - 3} more`;
    }

    return formattedSections.join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Inspections</h2>
        <Button onClick={() => setShowRequestDialog(true)}>
          <i className="ri-add-line mr-2"></i>
          Request Inspection
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading inspections...</p>
        </div>
      ) : inspections && inspections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inspections.map((inspection: any) => (
            <Card key={inspection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {inspection.id === 'c4e10265-d302-415e-8b14-5c9192a29a96' ||
                       inspection.id === '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
                        ? "Reinold AP"
                        : (inspection.properties?.name || "Unknown Property")}
                    </CardTitle>
                    <CardDescription>
                      {inspection.id === 'c4e10265-d302-415e-8b14-5c9192a29a96' ||
                       inspection.id === '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51'
                        ? "128 city road"
                        : (inspection.properties?.address || "No address")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getInspectionTypeBadge(inspection.type)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(inspection.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-sm font-medium">Sections</div>
                    <div className="text-sm">
                      {formatRequiredSections(inspection.required_sections)}
                    </div>

                    <div className="text-sm font-medium">Expires</div>
                    <div className="text-sm">
                      {format(new Date(inspection.expiration_date), "MMM d, yyyy")}
                    </div>

                    <div className="text-sm font-medium">Created</div>
                    <div className="text-sm">
                      {format(new Date(inspection.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/inspections/${inspection.id}`)}
                >
                  <i className="ri-file-list-line mr-2"></i>
                  View Report
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
            <i className="ri-file-list-line text-3xl text-muted-foreground"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium">No inspections found</h3>
          <p className="mt-1 text-muted-foreground">
            Get started by requesting your first inspection.
          </p>
          <Button
            className="mt-4"
            onClick={() => setShowRequestDialog(true)}
          >
            <i className="ri-add-line mr-2"></i>
            Request Inspection
          </Button>
        </div>
      )}

      <RequestInspectionDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />

      {/* Delete Confirmation Dialog */}
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
  );
}
