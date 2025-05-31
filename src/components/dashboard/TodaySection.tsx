"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TodayData } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface TodaySectionProps {
  data?: TodayData;
}

export function TodaySection({ data }: TodaySectionProps) {
  const router = useRouter();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-calendar-line text-primary" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 14) return 'text-orange-600 dark:text-orange-400';
    if (days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const hasAnyItems = 
    data.reminders.length > 0 || 
    data.leaseExpirations.length > 0 || 
    data.scheduledInspections.length > 0 || 
    data.dueTasks.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-calendar-line text-primary" />
            Today's Overview
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/calendar')}>
            <i className="ri-calendar-2-line mr-1" />
            View Calendar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyItems ? (
          <div className="text-center py-8">
            <i className="ri-calendar-check-line text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No urgent items for today. You're all caught up!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Reminders */}
            {data.reminders.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <i className="ri-notification-line" />
                  Recent Alerts ({data.reminders.length})
                </h4>
                <div className="space-y-2">
                  {data.reminders.slice(0, 3).map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{reminder.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {reminder.description}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(reminder.due_date), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                  {data.reminders.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View {data.reminders.length - 3} more
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Lease Expirations */}
            {data.leaseExpirations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <i className="ri-file-text-line" />
                  Lease Expirations ({data.leaseExpirations.length})
                </h4>
                <div className="space-y-2">
                  {data.leaseExpirations.map((lease) => (
                    <div
                      key={lease.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => router.push(`/leases/${lease.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{lease.tenant_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {lease.unit_name} • {lease.property_name}
                          </p>
                        </div>
                        <span className={`text-xs font-medium ${getUrgencyColor(lease.days_until_expiry)}`}>
                          {lease.days_until_expiry}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Inspections */}
            {data.scheduledInspections.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <i className="ri-search-eye-line" />
                  Inspections ({data.scheduledInspections.length})
                </h4>
                <div className="space-y-2">
                  {data.scheduledInspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => router.push(`/inspections/${inspection.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{inspection.property_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {inspection.type.replace('_', ' ')} inspection
                          </p>
                        </div>
                        <span className={`text-xs font-medium ${getUrgencyColor(inspection.days_until_due)}`}>
                          {inspection.days_until_due}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Due Tasks */}
            {data.dueTasks.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <i className="ri-task-line" />
                  Due Tasks ({data.dueTasks.length})
                </h4>
                <div className="space-y-2">
                  {data.dueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
