"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMaintenanceRequest, useUpdateMaintenanceRequest, useDeleteMaintenanceRequest } from "@/hooks/useMaintenance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMaintenanceStatusBadge, getMaintenancePriorityBadge } from "@/utils/maintenanceBadges";
import { MaintenanceDetailHeader } from "./detail/MaintenanceDetailHeader";
import { MaintenancePropertySection } from "./detail/MaintenancePropertySection";
import { MaintenanceMediaSection } from "./detail/MaintenanceMediaSection";
import { MaintenanceAssigneeSection } from "./detail/MaintenanceAssigneeSection";
import { MaintenanceTenantSection } from "./detail/MaintenanceTenantSection";
import { MaintenanceMaterialsSection } from "./detail/MaintenanceMaterialsSection";
import { MaintenanceEquipmentSection } from "./detail/MaintenanceEquipmentSection";
import { MaintenanceCostSection } from "./detail/MaintenanceCostSection";
import { MaintenanceAttachmentsSection } from "./detail/MaintenanceAttachmentsSection";
import { MaintenanceCommentsSection } from "./detail/MaintenanceCommentsSection";
import { MaintenanceStatusHistory } from "./detail/MaintenanceStatusHistory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MaintenanceDetailProps {
  requestId: string;
}

export function MaintenanceDetail({ requestId }: MaintenanceDetailProps) {
  const router = useRouter();
  const { data: request, isLoading, error } = useMaintenanceRequest(requestId);
  const updateRequest = useUpdateMaintenanceRequest();
  const deleteRequest = useDeleteMaintenanceRequest();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <div className="inline-block rounded-full p-3 bg-red-100 dark:bg-red-900">
          <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-300"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium">Request Not Found</h3>
        <p className="mt-1 text-muted-foreground">
          The maintenance request could not be found or you don't have permission to view it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/maintenance")}
        >
          Back to Maintenance
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteRequest.mutateAsync(requestId);
      router.push("/maintenance");
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRequest.mutateAsync({
        id: requestId,
        updates: { status: newStatus as any }
      });
      // The query invalidation in the hook will automatically refresh the UI
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDuplicate = () => {
    // Navigate to create new request with pre-filled data
    router.push(`/maintenance?duplicate=${requestId}`);
  };

  const handleMarkUrgent = async () => {
    try {
      await updateRequest.mutateAsync({
        id: requestId,
        updates: { priority: 'urgent' as any }
      });
    } catch (error) {
      console.error("Error marking as urgent:", error);
    }
  };

  const handleArchive = async () => {
    try {
      await updateRequest.mutateAsync({
        id: requestId,
        updates: { status: 'archived' as any }
      });
    } catch (error) {
      console.error("Error archiving request:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <MaintenanceDetailHeader
        request={request}
        onStatusChange={handleStatusChange}
        onEdit={() => setIsEditing(true)}
        onDelete={() => setShowDeleteDialog(true)}
        onBack={() => router.push("/maintenance")}
        onDuplicate={handleDuplicate}
        onMarkUrgent={handleMarkUrgent}
        onArchive={handleArchive}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property & Description */}
          <MaintenancePropertySection request={request} isEditing={isEditing} />

          {/* Media */}
          <MaintenanceMediaSection requestId={requestId} />

          {/* Materials */}
          <MaintenanceMaterialsSection requestId={requestId} />

          {/* Equipment */}
          <MaintenanceEquipmentSection requestId={requestId} request={request} />

          {/* Cost Tracking */}
          <MaintenanceCostSection request={request} />

          {/* Attachments */}
          <MaintenanceAttachmentsSection requestId={requestId} />

          {/* Comments & Activity */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="history">Status History</TabsTrigger>
            </TabsList>
            <TabsContent value="comments">
              <MaintenanceCommentsSection requestId={requestId} />
            </TabsContent>
            <TabsContent value="history">
              <MaintenanceStatusHistory requestId={requestId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Assignee Information */}
          <MaintenanceAssigneeSection request={request} />

          {/* Tenant Information */}
          <MaintenanceTenantSection request={request} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded">
                <strong>{request.title}</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
