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
import { useGetAppliances } from "@/hooks/useAppliances";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceEquipment, useUpdateMaintenanceEquipment } from "@/hooks/useMaintenance";

interface LinkedEquipment {
  id: string;
  name: string;
  category: string;
  status: string;
  lastMaintenance?: string;
}

interface MaintenanceEquipmentSectionProps {
  requestId: string;
  request: MaintenanceRequest;
}

export function MaintenanceEquipmentSection({ requestId, request }: MaintenanceEquipmentSectionProps) {
  const { toast } = useToast();
  const { data: allAppliances } = useGetAppliances();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState("");

  // Use real database hooks
  const { data: linkedEquipment = [], isLoading } = useMaintenanceEquipment(requestId);
  const updateEquipment = useUpdateMaintenanceEquipment();

  // Filter appliances by property
  const propertyAppliances = allAppliances?.filter(
    appliance => appliance.property_id === request.property?.id
  ) || [];

  const handleLinkEquipment = async () => {
    const appliance = propertyAppliances.find(a => a.id === selectedEquipment);
    if (!appliance) return;

    const equipment: LinkedEquipment = {
      id: appliance.id,
      name: appliance.name,
      category: appliance.category?.name || 'Unknown',
      status: appliance.status,
      lastMaintenance: appliance.last_maintenance_date,
    };

    try {
      await updateEquipment.mutateAsync({
        requestId,
        equipment: [...linkedEquipment, equipment]
      });

      setSelectedEquipment("");
      setShowLinkDialog(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUnlinkEquipment = async (equipmentId: string) => {
    try {
      await updateEquipment.mutateAsync({
        requestId,
        equipment: linkedEquipment.filter(e => e.id !== equipmentId)
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'HVAC': 'ri-temp-cold-line',
      'Kitchen': 'ri-fridge-line',
      'Laundry': 'ri-shirt-line',
      'Plumbing': 'ri-drop-line',
      'Electrical': 'ri-flashlight-line',
      'Security': 'ri-shield-line',
      'Cleaning': 'ri-brush-line',
    };
    return iconMap[category] || 'ri-tools-line';
  };

  const availableEquipment = propertyAppliances.filter(
    appliance => !linkedEquipment.some(linked => linked.id === appliance.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Equipment</span>
          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={availableEquipment.length === 0}>
                <i className="ri-link mr-1 h-3 w-3" />
                Link Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link Equipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select equipment from {request.property?.name} to link to this maintenance request.
                  This helps track maintenance history per device.
                </p>

                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map((appliance) => (
                      <SelectItem key={appliance.id} value={appliance.id}>
                        <div className="flex items-center gap-2">
                          <i className={`${getCategoryIcon(appliance.category?.name || '')} h-4 w-4`} />
                          <span>{appliance.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {appliance.category?.name}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLinkDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLinkEquipment}
                    disabled={!selectedEquipment}
                  >
                    Link Equipment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {linkedEquipment.length > 0 ? (
          <div className="space-y-3">
            {linkedEquipment.map((equipment) => (
              <div
                key={equipment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <i className={`${getCategoryIcon(equipment.category)} h-4 w-4 text-primary`} />
                  </div>
                  <div>
                    <p className="font-medium">{equipment.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {equipment.category}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(equipment.status)}`}>
                        {equipment.status}
                      </Badge>
                    </div>
                    {equipment.lastMaintenance && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last maintenance: {new Date(equipment.lastMaintenance).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleUnlinkEquipment(equipment.id)}
                >
                  <i className="ri-unlink h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <i className="ri-tools-line text-4xl mb-2 block" />
            <p className="text-sm">No equipment linked</p>
            {availableEquipment.length > 0 ? (
              <p className="text-xs">Click "Link Equipment" to connect appliances</p>
            ) : (
              <p className="text-xs">No equipment available for this property</p>
            )}
          </div>
        )}

        {/* Equipment Summary */}
        {linkedEquipment.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Linked equipment will have this maintenance recorded in their history for tracking purposes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
