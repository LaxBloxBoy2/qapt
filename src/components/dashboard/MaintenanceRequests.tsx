"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { format, isAfter, subDays } from "date-fns";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  category: string;
}

interface MaintenanceOverviewData {
  total_requests: number;
  open_requests: number;
  in_progress_requests: number;
  completed_this_week: number;
  urgent_requests: number;
  recent_requests: MaintenanceRequest[];
  overdue_requests: MaintenanceRequest[];
}

export function MaintenanceRequests() {
  const router = useRouter();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-requests', user?.id],
    queryFn: async (): Promise<MaintenanceOverviewData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const oneWeekAgo = subDays(new Date(), 7);
      const threeDaysAgo = subDays(new Date(), 3);

      // Since we don't have a maintenance_requests table yet, let's create mock data
      // In a real app, this would query the actual maintenance_requests table
      const mockRequests: MaintenanceRequest[] = [
        {
          id: '1',
          title: 'Leaky Faucet in Kitchen',
          description: 'Kitchen faucet is dripping constantly',
          status: 'open',
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          property_name: 'Sunset Apartments',
          unit_name: 'Unit 101',
          tenant_name: 'John Smith',
          category: 'Plumbing'
        },
        {
          id: '2',
          title: 'Broken Air Conditioning',
          description: 'AC unit not cooling properly',
          status: 'in_progress',
          priority: 'high',
          created_at: subDays(new Date(), 2).toISOString(),
          updated_at: new Date().toISOString(),
          property_name: 'Downtown Lofts',
          unit_name: 'Unit 205',
          tenant_name: 'Sarah Johnson',
          category: 'HVAC'
        },
        {
          id: '3',
          title: 'Clogged Drain',
          description: 'Bathroom sink drain is completely blocked',
          status: 'completed',
          priority: 'medium',
          created_at: subDays(new Date(), 5).toISOString(),
          updated_at: subDays(new Date(), 1).toISOString(),
          property_name: 'Garden View Complex',
          unit_name: 'Unit 302',
          tenant_name: 'Mike Davis',
          category: 'Plumbing'
        },
        {
          id: '4',
          title: 'Electrical Outlet Not Working',
          description: 'Living room outlet has no power',
          status: 'open',
          priority: 'urgent',
          created_at: subDays(new Date(), 4).toISOString(),
          updated_at: subDays(new Date(), 4).toISOString(),
          property_name: 'Riverside Towers',
          unit_name: 'Unit 1205',
          tenant_name: 'Emily Chen',
          category: 'Electrical'
        },
        {
          id: '5',
          title: 'Window Won\'t Close',
          description: 'Bedroom window is stuck open',
          status: 'open',
          priority: 'low',
          created_at: subDays(new Date(), 1).toISOString(),
          updated_at: subDays(new Date(), 1).toISOString(),
          property_name: 'Sunset Apartments',
          unit_name: 'Unit 203',
          tenant_name: 'Robert Wilson',
          category: 'General'
        }
      ];

      // Calculate metrics
      const totalRequests = mockRequests.length;
      const openRequests = mockRequests.filter(r => r.status === 'open').length;
      const inProgressRequests = mockRequests.filter(r => r.status === 'in_progress').length;
      const completedThisWeek = mockRequests.filter(r => 
        r.status === 'completed' && isAfter(new Date(r.updated_at), oneWeekAgo)
      ).length;
      const urgentRequests = mockRequests.filter(r => r.priority === 'urgent').length;

      // Get overdue requests (open for more than 3 days)
      const overdueRequests = mockRequests.filter(r => 
        r.status === 'open' && !isAfter(new Date(r.created_at), threeDaysAgo)
      );

      // Get recent requests (last 5)
      const recentRequests = mockRequests
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return {
        total_requests: totalRequests,
        open_requests: openRequests,
        in_progress_requests: inProgressRequests,
        completed_this_week: completedThisWeek,
        urgent_requests: urgentRequests,
        recent_requests: recentRequests,
        overdue_requests: overdueRequests
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="text-gray-700 dark:text-gray-300">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="outline" className="text-gray-800 dark:text-gray-200 border-gray-400">Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'ri-alarm-warning-line text-gray-600 dark:text-gray-400';
      case 'high':
        return 'ri-arrow-up-line text-gray-600 dark:text-gray-400';
      case 'medium':
        return 'ri-subtract-line text-gray-600 dark:text-gray-400';
      case 'low':
        return 'ri-arrow-down-line text-green-600 dark:text-green-400';
      default:
        return 'ri-question-line text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-tools-line text-primary" />
            Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-tools-line text-primary" />
            Maintenance Requests
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/maintenance')}>
            <i className="ri-external-link-line mr-1" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="text-center py-8">
            <i className="ri-tools-line text-4xl text-gray-400 mb-4 block" />
            <p className="text-gray-600 dark:text-gray-400">No maintenance data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{data.total_requests}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{data.open_requests}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Open</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{data.in_progress_requests}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xl font-bold text-green-700 dark:text-green-300">{data.completed_this_week}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Completed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{data.urgent_requests}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Urgent</div>
              </div>
            </div>

            {/* Overdue Requests Alert */}
            {data.overdue_requests.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-medium mb-2">
                  <i className="ri-alarm-warning-line" />
                  {data.overdue_requests.length} Overdue Request{data.overdue_requests.length > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  These requests have been open for more than 3 days and need attention.
                </div>
              </div>
            )}

            {/* Recent Requests */}
            <div>
              <h4 className="font-medium mb-3">Recent Requests</h4>
              <div className="space-y-3">
                {data.recent_requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/maintenance/${request.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <i className={getPriorityIcon(request.priority)} />
                          <span className="font-medium">{request.title}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{request.property_name} • {request.unit_name}</span>
                          <span>{request.tenant_name}</span>
                          <span>{format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getPriorityBadge(request.priority)}
                        <span className="text-xs text-gray-500">{request.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
