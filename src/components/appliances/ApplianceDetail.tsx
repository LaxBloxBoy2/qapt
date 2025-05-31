"use client";

import { useGetAppliance, useGetApplianceAttachments, useGetApplianceCheckups, useUpdateAppliance } from "@/hooks/useAppliances";
import { Appliance } from "@/types/appliance";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { StorageImage } from "../ui/storage-image";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ApplianceForm } from "./ApplianceForm";
import { ApplianceAttachmentUpload } from "./ApplianceAttachmentUpload";
import { supabase } from "@/lib/supabase";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { useDeleteAppliance } from "@/hooks/useAppliances";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

interface ApplianceDetailProps {
  applianceId: string;
}

export function ApplianceDetail({ applianceId }: ApplianceDetailProps) {
  const router = useRouter();
  const { data: appliance, isLoading } = useGetAppliance(applianceId);
  const { data: checkups } = useGetApplianceCheckups(applianceId);
  const { data: attachments } = useGetApplianceAttachments(applianceId);
  const deleteAppliance = useDeleteAppliance();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);

  // Get the property name
  const { data: property } = useQuery({
    queryKey: ["property", appliance?.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("name")
        .eq("id", appliance?.property_id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!appliance?.property_id,
  });

  // Get the category name
  const { data: category } = useQuery({
    queryKey: ["appliance-category", appliance?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appliance_categories")
        .select("name")
        .eq("id", appliance?.category_id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!appliance?.category_id,
  });

  if (isLoading || !appliance) {
    return <div>Loading...</div>;
  }

  const handleDelete = async () => {
    try {
      await deleteAppliance.mutateAsync(applianceId);
      router.push("/appliances");
    } catch (error) {
      console.error("Error deleting appliance:", error);
    }
  };

  const handleUnassign = async () => {
    try {
      await useUpdateAppliance().mutateAsync({
        id: applianceId,
        appliance: {
          property_id: null as any, // This will be caught by the backend validation
          status: "retired"
        }
      });
    } catch (error) {
      console.error("Error unassigning appliance:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <i className="ri-device-line text-2xl text-primary"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{appliance.name}</h1>
            <p className="text-muted-foreground">
              {category?.name} {appliance.sub_category ? `- ${appliance.sub_category}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <i className="ri-edit-line mr-2"></i>
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Appliance</DialogTitle>
                <DialogDescription>
                  Make changes to your appliance here.
                </DialogDescription>
              </DialogHeader>
              <ApplianceForm
                appliance={appliance}
                onSuccess={() => setShowEditDialog(false)}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <i className="ri-link-unlink-m mr-2"></i>
                Unassign
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unassign Appliance</AlertDialogTitle>
                <AlertDialogDescription>
                  This will unassign the appliance from its current property and mark it as retired.
                  Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnassign}>
                  Unassign
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <i className="ri-delete-bin-line mr-2"></i>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Appliance</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  appliance and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checkups">Check-ups</TabsTrigger>
          <TabsTrigger value="requests">Related Requests</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm">
                    <Badge>
                      {appliance.status.charAt(0).toUpperCase() + appliance.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="text-sm font-medium">Property</div>
                  <div className="text-sm">{property?.name || "N/A"}</div>

                  <div className="text-sm font-medium">Brand</div>
                  <div className="text-sm">{appliance.brand || "N/A"}</div>

                  <div className="text-sm font-medium">Model</div>
                  <div className="text-sm">{appliance.model || "N/A"}</div>

                  <div className="text-sm font-medium">Serial Number</div>
                  <div className="text-sm">{appliance.serial_number || "N/A"}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dates & Price</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-sm font-medium">Installation Date</div>
                  <div className="text-sm">
                    {appliance.installation_date
                      ? format(new Date(appliance.installation_date), "MMM d, yyyy")
                      : "N/A"}
                  </div>

                  <div className="text-sm font-medium">Warranty Expiration</div>
                  <div className="text-sm">
                    {appliance.warranty_expiration
                      ? format(new Date(appliance.warranty_expiration), "MMM d, yyyy")
                      : "N/A"}
                  </div>

                  <div className="text-sm font-medium">Price</div>
                  <div className="text-sm">
                    {appliance.price
                      ? `$${appliance.price.toFixed(2)}`
                      : "N/A"}
                  </div>

                  <div className="text-sm font-medium">Added On</div>
                  <div className="text-sm">
                    {format(new Date(appliance.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Image</CardTitle>
              </CardHeader>
              <CardContent>
                {appliance.image_url ? (
                  <StorageImage
                    src={appliance.image_url}
                    alt={appliance.name}
                    className="w-full h-40 rounded-md"
                    onLoadingError={(error) => {
                      console.error('Error loading appliance image:', error.message);
                    }}
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">No image available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {appliance.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{appliance.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checkups" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Scheduled Check-ups</CardTitle>
                <Button size="sm">
                  <i className="ri-calendar-check-line mr-2"></i>
                  Schedule Check-up
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {checkups && checkups.length > 0 ? (
                <div className="space-y-4">
                  {checkups.map((checkup) => (
                    <div key={checkup.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{checkup.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Scheduled for: {format(new Date(checkup.scheduled_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge>
                          {checkup.status.charAt(0).toUpperCase() + checkup.status.slice(1)}
                        </Badge>
                      </div>
                      {checkup.description && (
                        <p className="mt-2 text-sm">{checkup.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No check-ups scheduled.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Maintenance Requests</CardTitle>
                <Button size="sm">
                  <i className="ri-tools-line mr-2"></i>
                  Create Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No maintenance requests found.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Attachments</CardTitle>
                <Button size="sm" onClick={() => setShowAttachmentDialog(true)}>
                  <i className="ri-attachment-2 mr-2"></i>
                  Add Attachment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attachments && attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-md p-4">
                      <div className="flex items-center space-x-2">
                        <i className="ri-file-line text-xl text-primary"></i>
                        <div className="w-full overflow-hidden">
                          <h3 className="font-medium truncate max-w-[180px] md:max-w-[220px] lg:max-w-[250px]" title={attachment.name}>
                            {attachment.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(attachment.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" asChild>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            <i className="ri-download-line mr-1"></i>
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No attachments found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attachment Upload Dialog */}
      <ApplianceAttachmentUpload
        applianceId={applianceId}
        open={showAttachmentDialog}
        onOpenChange={setShowAttachmentDialog}
      />
    </div>
  );
}
