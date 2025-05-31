"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCurrencyFormatter } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface PropertyPerformanceData {
  id: string;
  name: string;
  address: string;
  total_revenue: number;
  occupancy_rate: number;
  unit_count: number;
  occupied_units: number;
  avg_rent: number;
  performance_score: number;
}

export function PropertyPerformance() {
  const router = useRouter();
  const { formatCurrency } = useCurrencyFormatter();
  const { user } = useUser();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['property-performance', user?.id],
    queryFn: async (): Promise<PropertyPerformanceData[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get properties with their units and active leases
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          address,
          units:units!property_id (
            id,
            market_rent,
            status,
            leases:leases!unit_id (
              id,
              status,
              rent_amount
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate performance metrics for each property
      const performanceData: PropertyPerformanceData[] = (data || []).map(property => {
        const units = property.units || [];
        const totalUnits = units.length;

        // Calculate occupied units (units with active leases)
        const occupiedUnits = units.filter(unit =>
          unit.leases?.some(lease => lease.status === 'active')
        ).length;

        // Calculate total revenue (sum of active lease rents)
        const totalRevenue = units.reduce((sum, unit) => {
          const activeLease = unit.leases?.find(lease => lease.status === 'active');
          return sum + (activeLease?.rent_amount || 0);
        }, 0);

        // Calculate average rent
        const avgRent = totalUnits > 0 ?
          units.reduce((sum, unit) => sum + (unit.market_rent || 0), 0) / totalUnits : 0;

        // Calculate occupancy rate
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        // Calculate performance score (weighted average of occupancy and revenue)
        const performanceScore = (occupancyRate * 0.6) + ((totalRevenue / 10000) * 0.4);

        return {
          id: property.id,
          name: property.name,
          address: property.address || '',
          total_revenue: totalRevenue,
          occupancy_rate: occupancyRate,
          unit_count: totalUnits,
          occupied_units: occupiedUnits,
          avg_rent: avgRent,
          performance_score: Math.min(performanceScore, 100)
        };
      });

      // Sort by performance score (highest first)
      return performanceData.sort((a, b) => b.performance_score - a.performance_score);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-700 dark:text-green-300' };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const, color: 'text-green-600 dark:text-green-400' };
    if (score >= 40) return { label: 'Average', variant: 'outline' as const, color: 'text-gray-600 dark:text-gray-400' };
    return { label: 'Needs Attention', variant: 'outline' as const, color: 'text-gray-500 dark:text-gray-500' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="ri-building-line text-primary" />
            Property Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
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
            <i className="ri-building-line text-primary" />
            Property Performance
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/properties')}>
            <i className="ri-external-link-line mr-1" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!properties || properties.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-building-line text-4xl text-gray-400 mb-4 block" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No properties found</p>
            <Button onClick={() => router.push('/properties/new')}>
              <i className="ri-add-line mr-2" />
              Add Property
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.slice(0, 5).map((property) => {
              const badge = getPerformanceBadge(property.performance_score);
              
              return (
                <div
                  key={property.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/properties/${property.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {property.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {property.address}
                      </p>
                    </div>
                    <Badge variant={badge.variant} className="ml-2">
                      {badge.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(property.total_revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Occupancy</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {property.occupancy_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Units</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {property.occupied_units}/{property.unit_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Avg Rent</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(property.avg_rent)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Performance Score Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Performance Score</span>
                      <span>{property.performance_score.toFixed(1)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          property.performance_score >= 80 ? 'bg-green-600' :
                          property.performance_score >= 60 ? 'bg-green-500' :
                          property.performance_score >= 40 ? 'bg-gray-400' : 'bg-gray-300'
                        }`}
                        style={{ width: `${property.performance_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
