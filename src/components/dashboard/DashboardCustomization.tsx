"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useDashboardPreferences, DashboardWidget } from "@/hooks/useDashboardPreferences";

export function DashboardCustomization() {
  const { preferences, toggleWidget, getWidgetsByCategory, resetToDefaults } = useDashboardPreferences();
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'All Widgets', icon: 'ri-dashboard-line' },
    { id: 'financial', name: 'Financial', icon: 'ri-money-dollar-circle-line' },
    { id: 'property', name: 'Property', icon: 'ri-building-line' },
    { id: 'tenant', name: 'Tenant', icon: 'ri-user-3-line' },
    { id: 'maintenance', name: 'Maintenance', icon: 'ri-tools-line' },
    { id: 'analytics', name: 'Analytics', icon: 'ri-bar-chart-line' },
  ];

  const getWidgetsForCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      return preferences.widgets;
    }
    return getWidgetsByCategory(categoryId);
  };

  const getEnabledCount = () => {
    return preferences.widgets.filter(w => w.enabled).length;
  };

  const getTotalCount = () => {
    return preferences.widgets.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <i className="ri-settings-3-line" />
          Customize Dashboard
          <Badge variant="secondary" className="ml-1">
            {getEnabledCount()}/{getTotalCount()}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="ri-dashboard-line" />
            Dashboard Customization
          </DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your dashboard. You can enable or disable widgets based on your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <div className="font-medium">Active Widgets</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getEnabledCount()} of {getTotalCount()} widgets enabled
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="gap-2"
            >
              <i className="ri-refresh-line" />
              Reset
            </Button>
          </div>

          {/* Widget Categories */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="financial" className="text-xs">Financial</TabsTrigger>
              <TabsTrigger value="property" className="text-xs">Property</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 mt-2">
              <TabsTrigger value="tenant" className="text-xs">Tenant</TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs">Maintenance</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <i className={`${category.icon} text-primary`} />
                    <h3 className="font-medium">{category.name}</h3>
                    <Badge variant="outline">
                      {getWidgetsForCategory(category.id).length}
                    </Badge>
                  </div>

                  {getWidgetsForCategory(category.id).map((widget: DashboardWidget) => (
                    <div
                      key={widget.id}
                      className={`p-4 border rounded-lg transition-all ${
                        widget.enabled
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`${widget.icon} ${widget.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${widget.enabled ? 'text-green-900 dark:text-green-100' : 'text-gray-600 dark:text-gray-400'}`}>
                              {widget.name}
                            </span>
                            <Badge variant={widget.size === 'large' ? 'default' : widget.size === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                              {widget.size}
                            </Badge>
                          </div>
                          <p className={`text-sm ${widget.enabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-500'}`}>
                            {widget.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                widget.enabled
                                  ? 'border-green-300 text-green-700'
                                  : 'border-gray-300 text-gray-500'
                              }`}
                            >
                              {widget.category}
                            </Badge>
                            {['today-section', 'lease-funnel', 'financial-overview', 'recently-viewed'].includes(widget.id) && (
                              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                Core
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Switch
                            checked={widget.enabled}
                            onCheckedChange={() => toggleWidget(widget.id)}
                            disabled={['today-section', 'lease-funnel', 'financial-overview', 'recently-viewed'].includes(widget.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  preferences.widgets.forEach(widget => {
                    if (!widget.enabled && widget.category === 'financial') {
                      toggleWidget(widget.id);
                    }
                  });
                }}
                className="gap-2"
              >
                <i className="ri-money-dollar-circle-line" />
                Enable Financial
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  preferences.widgets.forEach(widget => {
                    if (!widget.enabled && widget.category === 'property') {
                      toggleWidget(widget.id);
                    }
                  });
                }}
                className="gap-2"
              >
                <i className="ri-building-line" />
                Enable Property
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
