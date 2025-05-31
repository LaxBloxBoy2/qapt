"use client";

import { useState } from "react";
import { MaintenanceRequest } from "@/types/maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignees, useUpdateMaintenanceRequest } from "@/hooks/useMaintenance";

interface MaintenanceAssigneeSectionProps {
  request: MaintenanceRequest;
}

export function MaintenanceAssigneeSection({ request }: MaintenanceAssigneeSectionProps) {
  const { data: assignees } = useAssignees();
  const updateRequest = useUpdateMaintenanceRequest();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAssign = async () => {
    if (!selectedAssignee) return;

    setIsUpdating(true);
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        updates: {
          assigned_to_id: selectedAssignee,
          assigned_to_type: assignees?.find(a => a.id === selectedAssignee)?.type === 'internal' ? 'internal' : 'external'
        }
      });
      setShowAssignDialog(false);
      setSelectedAssignee("");
    } catch (error) {
      console.error("Error assigning request:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnassign = async () => {
    setIsUpdating(true);
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        updates: {
          assigned_to_id: null,
          assigned_to_type: null
        }
      });
    } catch (error) {
      console.error("Error unassigning request:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailabilityStatus = () => {
    // Mock availability - in real app this would come from the assignee data
    const statuses = ['available', 'busy', 'away'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstimatedArrival = () => {
    // Mock estimated arrival - in real app this would be calculated
    const hours = Math.floor(Math.random() * 4) + 1;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Assignee</span>
          {request.assigned_to ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnassign}
              disabled={isUpdating}
            >
              <i className="ri-user-unfollow-line mr-1 h-3 w-3" />
              Unassign
            </Button>
          ) : (
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <i className="ri-user-add-line mr-1 h-3 w-3" />
                  Assign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Maintenance Worker</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees?.map((assignee) => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignee.type === 'internal' ? 'default' : 'secondary'}>
                              {assignee.type}
                            </Badge>
                            {assignee.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssign}
                      disabled={!selectedAssignee || isUpdating}
                    >
                      {isUpdating ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {request.assigned_to ? (
          <div className="space-y-4">
            {/* Assignee Info */}
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {getInitials(request.assigned_to.name)}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getAvailabilityColor(getAvailabilityStatus())}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{request.assigned_to.name}</p>
                  <Badge variant={request.assigned_to.type === 'internal' ? 'default' : 'secondary'}>
                    {request.assigned_to.type}
                  </Badge>
                </div>
                {request.assigned_to.email && (
                  <p className="text-sm text-muted-foreground truncate">
                    {request.assigned_to.email}
                  </p>
                )}
                {request.assigned_to.phone && (
                  <p className="text-sm text-muted-foreground">
                    {request.assigned_to.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Status & Availability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="capitalize">
                  {getAvailabilityStatus()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Est. Arrival:</span>
                <span className="font-medium">{getEstimatedArrival()}</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Contact information available in team directory
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <i className="ri-user-line text-3xl mb-2 block" />
            <p className="text-sm">No assignee selected</p>
            <p className="text-xs">Click "Assign" to assign a worker</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
