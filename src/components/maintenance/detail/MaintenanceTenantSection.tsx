"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MaintenanceRequest } from "@/types/maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUpdateMaintenanceRequest } from "@/hooks/useMaintenance";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaintenanceTenantSectionProps {
  request: MaintenanceRequest;
}

export function MaintenanceTenantSection({ request }: MaintenanceTenantSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updateRequest = useUpdateMaintenanceRequest();
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [tenantInfo, setTenantInfo] = useState({
    canEnterIfNotHome: false,
    alarmCode: "",
    petsPresent: false,
    petDetails: "",
    preferredTimes: ["", "", ""],
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Load existing tenant settings from the request
  useEffect(() => {
    if (request.tenant_access_settings) {
      try {
        const settings = typeof request.tenant_access_settings === 'string'
          ? JSON.parse(request.tenant_access_settings)
          : request.tenant_access_settings;

        setTenantInfo({
          canEnterIfNotHome: settings.canEnterIfNotHome || false,
          alarmCode: settings.alarmCode || "",
          petsPresent: settings.petsPresent || false,
          petDetails: settings.petDetails || "",
          preferredTimes: settings.preferredTimes || ["", "", ""],
        });
      } catch (error) {
        console.error("Error parsing tenant access settings:", error);
      }
    }
  }, [request.tenant_access_settings]);

  const handleTenantClick = () => {
    if (request.requested_by?.id) {
      router.push(`/tenants/${request.requested_by.id}`);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  const handlePreferredTimeChange = (index: number, value: string) => {
    const newTimes = [...tenantInfo.preferredTimes];
    newTimes[index] = value;
    setTenantInfo(prev => ({ ...prev, preferredTimes: newTimes }));
  };

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        updates: {
          tenant_access_settings: JSON.stringify(tenantInfo)
        }
      });

      toast({
        title: "Settings Saved",
        description: "Tenant access settings have been saved successfully.",
      });
      setShowTenantDialog(false);
    } catch (error) {
      console.error("Error saving tenant settings:", error);
      toast({
        title: "Error",
        description: "Failed to save tenant access settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tenant Information</span>
          <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <i className="ri-settings-line mr-1 h-3 w-3" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tenant Access Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Authorization */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Can enter if not home</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow maintenance access when tenant is away
                    </p>
                  </div>
                  <Switch
                    checked={tenantInfo.canEnterIfNotHome}
                    onCheckedChange={(checked) =>
                      setTenantInfo(prev => ({ ...prev, canEnterIfNotHome: checked }))
                    }
                  />
                </div>

                {/* Alarm Code */}
                <div className="space-y-2">
                  <Label htmlFor="alarmCode">Alarm Code</Label>
                  <Input
                    id="alarmCode"
                    type="password"
                    placeholder="Enter alarm code"
                    value={tenantInfo.alarmCode}
                    onChange={(e) =>
                      setTenantInfo(prev => ({ ...prev, alarmCode: e.target.value }))
                    }
                  />
                </div>

                {/* Pets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Pets present</Label>
                    <Switch
                      checked={tenantInfo.petsPresent}
                      onCheckedChange={(checked) =>
                        setTenantInfo(prev => ({ ...prev, petsPresent: checked }))
                      }
                    />
                  </div>
                  {tenantInfo.petsPresent && (
                    <Input
                      placeholder="Pet details (type, behavior, etc.)"
                      value={tenantInfo.petDetails}
                      onChange={(e) =>
                        setTenantInfo(prev => ({ ...prev, petDetails: e.target.value }))
                      }
                    />
                  )}
                </div>

                {/* Preferred Times */}
                <div className="space-y-2">
                  <Label>Preferred repair times (up to 3)</Label>
                  {tenantInfo.preferredTimes.map((time, index) => (
                    <Input
                      key={index}
                      type="datetime-local"
                      value={time}
                      onChange={(e) => handlePreferredTimeChange(index, e.target.value)}
                      placeholder={`Preferred time ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTenantDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {request.requested_by ? (
          <div className="space-y-4">
            {/* Tenant Info */}
            <div
              className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              onClick={handleTenantClick}
            >
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {getInitials(request.requested_by.first_name, request.requested_by.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {request.requested_by.first_name} {request.requested_by.last_name}
                </p>
                {request.requested_by.email && (
                  <p className="text-sm text-muted-foreground truncate">
                    {request.requested_by.email}
                  </p>
                )}
                {request.requested_by.phone && (
                  <p className="text-sm text-muted-foreground">
                    {request.requested_by.phone}
                  </p>
                )}
              </div>
              <i className="ri-external-link-line h-4 w-4 text-muted-foreground" />
            </div>

            {/* Access Information */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Access when away:</span>
                <Badge variant={tenantInfo.canEnterIfNotHome ? "default" : "secondary"}>
                  {tenantInfo.canEnterIfNotHome ? "Allowed" : "Not allowed"}
                </Badge>
              </div>

              {tenantInfo.alarmCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Alarm code:</span>
                  <Badge variant="outline">Set</Badge>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pets:</span>
                <Badge variant={tenantInfo.petsPresent ? "destructive" : "secondary"}>
                  {tenantInfo.petsPresent ? "Present" : "None"}
                </Badge>
              </div>
            </div>

            {/* Preferred Times */}
            {tenantInfo.preferredTimes.some(time => time) && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Preferred repair times:</p>
                <div className="space-y-1">
                  {tenantInfo.preferredTimes
                    .filter(time => time)
                    .map((time, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        {new Date(time).toLocaleString()}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {/* Settings Button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <i className="ri-settings-line mr-1 h-3 w-3" />
                Settings
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <i className="ri-user-line text-3xl mb-2 block" />
            <p className="text-sm">No tenant information</p>
            <p className="text-xs">Request not linked to a tenant</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
