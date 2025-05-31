"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaintenanceRequest } from "@/types/maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateMaintenanceRequest } from "@/hooks/useMaintenance";

interface MaintenancePropertySectionProps {
  request: MaintenanceRequest;
  isEditing: boolean;
}

export function MaintenancePropertySection({ request, isEditing }: MaintenancePropertySectionProps) {
  const router = useRouter();
  const updateRequest = useUpdateMaintenanceRequest();
  const [description, setDescription] = useState(request.description);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveDescription = async () => {
    if (description === request.description) return;
    
    setIsUpdating(true);
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        updates: { description }
      });
    } catch (error) {
      console.error("Error updating description:", error);
      setDescription(request.description); // Reset on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePropertyClick = () => {
    if (request.property?.id) {
      router.push(`/properties/${request.property.id}`);
    }
  };

  const handleUnitClick = () => {
    if (request.unit?.id) {
      router.push(`/units/${request.unit.id}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Property & Description</span>
          <div className="flex items-center gap-2">
            {/* Property Badge */}
            {request.property && (
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={handlePropertyClick}
              >
                <i className="ri-building-line mr-1 h-3 w-3" />
                {request.property.name}
              </Badge>
            )}
            
            {/* Unit Badge */}
            {request.unit && (
              <Badge 
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={handleUnitClick}
              >
                <i className="ri-home-line mr-1 h-3 w-3" />
                {request.unit.name}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Address */}
        {request.property?.address && (
          <div className="text-sm text-muted-foreground">
            <i className="ri-map-pin-line mr-1 h-4 w-4 inline" />
            {request.property.address}
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the maintenance issue"
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDescription(request.description)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDescription}
                  disabled={isUpdating || description === request.description}
                >
                  {isUpdating ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">
                {request.description || "No description provided"}
              </p>
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <label className="text-xs text-muted-foreground">Type</label>
            <p className="text-sm font-medium capitalize">{request.type}</p>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground">Priority</label>
            <p className="text-sm font-medium capitalize">{request.priority}</p>
          </div>
          
          {request.due_date && (
            <div>
              <label className="text-xs text-muted-foreground">Due Date</label>
              <p className="text-sm font-medium">
                {new Date(request.due_date).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {request.estimated_cost && (
            <div>
              <label className="text-xs text-muted-foreground">Estimated Cost</label>
              <p className="text-sm font-medium">
                ${request.estimated_cost.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {request.tags && request.tags.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Tags</label>
            <div className="flex flex-wrap gap-1">
              {request.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
