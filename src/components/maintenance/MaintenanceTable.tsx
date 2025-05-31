"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from "@/types/maintenance";
import { useDeleteMaintenanceRequest, useUpdateMaintenanceRequest } from "@/hooks/useMaintenance";
import { format, formatDistanceToNow } from "date-fns";
import { getMaintenanceStatusBadge, getMaintenancePriorityBadge } from "@/utils/maintenanceBadges";

interface MaintenanceTableProps {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function MaintenanceTable({ requests, isLoading, onRefresh }: MaintenanceTableProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const deleteRequest = useDeleteMaintenanceRequest();
  const updateRequest = useUpdateMaintenanceRequest();

  // Use shared utility functions for consistent badge colors

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      plumbing: { icon: "ri-drop-line", color: "bg-blue-100 text-blue-700 border-blue-200" },
      electrical: { icon: "ri-flashlight-line", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      hvac: { icon: "ri-temp-cold-line", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
      appliance: { icon: "ri-fridge-line", color: "bg-purple-100 text-purple-700 border-purple-200" },
      cleaning: { icon: "ri-brush-line", color: "bg-green-100 text-green-700 border-green-200" },
      landscaping: { icon: "ri-plant-line", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      security: { icon: "ri-shield-line", color: "bg-red-100 text-red-700 border-red-200" },
      general: { icon: "ri-tools-line", color: "bg-gray-100 text-gray-700 border-gray-200" },
      other: { icon: "ri-more-line", color: "bg-gray-100 text-gray-700 border-gray-200" },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;

    return (
      <Badge variant="outline" className={`${config.color} text-xs font-medium px-2 py-1 h-6`}>
        <i className={`${config.icon} h-3 w-3 mr-1`} />
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

  const formatRelativeDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleViewDetails = (request: MaintenanceRequest) => {
    router.push(`/maintenance/${request.id}`);
  };

  const handleStatusChange = async (request: MaintenanceRequest, newStatus: MaintenanceStatus) => {
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        updates: { status: newStatus }
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedRequest) {
      try {
        await deleteRequest.mutateAsync(selectedRequest.id);
        setShowDeleteDialog(false);
        setSelectedRequest(null);
      } catch (error) {
        console.error("Error deleting request:", error);
        // Dialog will stay open to show the error via toast
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    let aValue: any = a[sortField as keyof MaintenanceRequest];
    let bValue: any = b[sortField as keyof MaintenanceRequest];

    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Requests</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track all maintenance requests</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {requests.length} {requests.length === 1 ? 'request' : 'requests'}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      {sortedRequests.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-tools-line text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No maintenance requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRequests.map((request) => (
            <Card key={request.id} className="group hover:shadow-lg hover:border-blue-200 transition-all duration-200 border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-6">
                  {/* Left Side - Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getMaintenanceStatusBadge(request.status)}
                        <h3
                          className="font-semibold text-gray-900 text-lg hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => handleViewDetails(request)}
                        >
                          {request.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMaintenancePriorityBadge(request.priority)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <i className="ri-more-line h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewDetails(request)} className="text-sm">
                              <i className="ri-eye-line mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {request.status !== "resolved" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(request, "in_progress")} className="text-sm">
                                  <i className="ri-play-line mr-2 h-4 w-4" />
                                  Start Work
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(request, "resolved")} className="text-sm">
                                  <i className="ri-check-line mr-2 h-4 w-4" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 text-sm"
                              onClick={() => handleDelete(request)}
                            >
                              <i className="ri-delete-bin-line mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                      {request.description}
                    </p>

                    {/* Bottom Row - Property, Type, Assignee, Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {/* Property & Unit */}
                        <div className="flex items-center gap-2 text-sm">
                          <i className="ri-building-line h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{request.property?.name}</span>
                          {request.unit && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">Unit {request.unit.name}</span>
                            </>
                          )}
                        </div>

                        {/* Type */}
                        <div className="flex items-center gap-2">
                          {getTypeBadge(request.type)}
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center gap-2 text-sm">
                          <i className="ri-user-line h-4 w-4 text-gray-400" />
                          {request.assigned_to ? (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-700">{request.assigned_to.name}</span>
                              <span className="text-gray-500">({request.assigned_to.type})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="ri-calendar-line h-4 w-4" />
                        <span>{formatRelativeDate(request.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
              {selectedRequest && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>{selectedRequest.title}</strong>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
