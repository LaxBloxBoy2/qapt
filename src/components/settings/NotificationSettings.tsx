"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/useSettings";
import { useState } from "react";

const notificationCategories = [
  {
    key: 'lease_renewals',
    title: 'Lease Renewals',
    description: 'Get notified when leases are approaching expiration',
    icon: 'ri-file-text-line',
  },
  {
    key: 'rent_overdue',
    title: 'Overdue Rent',
    description: 'Alerts when rent payments are late',
    icon: 'ri-money-dollar-circle-line',
  },
  {
    key: 'maintenance_updates',
    title: 'Maintenance Updates',
    description: 'Updates on maintenance requests and completions',
    icon: 'ri-tools-line',
  },
  {
    key: 'inspection_reminders',
    title: 'Inspection Reminders',
    description: 'Reminders for scheduled property inspections',
    icon: 'ri-search-eye-line',
  },
  {
    key: 'payment_confirmations',
    title: 'Payment Confirmations',
    description: 'Confirmations when payments are received',
    icon: 'ri-check-double-line',
  },
  {
    key: 'system_updates',
    title: 'System Updates',
    description: 'Important system announcements and updates',
    icon: 'ri-notification-line',
  },
  {
    key: 'marketing_emails',
    title: 'Marketing Emails',
    description: 'Product updates, tips, and promotional content',
    icon: 'ri-mail-line',
  },
];

export function NotificationSettings() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local state when settings load
  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggle = async (key: string, type: 'email' | 'in_app', value: boolean) => {
    if (!localSettings) return;

    const newSettings = { ...localSettings };

    if (type === 'email') {
      // If toggling email for a specific category, update that category
      if (key !== 'email_enabled') {
        newSettings[key as keyof typeof newSettings] = value;
      } else {
        // If toggling master email switch, update the global setting
        newSettings.email_enabled = value;
      }
    } else {
      // If toggling in-app for a specific category, update that category
      if (key !== 'in_app_enabled') {
        newSettings[key as keyof typeof newSettings] = value;
      } else {
        // If toggling master in-app switch, update the global setting
        newSettings.in_app_enabled = value;
      }
    }

    setLocalSettings(newSettings);

    try {
      await updateSettings.mutateAsync(newSettings);
    } catch (error) {
      // Revert on error
      setLocalSettings(settings);
    }
  };

  const handleMasterToggle = async (type: 'email_enabled' | 'in_app_enabled', value: boolean) => {
    if (!localSettings) return;

    const newSettings = { ...localSettings, [type]: value };
    setLocalSettings(newSettings);

    try {
      await updateSettings.mutateAsync(newSettings);
    } catch (error) {
      // Revert on error
      setLocalSettings(settings);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!localSettings) return null;

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Control how you receive notifications from QAPT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={localSettings.email_enabled}
              onCheckedChange={(checked) => handleMasterToggle('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the application
              </p>
            </div>
            <Switch
              checked={localSettings.in_app_enabled}
              onCheckedChange={(checked) => handleMasterToggle('in_app_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notificationCategories.map((category) => (
              <div key={category.key} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <i className={`${category.icon} text-primary`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-base font-medium">{category.title}</Label>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="ml-11 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={localSettings[category.key as keyof typeof localSettings] as boolean}
                      onCheckedChange={(checked) => handleToggle(category.key, 'email', checked)}
                      disabled={!localSettings.email_enabled}
                    />
                    <Label className="text-sm">Email</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={localSettings[category.key as keyof typeof localSettings] as boolean}
                      onCheckedChange={(checked) => handleToggle(category.key, 'in_app', checked)}
                      disabled={!localSettings.in_app_enabled}
                    />
                    <Label className="text-sm">In-App</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Send test notifications to verify your settings are working.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <i className="ri-mail-line mr-2" />
              Send Test Email
            </Button>
            <Button variant="outline" size="sm">
              <i className="ri-notification-line mr-2" />
              Show Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
