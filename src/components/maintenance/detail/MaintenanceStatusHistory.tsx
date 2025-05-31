"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMaintenanceStatusHistory } from "@/hooks/useMaintenance";
import { getMaintenanceStatusBadge } from "@/utils/maintenanceBadges";

interface StatusHistoryEntry {
  id: string;
  from_status?: string;
  to_status: string;
  changed_by: {
    name: string;
    type: 'staff' | 'system';
  };
  changed_at: string;
  notes?: string;
}

interface MaintenanceStatusHistoryProps {
  requestId: string;
}

export function MaintenanceStatusHistory({ requestId }: MaintenanceStatusHistoryProps) {
  // Use real database hooks
  const { data: statusHistory = [], isLoading } = useMaintenanceStatusHistory(requestId);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return 'ri-play-circle-line';
      case 'assigned': return 'ri-user-line';
      case 'in_progress': return 'ri-settings-3-line';
      case 'resolved': return 'ri-check-double-line';
      case 'cancelled': return 'ri-close-circle-line';
      case 'rejected': return 'ri-close-line';
      default: return 'ri-circle-line';
    }
  };

  const getChangeDescription = (entry: StatusHistoryEntry) => {
    if (!entry.from_status) {
      return `Request created with status: ${entry.to_status.replace('_', ' ')}`;
    }
    return `Status changed from ${entry.from_status.replace('_', ' ')} to ${entry.to_status.replace('_', ' ')}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        {statusHistory.length > 0 ? (
          <div className="space-y-4">
            {statusHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <i className={`${getStatusIcon(entry.to_status)} h-4 w-4 text-primary`} />
                  </div>
                  {index < statusHistory.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getMaintenanceStatusBadge(entry.to_status as any)}
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>

                  <p className="text-sm font-medium">
                    {getChangeDescription(entry)}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>by {entry.changed_by_type === 'team' ? 'Team Member' : entry.changed_by_type === 'tenant' ? 'Tenant' : 'Vendor'}</span>
                    <Badge variant="outline" className="text-xs">
                      {entry.changed_by_type}
                    </Badge>
                  </div>

                  {entry.notes && (
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <i className="ri-history-line text-4xl mb-2 block" />
            <p className="text-sm">No status history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
