import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialSummary } from "@/types/finance";
import { useCurrencyFormatter } from "@/lib/currency";

interface FinanceSummaryCardsProps {
  summary?: FinancialSummary;
  isLoading: boolean;
}

export function FinanceSummaryCards({ summary, isLoading }: FinanceSummaryCardsProps) {
  const { formatCurrency } = useCurrencyFormatter();

  const cards = [
    {
      title: "Outstanding",
      value: summary?.outstanding || 0,
      icon: "ri-time-line",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      description: "Pending payments"
    },
    {
      title: "Paid",
      value: summary?.paid || 0,
      icon: "ri-check-line",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "Completed payments"
    },
    {
      title: "Overdue",
      value: summary?.overdue || 0,
      icon: "ri-alarm-warning-line",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "Past due payments"
    },
    {
      title: "Net Income",
      value: summary?.net_income || 0,
      icon: summary?.net_income && summary.net_income >= 0 ? "ri-arrow-up-line" : "ri-arrow-down-line",
      color: summary?.net_income && summary.net_income >= 0 ? "text-green-600" : "text-red-600",
      bgColor: summary?.net_income && summary.net_income >= 0
        ? "bg-green-50 dark:bg-green-900/20"
        : "bg-red-50 dark:bg-red-900/20",
      description: "Income minus expenses"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <i className={`${card.icon} ${card.color} text-lg`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {formatCurrency(card.value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
            <i className={`${card.icon} text-6xl ${card.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
