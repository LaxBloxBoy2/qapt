"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AppPreferences } from "@/components/settings/AppPreferences";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { Integrations } from "@/components/settings/Integrations";
import { BillingSubscription } from "@/components/settings/BillingSubscription";

const settingsTabs = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'ri-user-line',
    component: ProfileSettings,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: 'ri-settings-line',
    component: AppPreferences,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'ri-notification-line',
    component: NotificationSettings,
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'ri-team-line',
    component: TeamManagement,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'ri-apps-line',
    component: Integrations,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: 'ri-bank-card-line',
    component: BillingSubscription,
  },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {settingsTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs lg:text-sm"
              >
                <i className={`${tab.icon} text-sm`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {settingsTabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <i className={`${tab.icon} text-primary text-lg`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {tab.label} Settings
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {getTabDescription(tab.id)}
                    </p>
                  </div>
                </div>
                <Component />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </MainLayout>
  );
}

function getTabDescription(tabId: string): string {
  switch (tabId) {
    case 'profile':
      return 'Manage your personal information and account details.';
    case 'preferences':
      return 'Customize your app experience and default settings.';
    case 'notifications':
      return 'Control how and when you receive notifications.';
    case 'team':
      return 'Manage team members and their permissions.';
    case 'integrations':
      return 'Connect with external tools and services.';
    case 'billing':
      return 'Manage your subscription and billing information.';
    default:
      return '';
  }
}

export default withAuth(SettingsPage);
