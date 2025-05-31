"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaseData } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";

interface LeaseFunnelProps {
  data?: LeaseData;
}

export function LeaseFunnel({ data }: LeaseFunnelProps) {
  const router = useRouter();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-file-list-line text-primary" />
            Lease Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const funnelItems = [
    {
      label: 'Active Leases',
      count: data.active,
      color: 'bg-green-500',
      lightColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-700 dark:text-green-300',
      icon: 'ri-check-line',
      description: 'Currently active and generating income'
    },
    {
      label: 'In Progress',
      count: data.inProgress,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: 'ri-time-line',
      description: 'Upcoming leases starting soon'
    },
    {
      label: 'Drafts',
      count: data.drafts,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      icon: 'ri-draft-line',
      description: 'Draft leases being prepared'
    },
    {
      label: 'Ended',
      count: data.ended,
      color: 'bg-gray-500',
      lightColor: 'bg-gray-100 dark:bg-gray-900',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: 'ri-close-line',
      description: 'Expired or terminated leases'
    }
  ];

  const maxCount = Math.max(...funnelItems.map(item => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-file-list-line text-primary" />
            Lease Funnel
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/leases')}>
            <i className="ri-external-link-line mr-1" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Summary */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Leases
            </div>
          </div>

          {/* Funnel Items */}
          <div className="space-y-3">
            {funnelItems.map((item, index) => {
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <div
                  key={item.label}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/leases?status=${item.label.toLowerCase().replace(' ', '_')}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${item.lightColor}`}>
                        <i className={`${item.icon} text-sm ${item.textColor}`} />
                      </div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.count}
                      </span>
                      <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/leases')}
                className="text-xs"
              >
                <i className="ri-add-line mr-1" />
                New Lease
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/leases?filter=expiring')}
                className="text-xs"
              >
                <i className="ri-calendar-line mr-1" />
                Expiring
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
