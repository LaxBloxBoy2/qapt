"use client";

import { useState } from "react";
import { MaintenanceRequest, MaintenanceStatus } from "@/types/maintenance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getMaintenanceStatusBadge, getMaintenancePriorityBadge } from "@/utils/maintenanceBadges";

interface MaintenanceDetailHeaderProps {
  request: MaintenanceRequest;
  onStatusChange: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onDuplicate?: () => void;
  onMarkUrgent?: () => void;
  onArchive?: () => void;
}

export function MaintenanceDetailHeader({
  request,
  onStatusChange,
  onEdit,
  onDelete,
  onBack,
  onDuplicate,
  onMarkUrgent,
  onArchive,
}: MaintenanceDetailHeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: MaintenanceStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRequestId = () => {
    // Generate a display ID from the actual ID (first 8 characters)
    return `#${request.id.substring(0, 8).toUpperCase()}`;
  };

  const getCategoryPath = () => {
    // Build category path based on type and property
    const parts = [];
    if (request.property?.name) parts.push(request.property.name);
    if (request.unit?.name) parts.push(request.unit.name);
    parts.push(request.type.charAt(0).toUpperCase() + request.type.slice(1));
    return parts.join(" / ");
  };

  const statusOptions = [
    { value: "open", label: "Open", icon: "ri-play-circle-line" },
    { value: "assigned", label: "Assigned", icon: "ri-user-line" },
    { value: "in_progress", label: "In Progress", icon: "ri-settings-3-line" },
    { value: "resolved", label: "Resolved", icon: "ri-check-double-line" },
    { value: "cancelled", label: "Cancelled", icon: "ri-close-circle-line" },
    { value: "rejected", label: "Rejected", icon: "ri-close-line" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b">
      <div className="space-y-2">
        {/* Request ID */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{getRequestId()}</h1>
          {getMaintenanceStatusBadge(request.status)}
          {getMaintenancePriorityBadge(request.priority)}
        </div>

        {/* Category Path */}
        <p className="text-muted-foreground text-sm">
          {getCategoryPath()}
        </p>

        {/* Title */}
        <h2 className="text-lg font-medium">{request.title}</h2>

        {/* Created Date */}
        <p className="text-xs text-muted-foreground">
          Created {new Date(request.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Back Button */}
        <Button variant="outline" onClick={onBack}>
          <i className="ri-arrow-left-line mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Change Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isUpdating}>
              <i className="ri-refresh-line mr-2 h-4 w-4" />
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusChange(option.value as MaintenanceStatus)}
                disabled={option.value === request.status}
              >
                <i className={`${option.icon} mr-2 h-4 w-4`} />
                {option.label}
                {option.value === request.status && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Current
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Chat Button (Future) */}
        <Button variant="outline" disabled>
          <i className="ri-message-line mr-2 h-4 w-4" />
          Chat
        </Button>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <i className="ri-more-line h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <i className="ri-edit-line mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <i className="ri-file-copy-line mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMarkUrgent}>
              <i className="ri-alarm-warning-line mr-2 h-4 w-4" />
              Mark as Urgent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive}>
              <i className="ri-archive-line mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <i className="ri-delete-bin-line mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
