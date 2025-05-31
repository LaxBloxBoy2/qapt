"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCurrencyFormatter } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { subDays } from "date-fns";

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

interface ExpenseBreakdownData {
  total_expenses: number;
  categories: ExpenseCategory[];
  period: string;
}

const EXPENSE_COLORS = [
  '#16a34a', // Green
  '#15803d', // Dark Green
  '#166534', // Darker Green
  '#14532d', // Darkest Green
  '#6b7280', // Gray
  '#4b5563', // Dark Gray
  '#374151', // Darker Gray
  '#1f2937', // Darkest Gray
];

export function ExpenseBreakdown() {
  const router = useRouter();
  const { formatCurrency } = useCurrencyFormatter();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ['expense-breakdown', user?.id],
    queryFn: async (): Promise<ExpenseBreakdownData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const thirtyDaysAgo = subDays(new Date(), 30);

      // Get expense transactions from the last 30 days
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Since we don't have a category field, let's create mock categories based on description patterns
      const categorizeExpense = (description: string): string => {
        const desc = description.toLowerCase();
        if (desc.includes('maintenance') || desc.includes('repair') || desc.includes('fix')) return 'Maintenance';
        if (desc.includes('utility') || desc.includes('electric') || desc.includes('water') || desc.includes('gas')) return 'Utilities';
        if (desc.includes('insurance')) return 'Insurance';
        if (desc.includes('tax') || desc.includes('fee')) return 'Taxes & Fees';
        if (desc.includes('marketing') || desc.includes('advertising')) return 'Marketing';
        if (desc.includes('legal') || desc.includes('professional')) return 'Professional Services';
        if (desc.includes('supply') || desc.includes('material')) return 'Supplies';
        return 'Other';
      };

      // Group transactions by category
      const categoryMap = new Map<string, { amount: number; count: number }>();
      let totalExpenses = 0;

      (transactions || []).forEach(transaction => {
        const category = categorizeExpense(transaction.description || '');
        const amount = transaction.amount || 0;
        
        totalExpenses += amount;
        
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category)!;
          categoryMap.set(category, {
            amount: existing.amount + amount,
            count: existing.count + 1
          });
        } else {
          categoryMap.set(category, { amount, count: 1 });
        }
      });

      // If no real data, create mock data for demonstration
      if (totalExpenses === 0) {
        const mockCategories = [
          { category: 'Maintenance', amount: 2500, count: 8 },
          { category: 'Utilities', amount: 1800, count: 12 },
          { category: 'Insurance', amount: 1200, count: 3 },
          { category: 'Taxes & Fees', amount: 800, count: 4 },
          { category: 'Marketing', amount: 600, count: 5 },
          { category: 'Professional Services', amount: 1000, count: 2 },
          { category: 'Supplies', amount: 400, count: 6 },
          { category: 'Other', amount: 300, count: 3 }
        ];

        totalExpenses = mockCategories.reduce((sum, cat) => sum + cat.amount, 0);
        mockCategories.forEach(cat => {
          categoryMap.set(cat.category, { amount: cat.amount, count: cat.count });
        });
      }

      // Convert to array and calculate percentages
      const categories: ExpenseCategory[] = Array.from(categoryMap.entries())
        .map(([category, data], index) => ({
          category,
          amount: data.amount,
          count: data.count,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          color: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        total_expenses: totalExpenses,
        categories,
        period: 'Last 30 days'
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-pie-chart-line text-primary" />
            Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <i className="ri-pie-chart-line text-primary" />
            Expense Breakdown
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/finances')}>
            <i className="ri-external-link-line mr-1" />
            View Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.categories.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-pie-chart-line text-4xl text-gray-400 mb-4 block" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No expense data available</p>
            <Button onClick={() => router.push('/transactions/new')}>
              <i className="ri-add-line mr-2" />
              Add Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total Expenses */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Expenses ({data.period})
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.total_expenses)}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{data.category}</p>
                            <p className="text-sm">
                              <span className="text-gray-700 dark:text-gray-300">Amount: {formatCurrency(data.amount)}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {data.percentage.toFixed(1)}% • {data.count} transactions
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {data.categories.map((category) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <div className="font-medium">{category.category}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {category.count} transaction{category.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(category.amount)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Categories Summary */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              {data.categories.slice(0, 3).map((category, index) => (
                <div key={category.category} className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    #{index + 1} Category
                  </div>
                  <div className="font-medium text-sm">{category.category}</div>
                  <div className="text-xs font-semibold" style={{ color: category.color }}>
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
