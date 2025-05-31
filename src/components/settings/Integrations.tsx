"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useIntegrations } from "@/hooks/useSettings";

const integrationDetails = {
  'Google Calendar': {
    description: 'Sync tasks and events with your Google Calendar',
    features: ['Two-way sync', 'Event reminders', 'Task scheduling'],
    icon: 'ri-calendar-line',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  'Dropbox': {
    description: 'Store and sync property documents in Dropbox',
    features: ['Document storage', 'Automatic backup', 'File sharing'],
    icon: 'ri-dropbox-line',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  'SMTP Email': {
    description: 'Send emails using your custom domain',
    features: ['Custom branding', 'Automated emails', 'Delivery tracking'],
    icon: 'ri-mail-line',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
};

export function Integrations() {
  const { data: integrations = [], isLoading } = useIntegrations();

  const handleToggleIntegration = (integrationId: string, enabled: boolean) => {
    // TODO: Implement integration toggle
    console.log(`Toggle integration ${integrationId}:`, enabled);
  };

  const handleConfigureIntegration = (integrationId: string) => {
    // TODO: Implement integration configuration
    console.log(`Configure integration ${integrationId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
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

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect QAPT with your favorite tools to streamline your workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {integrations.filter(i => i.enabled).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Integrations
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {integrations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Available Integrations
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                Coming Soon
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                More Integrations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <div className="space-y-4">
        {integrations.map((integration) => {
          const details = integrationDetails[integration.name as keyof typeof integrationDetails];
          
          return (
            <Card key={integration.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${details?.bgColor || 'bg-gray-100 dark:bg-gray-800'}`}>
                      <i className={`${details?.icon || 'ri-apps-line'} text-xl ${details?.color || 'text-gray-600'}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{integration.name}</h3>
                        {integration.enabled ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Connected</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {details?.description || 'Enhance your workflow with this integration.'}
                      </p>
                      {details?.features && (
                        <div className="flex flex-wrap gap-2">
                          {details.features.map((feature, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                      {integration.enabled && integration.last_sync && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Last synced: {new Date(integration.last_sync).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureIntegration(integration.id)}
                      >
                        <i className="ri-settings-line mr-2" />
                        Configure
                      </Button>
                    )}
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            More integrations are on the way to enhance your property management experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Stripe', icon: 'ri-bank-card-line', description: 'Payment processing' },
              { name: 'QuickBooks', icon: 'ri-calculator-line', description: 'Accounting integration' },
              { name: 'Slack', icon: 'ri-slack-line', description: 'Team communication' },
              { name: 'Zapier', icon: 'ri-flashlight-line', description: 'Workflow automation' },
              { name: 'DocuSign', icon: 'ri-file-text-line', description: 'Digital signatures' },
              { name: 'Twilio', icon: 'ri-phone-line', description: 'SMS notifications' },
            ].map((upcoming, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <i className={`${upcoming.icon} text-gray-600 dark:text-gray-400`} />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {upcoming.name}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {upcoming.description}
                </p>
                <Badge variant="outline" className="mt-2">
                  Coming Soon
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Request an Integration</CardTitle>
          <CardDescription>
            Don't see the integration you need? Let us know what you'd like to connect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <i className="ri-feedback-line mr-2" />
            Request Integration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
