"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface TaskReport {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  isPopular?: boolean;
  isNew?: boolean;
}

function TaskReportsPage() {
  const router = useRouter();

  const taskReports: TaskReport[] = [
    {
      id: "completed-tasks",
      title: "Completed Tasks",
      description: "Completed tasks by property, assignee, and task type during a specified time frame.",
      href: "/reports/task/completed-tasks",
      icon: "ri-checkbox-circle-line",
      isPopular: true
    },
    {
      id: "open-tasks",
      title: "Open Tasks",
      description: "Open tasks by property, assignee, and task type during a specified time frame.",
      href: "/reports/task/open-tasks",
      icon: "ri-todo-line",
      isPopular: true
    },
    {
      id: "tasks-performance",
      title: "Tasks Performance",
      description: "Task status and performance metrics by property, assignee, and task type during a specified time frame.",
      href: "/reports/task/tasks-performance",
      icon: "ri-bar-chart-line"
    },
    {
      id: "work-orders",
      title: "Work Orders",
      description: "Work orders by property, assignee, work order type, and status during a specified time frame.",
      href: "/reports/task/work-orders",
      icon: "ri-tools-line",
      isPopular: true
    },
    {
      id: "custom-fields-vendors",
      title: "Custom Fields for Vendors",
      description: "Custom field values for vendors.",
      href: "/reports/task/custom-fields-vendors",
      icon: "ri-user-settings-line"
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reports")}
                className="text-gray-600 hover:text-gray-900"
              >
                <i className="ri-arrow-left-line mr-1" />
                Reports
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Task</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Task management and work order reporting for your properties
            </p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                      <i className={`${report.icon} text-lg`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {report.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {report.isNew && (
                          <Badge className="text-xs bg-blue-500">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {report.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => router.push(report.href)}
                >
                  Generate Report
                  <i className="ri-arrow-right-line ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start">
                <i className="ri-download-line mr-2" />
                Export All Task Data
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule Task Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-dashboard-line mr-2" />
                Task Dashboard
              </Button>
              <Button variant="outline" className="justify-start">
                <i className="ri-settings-3-line mr-2" />
                Report Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Task Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {taskReports.filter(report => report.isPopular).map((report) => (
                <Button
                  key={report.id}
                  variant="ghost"
                  className="h-auto p-4 justify-start"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${report.icon} text-lg text-indigo-600`} />
                    <div className="text-left">
                      <div className="font-medium">{report.title}</div>
                      <div className="text-xs text-gray-600">Task Management</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-xs text-green-600">+12% this month</p>
                </div>
                <i className="ri-task-line text-2xl text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold">189</p>
                  <p className="text-xs text-green-600">76.5% completion rate</p>
                </div>
                <i className="ri-checkbox-circle-line text-2xl text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold">42</p>
                  <p className="text-xs text-yellow-600">17% of total</p>
                </div>
                <i className="ri-time-line text-2xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold">16</p>
                  <p className="text-xs text-red-600">6.5% of total</p>
                </div>
                <i className="ri-alarm-warning-line text-2xl text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(TaskReportsPage);
