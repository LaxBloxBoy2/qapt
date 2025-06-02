"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'financial' | 'property' | 'tenant' | 'maintenance' | 'analytics';
  size: 'small' | 'medium' | 'large';
}

export interface DashboardPreferences {
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
  refreshInterval: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  // Core widgets (enabled by default)
  {
    id: 'today-section',
    name: 'Today\'s Overview',
    description: 'Reminders, tasks, and urgent items for today',
    icon: 'ri-calendar-todo-line',
    enabled: true,
    category: 'analytics',
    size: 'large'
  },
  {
    id: 'lease-funnel',
    name: 'Lease Funnel',
    description: 'Active, upcoming, and expired leases overview',
    icon: 'ri-file-list-3-line',
    enabled: true,
    category: 'property',
    size: 'medium'
  },
  {
    id: 'financial-overview',
    name: 'Financial Overview',
    description: '30-day income, expenses, and financial trends',
    icon: 'ri-line-chart-line',
    enabled: true,
    category: 'financial',
    size: 'large'
  },
  {
    id: 'recently-viewed',
    name: 'Recently Viewed',
    description: 'Quick access to recently viewed properties and tenants',
    icon: 'ri-history-line',
    enabled: true,
    category: 'analytics',
    size: 'medium'
  },
  
  // Optional widgets that can be toggled
  {
    id: 'property-performance',
    name: 'Property Performance',
    description: 'Top performing properties by revenue and occupancy',
    icon: 'ri-building-line',
    enabled: false,
    category: 'property',
    size: 'medium'
  },
  {
    id: 'tenant-overview',
    name: 'Tenant Overview',
    description: 'Active tenants, move-ins, move-outs, and tenant satisfaction',
    icon: 'ri-user-3-line',
    enabled: false,
    category: 'tenant',
    size: 'medium'
  },
  {
    id: 'maintenance-requests',
    name: 'Maintenance Requests',
    description: 'Open, pending, and completed maintenance requests',
    icon: 'ri-tools-line',
    enabled: false,
    category: 'maintenance',
    size: 'medium'
  },
  {
    id: 'rent-collection',
    name: 'Rent Collection',
    description: 'Payment status, overdue amounts, and collection rates',
    icon: 'ri-money-dollar-circle-line',
    enabled: false,
    category: 'financial',
    size: 'medium'
  },
  {
    id: 'occupancy-trends',
    name: 'Occupancy Trends',
    description: 'Occupancy rates and trends over time',
    icon: 'ri-bar-chart-line',
    enabled: false,
    category: 'analytics',
    size: 'medium'
  },
  {
    id: 'expense-breakdown',
    name: 'Expense Breakdown',
    description: 'Categorized expenses and spending patterns',
    icon: 'ri-pie-chart-line',
    enabled: false,
    category: 'financial',
    size: 'medium'
  },
  {
    id: 'lease-renewals',
    name: 'Upcoming Renewals',
    description: 'Leases expiring soon and renewal opportunities',
    icon: 'ri-refresh-line',
    enabled: false,
    category: 'property',
    size: 'medium'
  },
  {
    id: 'market-insights',
    name: 'Market Insights',
    description: 'Local market trends and rental rate comparisons',
    icon: 'ri-stock-line',
    enabled: false,
    category: 'analytics',
    size: 'large'
  }
];

const STORAGE_KEY = 'dashboard-preferences';

export function useDashboardPreferences() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    widgets: DEFAULT_WIDGETS,
    layout: 'grid',
    refreshInterval: 300000 // 5 minutes
  });
  const [updateCounter, setUpdateCounter] = useState(0);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Merge with default widgets to ensure new widgets are included
          const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
            const storedWidget = parsed.widgets?.find((w: DashboardWidget) => w.id === defaultWidget.id);
            return storedWidget ? { ...defaultWidget, enabled: storedWidget.enabled } : defaultWidget;
          });
          
          setPreferences({
            ...parsed,
            widgets: mergedWidgets
          });
        } catch (error) {
          console.error('Error parsing dashboard preferences:', error);
        }
      }
    }
  }, [user?.id]);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: DashboardPreferences) => {
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      setUpdateCounter(prev => prev + 1); // Force re-render
    }
  };

  // Toggle widget visibility
  const toggleWidget = (widgetId: string) => {
    const newPreferences = {
      ...preferences,
      widgets: preferences.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    };

    savePreferences(newPreferences);
  };

  // Get enabled widgets with proper memoization
  const enabledWidgets = useMemo(() => {
    return preferences.widgets.filter(widget => widget.enabled);
  }, [preferences.widgets, updateCounter]);

  // Get widgets by category
  const getWidgetsByCategory = (category: string) => {
    return preferences.widgets.filter(widget => widget.category === category);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultPreferences = {
      widgets: DEFAULT_WIDGETS,
      layout: 'grid' as const,
      refreshInterval: 300000
    };
    savePreferences(defaultPreferences);
  };

  return {
    preferences,
    enabledWidgets,
    toggleWidget,
    getWidgetsByCategory,
    savePreferences,
    resetToDefaults
  };
}
