"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskData } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

interface TasksSectionProps {
  data?: TaskData;
}

export function TasksSection({ data }: TasksSectionProps) {
  const router = useRouter();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-task-line text-primary" />
            Tasks & Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'ri-alarm-warning-line';
      case 'high': return 'ri-arrow-up-line';
      case 'medium': return 'ri-subtract-line';
      case 'low': return 'ri-arrow-down-line';
      default: return 'ri-subtract-line';
    }
  };

  const allTasks = [...data.upcoming, ...data.overdue];
  const hasAnyTasks = allTasks.length > 0;

  // Use real calendar tasks data
  const upcomingTasks = data.upcoming;
  const overdueTasks = data.overdue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-task-line text-primary" />
            Tasks & Action Items
          </div>
          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueTasks.length} overdue
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push('/calendar')}>
              <i className="ri-external-link-line mr-1" />
              View All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyTasks ? (
          <div className="text-center py-8">
            <i className="ri-task-line text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No tasks at the moment. You're all caught up!
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/calendar')}
            >
              <i className="ri-add-line mr-1" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                  <i className="ri-alarm-warning-line" />
                  Overdue ({overdueTasks.length})
                </h4>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <i className={`${getPriorityIcon(task.priority)} text-sm text-red-600 dark:text-red-400`} />
                            <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {task.title}
                            </h5>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              {task.days_overdue} day{task.days_overdue !== 1 ? 's' : ''} overdue
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs">
                          <i className="ri-check-line mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <i className="ri-calendar-line" />
                  Upcoming ({upcomingTasks.length})
                </h4>
                <div className="space-y-2">
                  {upcomingTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <i className={`${getPriorityIcon(task.priority)} text-sm text-gray-600 dark:text-gray-400`} />
                            <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {task.title}
                            </h5>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              Due {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs">
                          <i className="ri-arrow-right-s-line" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/calendar')}
                  className="text-xs"
                >
                  <i className="ri-add-line mr-1" />
                  New Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/calendar')}
                  className="text-xs"
                >
                  <i className="ri-calendar-line mr-1" />
                  Calendar
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
