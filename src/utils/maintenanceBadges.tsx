import { Badge } from "@/components/ui/badge";
import { MaintenanceStatus, MaintenancePriority } from "@/types/maintenance";

/**
 * Utility functions for consistent maintenance badge colors across the application
 * Fixes the confusing color scheme where HIGH priority was showing as green
 */

export const getMaintenanceStatusBadge = (status: MaintenanceStatus) => {
  const statusConfig = {
    open: {
      variant: "secondary" as const,
      className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
    },
    assigned: {
      variant: "outline" as const,
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
    },
    in_progress: {
      variant: "outline" as const,
      className: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
    },
    resolved: {
      variant: "outline" as const,
      className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
    },
    cancelled: {
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
    },
    rejected: {
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
    },
  };

  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
};

export const getMaintenancePriorityBadge = (priority: MaintenancePriority) => {
  const priorityConfig = {
    low: {
      variant: "outline" as const,
      className: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
    },
    medium: {
      variant: "outline" as const,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
    },
    high: {
      variant: "outline" as const,
      className: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
    },
    urgent: {
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
    },
  };

  const config = priorityConfig[priority];
  return (
    <Badge variant={config.variant} className={config.className}>
      {priority.toUpperCase()}
    </Badge>
  );
};

/**
 * Get status color classes for use in other components (cards, etc.)
 */
export const getMaintenanceStatusColors = (status: MaintenanceStatus) => {
  const colors = {
    open: {
      text: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/20",
      icon: "text-orange-600"
    },
    assigned: {
      text: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
      icon: "text-blue-600"
    },
    in_progress: {
      text: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
      icon: "text-blue-600"
    },
    resolved: {
      text: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/20",
      icon: "text-green-600"
    },
    cancelled: {
      text: "text-gray-600",
      bg: "bg-gray-100 dark:bg-gray-900/20",
      icon: "text-gray-600"
    },
    rejected: {
      text: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/20",
      icon: "text-red-600"
    },
  };

  return colors[status];
};

/**
 * Get priority color classes for use in other components (cards, etc.)
 */
export const getMaintenancePriorityColors = (priority: MaintenancePriority) => {
  const colors = {
    low: {
      text: "text-gray-600",
      bg: "bg-gray-100 dark:bg-gray-900/20",
      icon: "text-gray-600"
    },
    medium: {
      text: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/20",
      icon: "text-yellow-600"
    },
    high: {
      text: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/20",
      icon: "text-orange-600"
    },
    urgent: {
      text: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/20",
      icon: "text-red-600"
    },
  };

  return colors[priority];
};
