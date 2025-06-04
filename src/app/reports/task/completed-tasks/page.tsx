"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ReportFilters, type ReportFilters as ReportFiltersType } from "@/components/reports/ReportFilters";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  category: string;
  assignee: string;
  property_name: string;
  completed_date: string;
  created_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

function CompletedTasksReportPage() {
  const router = useRouter();
  const { user } = useUser();
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFiltersType>({
    properties: [],
    categories: [],
    assignees: [],
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: '',
  });

  // Mock data for demonstration
  const mockTasks: CompletedTask[] = [
    {
      id: '1',
      title: 'Fix leaky faucet in Unit 2A',
      description: 'Tenant reported dripping faucet in kitchen',
      category: 'Plumbing',
      assignee: 'John Smith',
      property_name: 'Sunset Apartments',
      completed_date: '2025-01-01',
      created_date: '2024-12-28',
      priority: 'medium',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Replace air filter in HVAC system',
      description: 'Monthly maintenance for building HVAC',
      category: 'HVAC',
      assignee: 'Mike Johnson',
      property_name: 'Downtown Plaza',
      completed_date: '2025-01-02',
      created_date: '2024-12-30',
      priority: 'low',
      status: 'completed'
    },
    {
      id: '3',
      title: 'Repair broken window in lobby',
      description: 'Glass replacement needed for main entrance',
      category: 'General Maintenance',
      assignee: 'Sarah Wilson',
      property_name: 'Sunset Apartments',
      completed_date: '2025-01-03',
      created_date: '2024-12-29',
      priority: 'high',
      status: 'completed'
    },
    {
      id: '4',
      title: 'Paint hallway walls',
      description: 'Touch up paint in 3rd floor hallway',
      category: 'Painting',
      assignee: 'John Smith',
      property_name: 'Oak Street Condos',
      completed_date: '2025-01-04',
      created_date: '2024-12-25',
      priority: 'low',
      status: 'completed'
    },
    {
      id: '5',
      title: 'Install new light fixtures',
      description: 'Replace old fixtures in common areas',
      category: 'Electrical',
      assignee: 'Mike Johnson',
      property_name: 'Downtown Plaza',
      completed_date: '2025-01-05',
      created_date: '2024-12-27',
      priority: 'medium',
      status: 'completed'
    }
  ];

  const availableProperties = [
    { id: 'sunset-apartments', name: 'Sunset Apartments' },
    { id: 'downtown-plaza', name: 'Downtown Plaza' },
    { id: 'oak-street-condos', name: 'Oak Street Condos' }
  ];

  const availableCategories = [
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'hvac', name: 'HVAC' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'general-maintenance', name: 'General Maintenance' },
    { id: 'painting', name: 'Painting' }
  ];

  const availableAssignees = [
    { id: 'john-smith', name: 'John Smith' },
    { id: 'mike-johnson', name: 'Mike Johnson' },
    { id: 'sarah-wilson', name: 'Sarah Wilson' }
  ];

  useEffect(() => {
    // Initialize with mock data
    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
  }, []);

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (currentFilters: ReportFiltersType) => {
    let filtered = [...tasks];

    // Apply property filter
    if (currentFilters.properties.length > 0) {
      const propertyNames = currentFilters.properties.map(id => 
        availableProperties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filtered = filtered.filter(task => 
        propertyNames.includes(task.property_name)
      );
    }

    // Apply category filter
    if (currentFilters.categories.length > 0) {
      const categoryNames = currentFilters.categories.map(id => 
        availableCategories.find(c => c.id === id)?.name
      ).filter(Boolean);
      filtered = filtered.filter(task => 
        categoryNames.includes(task.category)
      );
    }

    // Apply assignee filter
    if (currentFilters.assignees.length > 0) {
      const assigneeNames = currentFilters.assignees.map(id => 
        availableAssignees.find(a => a.id === id)?.name
      ).filter(Boolean);
      filtered = filtered.filter(task => 
        assigneeNames.includes(task.assignee)
      );
    }

    // Apply date range filter
    if (currentFilters.dateFrom) {
      filtered = filtered.filter(task => 
        new Date(task.completed_date) >= new Date(currentFilters.dateFrom)
      );
    }
    if (currentFilters.dateTo) {
      filtered = filtered.filter(task => 
        new Date(task.completed_date) <= new Date(currentFilters.dateTo)
      );
    }

    // Apply search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.category.toLowerCase().includes(searchLower) ||
        task.assignee.toLowerCase().includes(searchLower) ||
        task.property_name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleRunReport = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      applyFilters(filters);
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting completed tasks report as ${format}`);
    // Implement export functionality
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reports/task")}
                className="text-gray-600 hover:text-gray-900"
              >
                Task
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Completed Tasks</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Completed Tasks Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Completed tasks by property, assignee, and task type during a specified time frame
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ReportFilters
              onFilterChange={handleFilterChange}
              onExport={handleExport}
              onRunReport={handleRunReport}
              isLoading={isLoading}
              availableProperties={availableProperties}
              availableCategories={availableCategories}
              availableAssignees={availableAssignees}
              showPropertyFilter={true}
              showCategoryFilter={true}
              showAssigneeFilter={true}
              showDateRange={true}
              showStatusFilter={false}
            />
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                      <p className="text-2xl font-bold">{filteredTasks.length}</p>
                    </div>
                    <i className="ri-task-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Completion Time</p>
                      <p className="text-2xl font-bold">3.2 days</p>
                    </div>
                    <i className="ri-time-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
                      <p className="text-2xl font-bold">{new Set(filteredTasks.map(t => t.property_name)).size}</p>
                    </div>
                    <i className="ri-building-line text-2xl text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Assignees</p>
                      <p className="text-2xl font-bold">{new Set(filteredTasks.map(t => t.assignee)).size}</p>
                    </div>
                    <i className="ri-user-line text-2xl text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Table */}
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading tasks...</span>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-task-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No completed tasks found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Task</th>
                          <th className="text-left p-3">Property</th>
                          <th className="text-left p-3">Category</th>
                          <th className="text-left p-3">Assignee</th>
                          <th className="text-left p-3">Priority</th>
                          <th className="text-left p-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <tr key={task.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {task.description}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">{task.property_name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{task.category}</Badge>
                            </td>
                            <td className="p-3">{task.assignee}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                <span className="capitalize">{task.priority}</span>
                              </div>
                            </td>
                            <td className="p-3">{formatDate(task.completed_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(CompletedTasksReportPage);
