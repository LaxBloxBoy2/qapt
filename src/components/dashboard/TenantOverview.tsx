"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { addDays, format, isAfter, isBefore } from "date-fns";

interface TenantOverviewData {
  total_tenants: number;
  active_tenants: number;
  move_ins_this_month: number;
  move_outs_this_month: number;
  upcoming_move_ins: TenantMovement[];
  upcoming_move_outs: TenantMovement[];
  recent_tenants: RecentTenant[];
}

interface TenantMovement {
  id: string;
  tenant_name: string;
  property_name: string;
  unit_name: string;
  date: string;
  type: 'move_in' | 'move_out';
}

interface RecentTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  property_name: string;
  unit_name: string;
  lease_start: string;
  lease_status: string;
}

export function TenantOverview() {
  const router = useRouter();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-overview', user?.id],
    queryFn: async (): Promise<TenantOverviewData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const next30Days = addDays(today, 30);

      // Get all tenants with their leases and property info
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at,
          lease_tenants:lease_tenants!tenant_id (
            id,
            lease_id,
            is_primary,
            leases:lease_id (
              id,
              status,
              start_date,
              end_date,
              rent_amount,
              unit:unit_id (
                id,
                name,
                properties:property_id (
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Process tenant data
      const activeTenants = tenants?.filter(tenant =>
        tenant.lease_tenants?.some(lt => {
          const lease = Array.isArray(lt.leases) ? lt.leases[0] : lt.leases;
          return lease?.status === 'active';
        })
      ) || [];

      const totalTenants = tenants?.length || 0;

      // Calculate move-ins and move-outs this month
      const moveInsThisMonth = tenants?.filter(tenant =>
        tenant.lease_tenants?.some(lt => {
          const lease = Array.isArray(lt.leases) ? lt.leases[0] : lt.leases;
          if (!lease?.start_date) return false;
          const startDate = new Date(lease.start_date);
          return startDate >= startOfMonth && startDate <= endOfMonth;
        })
      ).length || 0;

      const moveOutsThisMonth = tenants?.filter(tenant =>
        tenant.lease_tenants?.some(lt => {
          const lease = Array.isArray(lt.leases) ? lt.leases[0] : lt.leases;
          if (!lease?.end_date || lease.status !== 'expired') return false;
          const endDate = new Date(lease.end_date);
          return endDate >= startOfMonth && endDate <= endOfMonth;
        })
      ).length || 0;

      // Get upcoming move-ins (next 30 days)
      const upcomingMoveIns: TenantMovement[] = [];
      tenants?.forEach(tenant => {
        tenant.lease_tenants?.forEach(lt => {
          const lease = Array.isArray(lt.leases) ? lt.leases[0] : lt.leases;
          if (lease?.status === 'upcoming' && lease.start_date) {
            const startDate = new Date(lease.start_date);
            if (isAfter(startDate, today) && isBefore(startDate, next30Days)) {
              upcomingMoveIns.push({
                id: tenant.id,
                tenant_name: `${tenant.first_name} ${tenant.last_name}`,
                property_name: lease.unit?.properties?.[0]?.name || 'Unknown Property',
                unit_name: lease.unit?.name || 'Unknown Unit',
                date: lease.start_date,
                type: 'move_in'
              });
            }
          }
        });
      });

      // Get upcoming move-outs (next 30 days)
      const upcomingMoveOuts: TenantMovement[] = [];
      tenants?.forEach(tenant => {
        tenant.lease_tenants?.forEach(lt => {
          const lease = Array.isArray(lt.leases) ? lt.leases[0] : lt.leases;
          if (lease?.status === 'active' && lease.end_date) {
            const endDate = new Date(lease.end_date);
            if (isAfter(endDate, today) && isBefore(endDate, next30Days)) {
              upcomingMoveOuts.push({
                id: tenant.id,
                tenant_name: `${tenant.first_name} ${tenant.last_name}`,
                property_name: lease.unit?.properties?.[0]?.name || 'Unknown Property',
                unit_name: lease.unit?.name || 'Unknown Unit',
                date: lease.end_date,
                type: 'move_out'
              });
            }
          }
        });
      });

      // Get recent tenants (last 5 added)
      const recentTenants: RecentTenant[] = (tenants || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(tenant => {
          const primaryLease = tenant.lease_tenants?.find(lt => lt.is_primary)?.leases;
          const lease = Array.isArray(primaryLease) ? primaryLease[0] : primaryLease;
          return {
            id: tenant.id,
            first_name: tenant.first_name,
            last_name: tenant.last_name,
            email: tenant.email || '',
            phone: tenant.phone || '',
            property_name: lease?.unit?.properties?.[0]?.name || 'No Property',
            unit_name: lease?.unit?.name || 'No Unit',
            lease_start: lease?.start_date || '',
            lease_status: lease?.status || 'unknown'
          };
        });

      return {
        total_tenants: totalTenants,
        active_tenants: activeTenants.length,
        move_ins_this_month: moveInsThisMonth,
        move_outs_this_month: moveOutsThisMonth,
        upcoming_move_ins: upcomingMoveIns.slice(0, 3),
        upcoming_move_outs: upcomingMoveOuts.slice(0, 3),
        recent_tenants: recentTenants
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Active</Badge>;
      case 'upcoming':
        return <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">Upcoming</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-gray-600 dark:text-gray-400">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-user-3-line text-primary" />
            Tenant Overview
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
            <i className="ri-user-3-line text-primary" />
            Tenant Overview
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/tenants')}>
            <i className="ri-external-link-line mr-1" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="text-center py-8">
            <i className="ri-user-3-line text-4xl text-gray-400 mb-4 block" />
            <p className="text-gray-600 dark:text-gray-400">No tenant data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.total_tenants}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Tenants</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{data.active_tenants}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Active</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.move_ins_this_month}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Move-ins</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.move_outs_this_month}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Move-outs</div>
              </div>
            </div>

            {/* Upcoming Movements */}
            {(data.upcoming_move_ins.length > 0 || data.upcoming_move_outs.length > 0) && (
              <div>
                <h4 className="font-medium mb-3">Upcoming Movements (Next 30 Days)</h4>
                <div className="space-y-2">
                  {data.upcoming_move_ins.map((movement) => (
                    <div key={`in-${movement.id}`} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <i className="ri-arrow-right-circle-line text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{movement.tenant_name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">moving into {movement.unit_name}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(movement.date), 'MMM dd')}</span>
                    </div>
                  ))}
                  {data.upcoming_move_outs.map((movement) => (
                    <div key={`out-${movement.id}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <i className="ri-arrow-left-circle-line text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{movement.tenant_name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">moving out of {movement.unit_name}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(movement.date), 'MMM dd')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tenants */}
            {data.recent_tenants.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Tenants</h4>
                <div className="space-y-2">
                  {data.recent_tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => router.push(`/tenants/${tenant.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{tenant.first_name} {tenant.last_name}</span>
                          {getStatusBadge(tenant.lease_status)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {tenant.property_name} • {tenant.unit_name}
                        </div>
                      </div>
                      <i className="ri-arrow-right-s-line text-gray-400" />
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
