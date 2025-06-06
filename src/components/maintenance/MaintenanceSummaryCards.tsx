import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceSummary } from "@/types/maintenance";

interface MaintenanceSummaryCardsProps {
  summary?: MaintenanceSummary;
  isLoading: boolean;
}

export function MaintenanceSummaryCards({ summary, isLoading }: MaintenanceSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full ml-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const cards = [
    {
      title: "Open Requests",
      value: summary.open_requests,
      description: `${summary.total_requests} total`,
      icon: "ri-tools-line",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "In Progress",
      value: summary.in_progress_requests,
      description: "Being worked on",
      icon: "ri-settings-3-line",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Resolved This Month",
      value: summary.resolved_this_month,
      description: `${summary.avg_resolution_time.toFixed(1)} days avg`,
      icon: "ri-check-double-line",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Overdue",
      value: summary.overdue_requests,
      description: "Need attention",
      icon: "ri-alarm-warning-line",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <div className="text-xl font-bold">
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>
              <div className={`p-1.5 rounded-full ${card.bgColor} ml-3`}>
                <i className={`${card.icon} h-3.5 w-3.5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
