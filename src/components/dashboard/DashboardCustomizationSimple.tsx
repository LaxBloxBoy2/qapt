"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useDashboardPreferences, DashboardWidget } from "@/hooks/useDashboardPreferences";

export function DashboardCustomizationSimple() {
  const { preferences, toggleWidget, resetToDefaults } = useDashboardPreferences();
  const [isOpen, setIsOpen] = useState(false);

  const getEnabledCount = () => {
    return preferences.widgets.filter(w => w.enabled).length;
  };

  const getTotalCount = () => {
    return preferences.widgets.length;
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
        <i className="ri-settings-3-line" />
        Customize Dashboard
        <Badge variant="secondary" className="ml-1">
          {getEnabledCount()}/{getTotalCount()}
        </Badge>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ri-dashboard-line" />
              Dashboard Customization
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <i className="ri-close-line" />
            </Button>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose which widgets to display on your dashboard. Toggle switches to enable or disable widgets.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Widget List */}
          <div className="space-y-3">
            <h3 className="font-medium">Available Widgets</h3>
            {preferences.widgets.map((widget: DashboardWidget) => (
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
                      {['today-section', 'lease-funnel', 'financial-overview', 'recently-viewed'].includes(widget.id) && (
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                          Core
                        </Badge>
                      )}
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
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={widget.enabled}
                      onCheckedChange={() => {
                        console.log('🔄 Toggle clicked for widget:', widget.id, 'current enabled:', widget.enabled);
                        toggleWidget(widget.id);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Enable Financial clicked');
                  preferences.widgets.forEach(widget => {
                    if (!widget.enabled && widget.category === 'financial') {
                      console.log('🔄 Enabling financial widget:', widget.id);
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
                  console.log('🔄 Enable Property clicked');
                  preferences.widgets.forEach(widget => {
                    if (!widget.enabled && widget.category === 'property') {
                      console.log('🔄 Enabling property widget:', widget.id);
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
        </CardContent>
      </Card>
    </div>
  );
}
