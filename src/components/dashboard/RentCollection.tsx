"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCurrencyFormatter } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { format, startOfMonth, endOfMonth, addDays, isBefore } from "date-fns";

interface RentCollectionData {
  total_expected: number;
  total_collected: number;
  collection_rate: number;
  overdue_amount: number;
  overdue_count: number;
  pending_amount: number;
  pending_count: number;
  recent_payments: RecentPayment[];
  overdue_tenants: OverdueTenant[];
}

interface RecentPayment {
  id: string;
  tenant_name: string;
  property_name: string;
  unit_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
}

interface OverdueTenant {
  id: string;
  tenant_name: string;
  property_name: string;
  unit_name: string;
  amount_due: number;
  days_overdue: number;
  last_payment_date: string;
}

export function RentCollection() {
  const router = useRouter();
  const { formatCurrency } = useCurrencyFormatter();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ['rent-collection', user?.id],
    queryFn: async (): Promise<RentCollectionData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date();
      const currentMonthStart = startOfMonth(today);
      const currentMonthEnd = endOfMonth(today);

      // Get active leases with tenant and property information
      const { data: leases, error } = await supabase
        .from('leases')
        .select(`
          id,
          rent_amount,
          start_date,
          end_date,
          status,
          unit:unit_id (
            id,
            name,
            properties:property_id (
              id,
              name,
              user_id
            )
          ),
          lease_tenants:lease_tenants!lease_id (
            id,
            is_primary,
            tenants:tenant_id (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('status', 'active')
        .eq('unit.properties.user_id', user.id);

      if (error) throw error;

      // Get transactions for this month
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'income')
        .gte('created_at', currentMonthStart.toISOString())
        .lte('created_at', currentMonthEnd.toISOString());

      if (transError) throw transError;

      // Calculate expected rent for this month
      const totalExpected = (leases || []).reduce((sum, lease) => {
        return sum + (lease.rent_amount || 0);
      }, 0);

      // Calculate collected rent (from transactions)
      const totalCollected = (transactions || []).reduce((sum, transaction) => {
        return sum + (transaction.amount || 0);
      }, 0);

      // Calculate collection rate
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      // Mock data for overdue and pending amounts (in real app, this would come from payment tracking)
      const overdueAmount = totalExpected * 0.15; // 15% overdue
      const overdueCount = Math.floor((leases || []).length * 0.2); // 20% of tenants
      const pendingAmount = totalExpected - totalCollected - overdueAmount;
      const pendingCount = (leases || []).length - overdueCount - Math.floor((leases || []).length * 0.6);

      // Mock recent payments (in real app, this would come from payment records)
      const recentPayments: RecentPayment[] = (transactions || [])
        .slice(0, 5)
        .map((transaction, index) => {
          const lease = leases?.[index % (leases?.length || 1)];
          const tenant = lease?.lease_tenants?.find(lt => lt.is_primary)?.tenants;

          // Handle both single tenant object and array of tenants
          const tenantData = Array.isArray(tenant) ? tenant[0] : tenant;

          return {
            id: transaction.id,
            tenant_name: tenantData ? `${tenantData.first_name} ${tenantData.last_name}` : 'Unknown Tenant',
            property_name: lease?.unit?.properties?.name || 'Unknown Property',
            unit_name: lease?.unit?.name || 'Unknown Unit',
            amount: transaction.amount || 0,
            payment_date: transaction.created_at,
            payment_method: 'Bank Transfer', // Mock data
            status: 'completed'
          };
        });

      // Mock overdue tenants
      const overdueTenants: OverdueTenant[] = (leases || [])
        .slice(0, overdueCount)
        .map((lease, index) => {
          const tenant = lease.lease_tenants?.find(lt => lt.is_primary)?.tenants;

          // Handle both single tenant object and array of tenants
          const tenantData = Array.isArray(tenant) ? tenant[0] : tenant;

          return {
            id: lease.id,
            tenant_name: tenantData ? `${tenantData.first_name} ${tenantData.last_name}` : 'Unknown Tenant',
            property_name: lease.unit?.properties?.name || 'Unknown Property',
            unit_name: lease.unit?.name || 'Unknown Unit',
            amount_due: lease.rent_amount || 0,
            days_overdue: 5 + (index * 3), // Mock overdue days
            last_payment_date: addDays(today, -(30 + index * 5)).toISOString()
          };
        });

      return {
        total_expected: totalExpected,
        total_collected: totalCollected,
        collection_rate: collectionRate,
        overdue_amount: overdueAmount,
        overdue_count: overdueCount,
        pending_amount: Math.max(0, pendingAmount),
        pending_count: Math.max(0, pendingCount),
        recent_payments: recentPayments,
        overdue_tenants: overdueTenants
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-700 dark:text-green-300';
    if (rate >= 85) return 'text-gray-700 dark:text-gray-300';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getCollectionRateBg = (rate: number) => {
    if (rate >= 95) return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
    if (rate >= 85) return 'bg-gray-50 dark:bg-gray-800/50 border';
    return 'bg-gray-50 dark:bg-gray-800/50 border';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-money-dollar-circle-line text-primary" />
            Rent Collection
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
            <i className="ri-money-dollar-circle-line text-primary" />
            Rent Collection
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/finances')}>
            <i className="ri-external-link-line mr-1" />
            View Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="text-center py-8">
            <i className="ri-money-dollar-circle-line text-4xl text-gray-400 mb-4 block" />
            <p className="text-gray-600 dark:text-gray-400">No collection data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Collection Rate Overview */}
            <div className={`p-4 rounded-lg ${getCollectionRateBg(data.collection_rate)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">This Month's Collection Rate</span>
                <span className={`text-2xl font-bold ${getCollectionRateColor(data.collection_rate)}`}>
                  {data.collection_rate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Collected: {formatCurrency(data.total_collected)}</span>
                <span>Expected: {formatCurrency(data.total_expected)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    data.collection_rate >= 95 ? 'bg-green-600' :
                    data.collection_rate >= 85 ? 'bg-gray-400' : 'bg-gray-300'
                  }`}
                  style={{ width: `${Math.min(data.collection_rate, 100)}%` }}
                />
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(data.total_collected)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Collected</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.overdue_amount)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Overdue ({data.overdue_count})</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.pending_amount)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pending ({data.pending_count})</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.total_expected)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Expected</div>
              </div>
            </div>

            {/* Overdue Tenants Alert */}
            {data.overdue_tenants.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <i className="ri-alarm-warning-line text-gray-600 dark:text-gray-400" />
                  Overdue Payments ({data.overdue_tenants.length})
                </h4>
                <div className="space-y-2">
                  {data.overdue_tenants.slice(0, 3).map((tenant) => (
                    <div
                      key={tenant.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tenant.tenant_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {tenant.property_name} • {tenant.unit_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(tenant.amount_due)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {tenant.days_overdue} days overdue
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Payments */}
            {data.recent_payments.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Payments</h4>
                <div className="space-y-2">
                  {data.recent_payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{payment.tenant_name}</span>
                          <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.property_name} • {payment.unit_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(payment.payment_date), 'MMM dd')}
                        </div>
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
