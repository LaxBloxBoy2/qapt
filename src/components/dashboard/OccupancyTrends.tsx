"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface OccupancyData {
  month: string;
  occupancy_rate: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
}

export function OccupancyTrends() {
  const router = useRouter();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ['occupancy-trends', user?.id],
    queryFn: async (): Promise<OccupancyData[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get last 6 months of data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          date,
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM yyyy')
        });
      }

      // Get properties and units
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          units:units!property_id (
            id,
            name,
            leases:leases!unit_id (
              id,
              status,
              start_date,
              end_date
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate occupancy for each month
      const occupancyData: OccupancyData[] = months.map(month => {
        let totalUnits = 0;
        let occupiedUnits = 0;

        properties?.forEach(property => {
          property.units?.forEach(unit => {
            totalUnits++;
            
            // Check if unit was occupied during this month
            const hasActiveLease = unit.leases?.some(lease => {
              if (!lease.start_date) return false;
              
              const leaseStart = new Date(lease.start_date);
              const leaseEnd = lease.end_date ? new Date(lease.end_date) : new Date();
              
              // Check if lease overlaps with the month
              return leaseStart <= month.end && leaseEnd >= month.start;
            });
            
            if (hasActiveLease) {
              occupiedUnits++;
            }
          });
        });

        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        return {
          month: month.label,
          occupancy_rate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
          total_units: totalUnits,
          occupied_units: occupiedUnits,
          vacant_units: totalUnits - occupiedUnits
        };
      });

      return occupancyData;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const currentOccupancy = data?.[data.length - 1];
  const previousOccupancy = data?.[data.length - 2];
  const occupancyChange = currentOccupancy && previousOccupancy 
    ? currentOccupancy.occupancy_rate - previousOccupancy.occupancy_rate 
    : 0;

  const getOccupancyColor = (rate: number) => {
    if (rate >= 95) return 'text-green-700 dark:text-green-300';
    if (rate >= 85) return 'text-gray-700 dark:text-gray-300';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getOccupancyBg = (rate: number) => {
    if (rate >= 95) return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
    if (rate >= 85) return 'bg-gray-50 dark:bg-gray-800/50 border';
    return 'bg-gray-50 dark:bg-gray-800/50 border';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return 'ri-arrow-up-line text-green-600 dark:text-green-400';
    if (change < 0) return 'ri-arrow-down-line text-gray-600 dark:text-gray-400';
    return 'ri-subtract-line text-gray-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-bar-chart-line text-primary" />
            Occupancy Trends
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
            <i className="ri-bar-chart-line text-primary" />
            Occupancy Trends
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/properties')}>
            <i className="ri-external-link-line mr-1" />
            View Properties
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-bar-chart-line text-4xl text-gray-400 mb-4 block" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No occupancy data available</p>
            <Button onClick={() => router.push('/properties/new')}>
              <i className="ri-add-line mr-2" />
              Add Property
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Occupancy Summary */}
            {currentOccupancy && (
              <div className={`p-4 rounded-lg ${getOccupancyBg(currentOccupancy.occupancy_rate)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Current Occupancy Rate</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getOccupancyColor(currentOccupancy.occupancy_rate)}`}>
                      {currentOccupancy.occupancy_rate}%
                    </span>
                    {occupancyChange !== 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <i className={getChangeIcon(occupancyChange)} />
                        <span className={occupancyChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                          {Math.abs(occupancyChange).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {currentOccupancy.occupied_units} of {currentOccupancy.total_units} units occupied
                  </span>
                  <span>
                    {currentOccupancy.vacant_units} vacant
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentOccupancy.occupancy_rate >= 95 ? 'bg-green-600' :
                      currentOccupancy.occupancy_rate >= 85 ? 'bg-gray-400' : 'bg-gray-300'
                    }`}
                    style={{ width: `${currentOccupancy.occupancy_rate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trend Chart */}
            <div>
              <h4 className="font-medium mb-3">6-Month Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm">
                                <span className="text-green-600 dark:text-green-400">Occupancy: {data.occupancy_rate}%</span>
                              </p>
                              <p className="text-xs text-gray-600">
                                {data.occupied_units}/{data.total_units} units occupied
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="occupancy_rate"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div>
              <h4 className="font-medium mb-3">Monthly Breakdown</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {data.slice(-3).map((monthData, index) => (
                  <div key={monthData.month} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {monthData.month}
                    </div>
                    <div className="text-lg font-bold">
                      {monthData.occupancy_rate}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {monthData.occupied_units}/{monthData.total_units} units
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
