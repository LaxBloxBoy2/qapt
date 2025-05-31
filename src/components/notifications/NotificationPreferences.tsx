"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  useGetNotificationPreferences,
  useUpdateNotificationPreferences
} from '@/hooks/useNotifications';

const notificationTypes = [
  {
    key: 'maintenance_enabled',
    label: 'Maintenance Requests',
    description: 'Get notified about new maintenance requests and status updates',
    icon: 'ri-tools-line',
  },
  {
    key: 'finance_enabled',
    label: 'Financial Transactions',
    description: 'Receive notifications for income, expenses, and payment updates',
    icon: 'ri-money-dollar-circle-line',
  },
  {
    key: 'inspection_enabled',
    label: 'Inspections',
    description: 'Stay updated on inspection schedules and completions',
    icon: 'ri-search-eye-line',
  },
  {
    key: 'lease_enabled',
    label: 'Lease Management',
    description: 'Get alerts for lease renewals, expirations, and status changes',
    icon: 'ri-file-text-line',
  },
  {
    key: 'application_enabled',
    label: 'Tenant Applications',
    description: 'Receive notifications for new applications and status updates',
    icon: 'ri-user-add-line',
  },
  {
    key: 'tenant_enabled',
    label: 'Tenant Activities',
    description: 'Get notified about tenant-related activities and updates',
    icon: 'ri-user-line',
  },
  {
    key: 'property_enabled',
    label: 'Property Updates',
    description: 'Stay informed about property changes and important updates',
    icon: 'ri-home-line',
  },
  {
    key: 'system_enabled',
    label: 'System Notifications',
    description: 'Receive important system alerts and announcements',
    icon: 'ri-settings-line',
  },
];

const deliveryMethods = [
  {
    key: 'push_notifications',
    label: 'In-App Notifications',
    description: 'Show notifications in the application interface',
    icon: 'ri-notification-3-line',
  },
  {
    key: 'email_notifications',
    label: 'Email Notifications',
    description: 'Send notifications to your email address',
    icon: 'ri-mail-line',
  },
];

export function NotificationPreferences() {
  const { toast } = useToast();
  const { data: preferences, isLoading } = useGetNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Update local state when preferences are loaded
  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: string, value: boolean) => {
    setLocalPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    try {
      await updatePreferences.mutateAsync(localPreferences);
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  if (!localPreferences) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <i className="ri-error-warning-line text-4xl text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Unable to Load Preferences</h3>
          <p className="text-muted-foreground">
            There was an error loading your notification preferences.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(localPreferences);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-notification-3-line" />
            Notification Types
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose which types of notifications you want to receive
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <i className={`${type.icon} text-lg`} />
                </div>
                <div>
                  <Label htmlFor={type.key} className="text-sm font-medium">
                    {type.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
              <Switch
                id={type.key}
                checked={localPreferences[type.key as keyof typeof localPreferences] as boolean}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-send-plane-line" />
            Delivery Methods
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryMethods.map((method) => (
            <div key={method.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <i className={`${method.icon} text-lg`} />
                </div>
                <div>
                  <Label htmlFor={method.key} className="text-sm font-medium">
                    {method.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {method.description}
                  </p>
                </div>
              </div>
              <Switch
                id={method.key}
                checked={localPreferences[method.key as keyof typeof localPreferences] as boolean}
                onCheckedChange={(checked) => handleToggle(method.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {hasChanges && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                You have unsaved changes to your notification preferences.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updatePreferences.isPending}
                >
                  {updatePreferences.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
