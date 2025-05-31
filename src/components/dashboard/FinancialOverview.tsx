"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinancialData } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useCurrencyFormatter } from "@/lib/currency";

interface FinancialOverviewProps {
  data?: FinancialData;
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrencyFormatter();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-line-chart-line text-primary" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock chart data for the last 30 days
  const mockChartData = [
    { date: 'Week 1', income: 4200, expenses: 1800, net: 2400 },
    { date: 'Week 2', income: 3800, expenses: 2100, net: 1700 },
    { date: 'Week 3', income: 5200, expenses: 1600, net: 3600 },
    { date: 'Week 4', income: 4800, expenses: 2200, net: 2600 },
  ];

  const chartData = data.chartData.length > 0 ? data.chartData : mockChartData;

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'ri-arrow-up-line';
      case 'negative': return 'ri-arrow-down-line';
      default: return 'ri-subtract-line';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-line-chart-line text-primary" />
            Financial Overview
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/transactions')}>
            <i className="ri-external-link-line mr-1" />
            View Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {data.summaryCards.map((card, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                    <i className={`${card.icon} text-primary`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <i className={`${getChangeIcon(card.changeType)} text-sm ${getChangeColor(card.changeType)}`} />
                  <span className={`text-sm font-medium ${getChangeColor(card.changeType)}`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    vs last month
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Income vs Expenses Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Income vs Expenses (Last 30 Days)
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Net</span>
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="net" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Financial Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/transactions/new?type=income')}
                className="text-xs"
              >
                <i className="ri-add-line mr-1" />
                Add Income
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/transactions/new?type=expense')}
                className="text-xs"
              >
                <i className="ri-subtract-line mr-1" />
                Add Expense
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/reports')}
                className="text-xs"
              >
                <i className="ri-file-chart-line mr-1" />
                Reports
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/balances')}
                className="text-xs"
              >
                <i className="ri-money-dollar-circle-line mr-1" />
                Balances
              </Button>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  30-Day Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 dark:text-blue-300">Total Income</p>
                    <p className="font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(data.income30Days)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-300">Total Expenses</p>
                    <p className="font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(data.expenses30Days)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-300">Net Income</p>
                    <p className="font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(data.netIncome30Days)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <i className="ri-money-dollar-circle-line text-3xl text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
